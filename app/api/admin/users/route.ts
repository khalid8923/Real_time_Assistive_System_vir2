import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Database from "better-sqlite3";

export const runtime = "nodejs";

const db = new Database("./sqlite.db");

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const users = db
      .prepare(
        `
        SELECT 
          id, 
          name, 
          email, 
          emailVerified, 
          image, 
          fullName, 
          university, 
          studentId, 
          role, 
          createdAt, 
          updatedAt
        FROM user
        ORDER BY createdAt DESC
      `
      )
      .all();

    return NextResponse.json({ users });
  } catch (err) {
    console.error("[admin/users]", err);
    return NextResponse.json({ error: "فشل التحميل" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ error: "ID مطلوب" }, { status: 400 });
    }

    // Delete user + sessions + accounts
    db.prepare("DELETE FROM session WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM account WHERE userId = ?").run(userId);
    db.prepare("DELETE FROM user WHERE id = ?").run(userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/users:delete]", err);
    return NextResponse.json({ error: "فشل الحذف" }, { status: 500 });
  }
}