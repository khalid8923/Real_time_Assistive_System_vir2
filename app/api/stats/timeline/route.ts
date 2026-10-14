import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDb, ensureDbReady } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureDbReady();
    const db = getDb();

    // آخر 30 يوم
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const lecturesResult = await db.execute({
      sql: `SELECT createdAt, wordCount
            FROM saved_lectures
            WHERE userId = ? AND createdAt >= ?
            ORDER BY createdAt ASC`,
      args: [userId, thirtyDaysAgo],
    });

    const dailyMap = new Map<string, { lectures: number; words: number }>();
    for (const row of lecturesResult.rows) {
      const d = new Date(Number(row.createdAt));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const cur = dailyMap.get(key) ?? { lectures: 0, words: 0 };
      cur.lectures += 1;
      cur.words += Number(row.wordCount || 0);
      dailyMap.set(key, cur);
    }

    // املأ الأيام الفاضية
    const timeline: Array<{
      date: string;
      label: string;
      lectures: number;
      words: number;
    }> = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const data = dailyMap.get(key) ?? { lectures: 0, words: 0 };
      timeline.push({
        date: key,
        label: d.toLocaleDateString("ar-EG", { day: "numeric", month: "short" }),
        lectures: data.lectures,
        words: data.words,
      });
    }

    return NextResponse.json({ timeline });
  } catch (err) {
    console.error("[stats/timeline]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}