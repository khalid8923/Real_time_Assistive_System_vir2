import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword } from "@/lib/db/queries";

export const runtime = "nodejs";

interface LoginBody {
  password: string;
}

const attempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;

function getClientKey(request: NextRequest): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return ip;
}

export async function POST(request: NextRequest) {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword) {
    console.error("[admin/login] ADMIN_PASSWORD is not set");
    return NextResponse.json(
      { error: "Server misconfiguration." },
      { status: 500 }
    );
  }

  const clientKey = getClientKey(request);
  const record = attempts.get(clientKey);

  if (record && record.lockedUntil > Date.now()) {
    const secondsLeft = Math.ceil((record.lockedUntil - Date.now()) / 1000);
    return NextResponse.json(
      { error: `محاولات كثيرة. حاول بعد ${secondsLeft} ثانية.` },
      { status: 429 }
    );
  }

  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const { password } = body;
  if (typeof password !== "string" || password.trim().length === 0) {
    return NextResponse.json({ error: "الباسورد مطلوب." }, { status: 400 });
  }

  const isValid = await verifyAdminPassword(password.trim());

  if (!isValid) {
    const current = attempts.get(clientKey) ?? { count: 0, lockedUntil: 0 };
    current.count += 1;

    if (current.count >= MAX_ATTEMPTS) {
      current.lockedUntil = Date.now() + LOCK_MS;
      current.count = 0;
      attempts.set(clientKey, current);
      console.warn(`[admin/login] ✗ ${clientKey} locked`);

      return NextResponse.json(
        { error: "محاولات كثيرة. تم القفل مؤقتاً لـ 5 دقايق." },
        { status: 429 }
      );
    }

    attempts.set(clientKey, current);
    console.warn(
      `[admin/login] ✗ ${clientKey} wrong password (${current.count}/${MAX_ATTEMPTS})`
    );

    return NextResponse.json({ error: "باسورد خاطئ." }, { status: 401 });
  }

  attempts.delete(clientKey);

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_mode", "true", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  console.log(`[admin/login] ✓ ${clientKey} logged in`);
  return response;
}