"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb, ensureDbReady } from "@/lib/db";

interface FullUser {
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

export async function getFullUser(): Promise<FullUser | null> {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    const userId = session?.user?.id;

    if (!userId) return null;

    await ensureDbReady();
    const db = getDb();

    const result = await db.execute({
      sql: `SELECT
              id, name, email, emailVerified, image,
              fullName, university, studentId, role,
              createdAt, updatedAt
            FROM user
            WHERE id = ?`,
      args: [userId],
    });

    const row = result.rows[0];
    if (!row) return null;

    const out: Record<string, unknown> = {};
    for (const k of Object.keys(row as object)) {
      out[k] = (row as Record<string, unknown>)[k];
    }
    return out as unknown as FullUser;
  } catch (err) {
    console.error("[getFullUser]", err);
    return null;
  }
}