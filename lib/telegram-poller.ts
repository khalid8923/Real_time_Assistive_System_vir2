import {
  markDoctorReplied,
  getDoctorReply,
  cleanupOldDoctorReplies,
} from "@/lib/db/queries";

const TELEGRAM_API = "https://api.telegram.org";

let started = false;
let running = false;
let offset = 0;
let tickCount = 0;

interface CallbackQuery {
  id: string;
  data?: string;
  message?: {
    chat: { id: number };
    message_id: number;
    text?: string;
  };
}

interface Update {
  update_id: number;
  callback_query?: CallbackQuery;
}

async function answerCallback(
  token: string,
  callbackId: string,
  text: string
): Promise<void> {
  try {
    await fetch(`${TELEGRAM_API}/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackId, text }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* ignore */
  }
}

async function handleCallback(cb: CallbackQuery): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return;

  const data = String(cb.data ?? "");
  const parts = data.split(":");
  if (parts.length !== 3 || parts[0] !== "reply") {
    await answerCallback(token, cb.id, "أمر غير معروف");
    return;
  }

  const recordId = parts[1];
  const replyType = parts[2] as "replied" | "come_office";

  if (replyType !== "replied" && replyType !== "come_office") {
    await answerCallback(token, cb.id, "أمر غير معروف");
    return;
  }

  const record = await getDoctorReply(recordId);
  if (!record) {
    await answerCallback(token, cb.id, "الطلب مش موجود");
    return;
  }

  if (record.status !== "pending") {
    await answerCallback(token, cb.id, "تم الرد بالفعل");
    return;
  }

  const ok = await markDoctorReplied(recordId, replyType);
  if (!ok) {
    await answerCallback(token, cb.id, "فشل الحفظ");
    return;
  }

  const answerText =
    replyType === "replied" ? "تم تسجيل الرد" : "تم إبلاغ الطالب";
  await answerCallback(token, cb.id, answerText);

  const label =
    replyType === "replied"
      ? "\n\nتم الرد على الطالب"
      : "\n\nالطالب جاي المكتب بعد المحاضرة";

  const originalText = cb.message?.text ?? "";
  const newText = originalText + label;

  if (cb.message) {
    try {
      await fetch(`${TELEGRAM_API}/bot${token}/editMessageText`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: cb.message.chat.id,
          message_id: cb.message.message_id,
          text: newText,
          reply_markup: { inline_keyboard: [] },
        }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      /* ignore */
    }
  }

  console.log(`[telegram-poller] reply ${replyType} for ${recordId}`);
}

async function tick(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    if (!token) return;

    const res = await fetch(
      `${TELEGRAM_API}/bot${token}/getUpdates?offset=${offset}&timeout=0`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return;

    const data = (await res.json()) as { ok: boolean; result?: Update[] };
    if (!data.ok || !Array.isArray(data.result)) return;

    for (const u of data.result) {
      if (u.update_id >= offset) offset = u.update_id + 1;
      if (u.callback_query) {
        try {
          await handleCallback(u.callback_query);
        } catch (err) {
          console.error("[telegram-poller] callback error:", err);
        }
      }
    }

    tickCount++;
    if (tickCount % 200 === 0) {
      try {
        await cleanupOldDoctorReplies();
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* silent */
  } finally {
    running = false;
  }
}

export function startPoller(): void {
  if (started) return;
  started = true;
  setTimeout(() => void tick(), 1000);
  const timer = setInterval(() => void tick(), 3000);
  if (typeof timer === "object" && "unref" in timer) {
    (timer as { unref: () => void }).unref();
  }
  console.log("[telegram-poller] started");
}