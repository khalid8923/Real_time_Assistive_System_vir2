import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { verifyAdminPassword, setAdminPassword } from "@/lib/db/queries";

export const runtime = "nodejs";

function isAdmin(request: NextRequest): boolean {
  return request.cookies.get("admin_mode")?.value === "true";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!rateLimit(ip, 5, 60_000).ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a minute." },
      { status: 429 }
    );
  }

  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { currentPassword, newPassword, confirmPassword } = body;

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return NextResponse.json(
      { error: "All fields are required." },
      { status: 400 }
    );
  }

  if (!(await verifyAdminPassword(currentPassword.trim()))) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 401 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "Passwords do not match." },
      { status: 400 }
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "New password must be different from current." },
      { status: 400 }
    );
  }

  await setAdminPassword(newPassword.trim());

  console.log(`[admin/change-password] Password updated`);

  return NextResponse.json({ ok: true });
}