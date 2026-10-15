import { Resend } from "resend";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let resendClient: Resend | null = null;
let gmailTransporter: Transporter | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

function getGmailTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "").trim();
  if (!user || !pass) return null;
  if (!gmailTransporter) {
    gmailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return gmailTransporter;
}

function getFromAddress(): string {
  const gmailUser = process.env.GMAIL_USER?.trim();
  if (gmailUser) {
    return `CaptionBridge <${gmailUser}>`;
  }
  return process.env.EMAIL_FROM || "CaptionBridge <onboarding@resend.dev>";
}

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
    <p style="font-size:11px;color:#80848e;margin:12px 0 0;">© ${new Date().getFullYear()} CaptionBridge</p>
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

export async function sendVerificationEmail(opts: {
  to: string;
  name: string;
  url: string;
}): Promise<void> {
  const subject = "تأكيد بريدك الإلكتروني — CaptionBridge";
  const html = verificationEmailHtml(opts.name || "صديقنا", opts.url);

  const gmail = getGmailTransporter();
  if (gmail) {
    try {
      await gmail.sendMail({
        from: getFromAddress(),
        to: opts.to,
        subject,
        html,
      });
      console.log(`[email] verify sent via Gmail to ${opts.to}`);
      return;
    } catch (err) {
      console.error("[email] Gmail failed:", err);
    }
  }

  const resend = getResend();
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || "CaptionBridge <onboarding@resend.dev>",
        to: opts.to,
        subject,
        html,
      });
      if (result.error) {
        console.error("[email] Resend failed:", result.error.message);
        return;
      }
      console.log(`[email] verify sent via Resend to ${opts.to}`);
      return;
    } catch (err) {
      console.error("[email] Resend threw:", err);
    }
  }

  console.warn(`[email] No provider available. URL: ${opts.url}`);
}

export async function sendResetPasswordEmail(opts: {
  to: string;
  name: string;
  url: string;
}): Promise<void> {
  const subject = "إعادة تعيين كلمة المرور — CaptionBridge";
  const html = resetPasswordEmailHtml(opts.name || "صديقنا", opts.url);

  const gmail = getGmailTransporter();
  if (gmail) {
    try {
      await gmail.sendMail({
        from: getFromAddress(),
        to: opts.to,
        subject,
        html,
      });
      console.log(`[email] reset sent via Gmail to ${opts.to}`);
      return;
    } catch (err) {
      console.error("[email] Gmail failed:", err);
    }
  }

  const resend = getResend();
  if (resend) {
    try {
      const result = await resend.emails.send({
        from: process.env.EMAIL_FROM || "CaptionBridge <onboarding@resend.dev>",
        to: opts.to,
        subject,
        html,
      });
      if (result.error) {
        console.error("[email] Resend failed:", result.error.message);
        return;
      }
      console.log(`[email] reset sent via Resend to ${opts.to}`);
      return;
    } catch (err) {
      console.error("[email] Resend threw:", err);
    }
  }

  console.warn(`[email] No provider available. URL: ${opts.url}`);
}