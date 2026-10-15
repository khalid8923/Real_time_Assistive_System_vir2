import { NextRequest, NextResponse } from "next/server";
import { getDb, ensureDbReady } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const adminPass = process.env.ADMIN_PASSWORD?.trim();
  const key = request.headers.get("x-admin-key") || "";
  if (!adminPass || key !== adminPass) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await ensureDbReady();
  const db = getDb();
  const result = await db.execute({
    sql: "UPDATE user SET emailVerified = 1 WHERE email = ?",
    args: ["k77829996@gmail.com"],
  });

  return NextResponse.json({
    ok: true,
    rowsAffected: result.rowsAffected ?? 0,
  });
}