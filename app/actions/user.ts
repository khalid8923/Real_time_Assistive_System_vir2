"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";

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

    const db = getDb();
    const user = db
      .prepare(
        `SELECT 
          id, name, email, emailVerified, image,
          fullName, university, studentId, role,
          createdAt, updatedAt
        FROM user
        WHERE id = ?`
      )
      .get(userId) as FullUser | undefined;

    return user ?? null;
  } catch (err) {
    console.error("[getFullUser]", err);
    return null;
  }
}