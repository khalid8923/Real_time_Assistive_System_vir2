import { NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_mode", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}