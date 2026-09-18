"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { getSettings, updateSettings } from "@/lib/db/queries";
import type { UserSettings, Theme } from "@/lib/db";

async function requireUserId(): Promise<string> {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const userId = session?.user?.id;
  if (!userId) throw new Error("UNAUTHORIZED");
  return userId;
}

export async function getMySettings(): Promise<UserSettings | null> {
  try {
    const userId = await requireUserId();
    return await getSettings(userId);
  } catch {
    return null;
  }
}

export async function updateMySettings(
  patch: {
    theme?: Theme;
    transcriptFontSize?: number;
    colorCodingEnabled?: boolean;
    soundDetectionEnabled?: boolean;
    soundSensitivityQuiet?: number;
    soundSensitivityNormal?: number;
    soundSensitivityLoud?: number;
    soundSensitivitySpike?: number;
  }
): Promise<
  { ok: true; settings: UserSettings } | { ok: false; error: string }
> {
  try {
    const userId = await requireUserId();
    const settings = await updateSettings(userId, patch);
    revalidatePath("/account");
    return { ok: true, settings };
  } catch (err) {
    console.error("[updateMySettings]", err);
    return { ok: false, error: "فشل التحديث" };
  }
}