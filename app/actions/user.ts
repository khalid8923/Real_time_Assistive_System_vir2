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

    // Convert libsql proxy to plain object
    return {
      id: String(row.id ?? ""),
      name: String(row.name ?? ""),
      email: String(row.email ?? ""),
      emailVerified: Number(row.emailVerified ?? 0),
      image: row.image ? String(row.image) : null,
      fullName: row.fullName ? String(row.fullName) : null,
      university: row.university ? String(row.university) : null,
      studentId: row.studentId ? String(row.studentId) : null,
      role: row.role ? String(row.role) : null,
      createdAt: Number(row.createdAt ?? 0),
      updatedAt: Number(row.updatedAt ?? 0),
    };
  } catch (err) {
    console.error("[getFullUser]", err);
    return null;
  }
}