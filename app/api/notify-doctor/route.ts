import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  createDoctorReply,
  setDoctorReplyMessageId,
} from "@/lib/db/queries";
import { startPoller } from "@/lib/telegram-poller";

export const runtime = "nodejs";
export const maxDuration = 15;

export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!botToken || !chatId) {
    return NextResponse.json(
      { error: "Telegram not configured" },
      { status: 503 }
    );
  }

  // Start the poller (idempotent)
  startPoller();

  // Rate limit: 1 per 30s per IP
  const ip = getClientIp(request);
  const rl = rateLimit(ip, 1, 30_000, "notify-doctor");
  if (!rl.ok) {
    const secondsLeft = Math.ceil(rl.resetIn / 1000);
    return NextResponse.json(
      { error: `استنى ${secondsLeft} ثانية قبل ما تبعت تاني.` },
      { status: 429 }
    );
  }

  // Optional body
  let body: { studentKey?: string; displayName?: string } = {};
  try {
    body = await request.json();
  } catch {
    /* no body is fine */
  }

  const studentKey =
    (body.studentKey ?? "").trim().slice(0, 80) || `ip:${ip}`;

  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const sessionName =
    session?.user?.name || session?.user?.email?.split("@")[0];
  const studentName = (sessionName || body.displayName || "طالب")
    .trim()
    .slice(0, 60);

  // Save record
  const record = await createDoctorReply(studentKey, studentName);

  const time = new Date().toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const message =
    `طالب محتاج يسأل\n\n` +
    `الاسم: ${studentName}\n` +
    `الوقت: ${time}`;

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          disable_notification: false,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "تم الرد",
                  callback_data: `reply:${record.id}:replied`,
                },
                {
                  text: "تعلالي في المكتب",
                  callback_data: `reply:${record.id}:come_office`,
                },
              ],
            ],
          },
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[notify-doctor] Telegram error:", res.status, errText);
      return NextResponse.json(
        { error: "Telegram send failed" },
        { status: 502 }
      );
    }

    const tgData = (await res.json()) as {
      ok: boolean;
      result?: { message_id?: number };
    };
    const messageId = tgData.result?.message_id;
    if (messageId) await setDoctorReplyMessageId(record.id, messageId);

    console.log(
      `[notify-doctor] OK | student="${studentName}" | recordId=${record.id}`
    );

    return NextResponse.json({
      ok: true,
      recordId: record.id,
      studentName,
      time,
    });
  } catch (err) {
    console.error("[notify-doctor] Threw:", err);
    return NextResponse.json({ error: "Network error" }, { status: 502 });
  }
}