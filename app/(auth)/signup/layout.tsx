import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "إنشاء حساب",
  description: "أنشئ حسابك في CaptionBridge عشان تبدأ تستخدم التطبيق.",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}