import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, ensureDbReady, now } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, university, studentId } = body;

    if (
      typeof fullName !== "string" ||
      typeof university !== "string" ||
      typeof studentId !== "string"
    ) {
      return NextResponse.json(
        { error: "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    await ensureDbReady();
    const db = getDb();

    await db.execute({
      sql: `UPDATE user
            SET fullName = ?, university = ?, studentId = ?, updatedAt = ?
            WHERE id = ?`,
      args: [fullName, university, studentId, now(), userId],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/user/profile]", err);
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }
}