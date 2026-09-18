import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { now } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

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
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const db = getDb();
    db.prepare(
      `UPDATE user
       SET fullName = ?, university = ?, studentId = ?, updatedAt = ?
       WHERE id = ?`
    ).run(fullName, university, studentId, now(), userId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/user/profile]", err);
    return NextResponse.json({ error: "فشل التحديث" }, { status: 500 });
  }
}