import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminPassword,
  setAdminPassword,
} from "@/lib/db/queries";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
export const runtime = "nodejs";

function isAdmin(request: NextRequest): boolean {
  return request.cookies.get("admin_mode")?.value === "true";
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  let body: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const { currentPassword, newPassword, confirmPassword } = body;

  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return NextResponse.json(
      { error: "كل الحقول مطلوبة." },
      { status: 400 }
    );
  }

  // Verify current password
  if (!verifyAdminPassword(currentPassword.trim())) {
    return NextResponse.json(
      { error: "الباسورد الحالي غير صحيح." },
      { status: 401 }
    );
  }

  // Validate new password
  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "الباسورد الجديد لازم 8 أحرف على الأقل." },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "الباسوردين الجداد مش متطابقين." },
      { status: 400 }
    );
  }

  if (newPassword === currentPassword) {
    return NextResponse.json(
      { error: "الباسورد الجديد لازم يكون مختلف عن الحالي." },
      { status: 400 }
    );
  }

  setAdminPassword(newPassword.trim());

  console.log(`[admin/change-password] ✓ Password updated`);

  return NextResponse.json({ ok: true });
}