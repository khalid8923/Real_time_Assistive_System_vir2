"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  listLectures,
  saveLecture,
  deleteLecture,
  renameLecture,
  getLecture,
  type SaveLectureInput,
} from "@/lib/db/queries";
import type { SavedLecture } from "@/lib/db";

async function requireUserId(): Promise<string> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const userId = session?.user?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}

export async function getMyLectures(): Promise<SavedLecture[]> {
  try {
    const userId = await requireUserId();
    return await listLectures(userId);
  } catch {
    return [];
  }
}

export async function getMyLecture(
  id: string
): Promise<SavedLecture | null> {
  try {
    const userId = await requireUserId();
    return await getLecture(userId, id);
  } catch {
    return null;
  }
}

export async function saveMyLecture(
  input: SaveLectureInput
): Promise<
  { ok: true; lecture: SavedLecture } | { ok: false; error: string }
> {
  try {
    const userId = await requireUserId();
    const lecture = await saveLecture(userId, input);
    revalidatePath("/account");
    revalidatePath("/");
    return { ok: true, lecture };
  } catch (err) {
    console.error("[saveMyLecture]", err);
    return { ok: false, error: "فشل الحفظ" };
  }
}

export async function deleteMyLecture(
  id: string
): Promise<{ ok: boolean }> {
  try {
    const userId = await requireUserId();
    const deleted = await deleteLecture(userId, id);
    revalidatePath("/account");
    return { ok: deleted };
  } catch {
    return { ok: false };
  }
}

export async function renameMyLecture(
  id: string,
  newName: string
): Promise<{ ok: boolean }> {
  try {
    const userId = await requireUserId();
    const renamed = await renameLecture(userId, id, newName);
    revalidatePath("/account");
    return { ok: renamed };
  } catch {
    return { ok: false };
  }
}