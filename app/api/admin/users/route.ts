import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { getDb, ensureDbReady } from "@/lib/db";

export const runtime = "nodejs";

function isAdmin(request: NextRequest): boolean {
  return request.cookies.get("admin_mode")?.value === "true";
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  emailVerified: number;
  image: string | null;
  fullName: string | null;
  university: string | null;
  studentId: string | null;
  role: string | null;
  createdAt: number;
  updatedAt: number;
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 30, 60_000).ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 }
    );
  }

  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureDbReady();
    const db = getDb();

    const result = await db.execute({
      sql: `SELECT 
              id, name, email, emailVerified, image,
              fullName, university, studentId, role,
              createdAt, updatedAt
            FROM user
            ORDER BY createdAt DESC`,
    });

    const users = result.rows as unknown as UserRow[];
    return NextResponse.json({ users });
  } catch (err) {
    console.error("[admin/users]", err);
    return NextResponse.json({ error: "Load failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 30, 60_000).ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 }
    );
  }

  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await ensureDbReady();
    const db = getDb();

    await db.execute({
      sql: "DELETE FROM session WHERE userId = ?",
      args: [userId],
    });
    await db.execute({
      sql: "DELETE FROM account WHERE userId = ?",
      args: [userId],
    });
    await db.execute({
      sql: "DELETE FROM user WHERE id = ?",
      args: [userId],
    });

    console.log(`[admin/users] Deleted user ${userId}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/users:delete]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}