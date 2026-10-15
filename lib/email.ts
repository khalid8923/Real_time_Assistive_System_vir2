import { Resend } from "resend";

/* ------------------------------------------------------------------ */
/* Lazy Resend client — created on first use, not at module load.    */
/* This prevents build-time crashes when RESEND_API_KEY is missing.  */
/* ------------------------------------------------------------------ */

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function getFrom(): string {
  return (
    process.env.EMAIL_FROM ||
    "CaptionBridge <onboarding@resend.dev>"
  );
}

/* ------------------------------------------------------------------ */
/* HTML templates                                                     */
/* ------------------------------------------------------------------ */

function emailShell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:40px 20px;background:#f0f1f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;direction:rtl;text-align:right;color:#1a1a1a;">
  <div style="max-width:560px;margin:0 auto;background:#fafaf7;border:1px solid #cdd0d6;border-radius:4px;padding:40px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;padding:8px 16px;background:#1a3e9c;color:#fafaf7;border-radius:4px;font-weight:700;font-size:14px;">CaptionBridge</div>
    </div>
    ${body}
    <hr style="border:none;border-top:1px solid #cdd0d6;margin:32px 0 20px;">
    <p style="font-size:12px;line-height:1.7;color:#575a62;margin:0;">لو ما طلبتش الرسالة دي، تجاهلها بأمان.</p>
    <p style="font-size:11px;color:#80848e;margin:12px 0 0;">© ${new Date().getFullYear()} CaptionBridge — رفيقك الذكي في المحاضرات الجامعية</p>
  </div>
</body>
</html>`;
}

function ctaButton(url: string, label: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background:#1a3e9c;color:#fafaf7;padding:14px 32px;border-radius:4px;text-decoration:none;font-weight:700;font-size:15px;">${label}</a>
  </div>
  <p style="font-size:12px;color:#575a62;text-align:center;margin:0;">أو انسخ الرابط:</p>
  <p style="font-size:12px;color:#1a3e9c;word-break:break-all;text-align:center;direction:ltr;">${url}</p>`;
}

export function verificationEmailHtml(name: string, url: string): string {
  const body = `
    <h1 style="font-size:22px;line-height:32px;font-weight:700;margin:0 0 20px;">تأكيد بريدك الإلكتروني</h1>
    <p style="font-size:15px;line-height:1.9;margin:0 0 16px;">أهلاً ${name}،</p>
    <p style="font-size:15px;line-height:1.9;margin:0 0 8px;">اضغط على الزر تحت لتأكيد بريدك وتنشيط حسابك في CaptionBridge.</p>
    ${ctaButton(url, "تأكيد البريد الإلكتروني")}
  `;
  return emailShell("تأكيد البريد الإلكتروني", body);
}

export function resetPasswordEmailHtml(name: string, url: string): string {
  const body = `
    <h1 style="font-size:22px;line-height:32px;font-weight:700;margin:0 0 20px;">إعادة تعيين كلمة المرور</h1>
    <p style="font-size:15px;line-height:1.9;margin:0 0 16px;">أهلاً ${name}،</p>
    <p style="font-size:15px;line-height:1.9;margin:0 0 8px;">وصلنا طلب لإعادة تعيين كلمة المرور. اضغط على الزر تحت لاختيار كلمة مرور جديدة.</p>
    ${ctaButton(url, "إعادة تعيين كلمة المرور")}
    <p style="font-size:13px;line-height:1.9;color:#575a62;margin:20px 0 0;">الرابط صالح لمدة ساعة واحدة فقط.</p>
  `;
  return emailShell("إعادة تعيين كلمة المرور", body);
}

/* ------------------------------------------------------------------ */
/* Send helpers — gracefully skip if key is missing                   */
/* ------------------------------------------------------------------ */

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  url: string;
}): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY missing — skipping verification email to ${opts.to}`
    );
    console.warn(`[email] Verification URL: ${opts.url}`);
    return;
  }

  try {
    const result = await client.emails.send({
      from: getFrom(),
      to: opts.to,
      subject: "تأكيد بريدك الإلكتروني — CaptionBridge",
      html: verificationEmailHtml(opts.name || "صديقنا", opts.url),
    });
    if (result.error) {
      console.error("[email] verify send failed:", result.error.message);
      return;
    }
    console.log(`[email] verify sent to ${opts.to}`);
  } catch (err) {
    console.error("[email] verify threw:", err);
  }
}

export async function sendResetPasswordEmail(opts: {
  to: string;
  name: string;
  url: string;
}): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn(
      `[email] RESEND_API_KEY missing — skipping reset email to ${opts.to}`
    );
    console.warn(`[email] Reset URL: ${opts.url}`);
    return;
  }

  try {
    const result = await client.emails.send({
      from: getFrom(),
      to: opts.to,
      subject: "إعادة تعيين كلمة المرور — CaptionBridge",
      html: resetPasswordEmailHtml(opts.name || "صديقنا", opts.url),
    });
    if (result.error) {
      console.error("[email] reset send failed:", result.error.message);
      return;
    }
    console.log(`[email] reset sent to ${opts.to}`);
  } catch (err) {
    console.error("[email] reset threw:", err);
  }
}