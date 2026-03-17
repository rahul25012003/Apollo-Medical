import { prisma } from "@/lib/prisma";
import type { NotificationChannelType } from "@prisma/client";
import nodemailer from "nodemailer";

// ============================================================================
// Provider Config Types
// ============================================================================

export interface EmailSmtpConfig {
  smtpHost: string;
  smtpPort: number;
  email: string;
  password: string;
  fromName?: string;
}

export interface EmailSendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
}

export interface EmailMailgunConfig {
  apiKey: string;
  domain: string;
  fromEmail: string;
  fromName?: string;
}

export interface SmsTwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface SmsMsg91Config {
  authKey: string;
  senderId: string;
  templateId?: string;
}

export interface WhatsAppBusinessConfig {
  apiToken: string;
  phoneNumberId: string;
  businessAccountId: string;
}

export interface WhatsAppTwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string; // whatsapp:+14155238886
}

// ============================================================================
// Provider Registry
// ============================================================================

export const PROVIDERS = {
  EMAIL: [
    { id: "gmail_smtp", name: "Gmail SMTP", fields: ["smtpHost", "smtpPort", "email", "password"] },
    { id: "custom_smtp", name: "Custom SMTP", fields: ["smtpHost", "smtpPort", "email", "password", "fromName"] },
    { id: "sendgrid", name: "SendGrid", fields: ["apiKey", "fromEmail", "fromName"] },
    { id: "mailgun", name: "Mailgun", fields: ["apiKey", "domain", "fromEmail", "fromName"] },
  ],
  SMS: [
    { id: "twilio", name: "Twilio", fields: ["accountSid", "authToken", "fromNumber"] },
    { id: "msg91", name: "MSG91", fields: ["authKey", "senderId", "templateId"] },
  ],
  WHATSAPP: [
    { id: "whatsapp_business", name: "WhatsApp Business API", fields: ["apiToken", "phoneNumberId", "businessAccountId"] },
    { id: "twilio_whatsapp", name: "Twilio WhatsApp", fields: ["accountSid", "authToken", "fromNumber"] },
  ],
} as const;

// Field labels and types for the UI
export const FIELD_META: Record<string, { label: string; type: string; placeholder: string }> = {
  smtpHost: { label: "SMTP Host", type: "text", placeholder: "smtp.gmail.com" },
  smtpPort: { label: "Port", type: "number", placeholder: "587" },
  email: { label: "Email", type: "email", placeholder: "admin@example.com" },
  password: { label: "App Password", type: "password", placeholder: "" },
  fromName: { label: "From Name", type: "text", placeholder: "ICMS Notifications" },
  apiKey: { label: "API Key", type: "password", placeholder: "" },
  fromEmail: { label: "From Email", type: "email", placeholder: "noreply@example.com" },
  domain: { label: "Domain", type: "text", placeholder: "mg.example.com" },
  accountSid: { label: "Account SID", type: "text", placeholder: "" },
  authToken: { label: "Auth Token", type: "password", placeholder: "" },
  fromNumber: { label: "From Number", type: "text", placeholder: "+1234567890" },
  authKey: { label: "Auth Key", type: "password", placeholder: "" },
  senderId: { label: "Sender ID", type: "text", placeholder: "" },
  templateId: { label: "Template ID", type: "text", placeholder: "" },
  apiToken: { label: "API Token", type: "password", placeholder: "" },
  phoneNumberId: { label: "Phone Number ID", type: "text", placeholder: "" },
  businessAccountId: { label: "Business Account ID", type: "text", placeholder: "" },
};

// Sensitive fields that should be masked when returning to client
const SENSITIVE_FIELDS = ["password", "apiKey", "authToken", "authKey", "apiToken"];

export function maskConfig(config: Record<string, unknown>): Record<string, unknown> {
  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(config)) {
    if (SENSITIVE_FIELDS.includes(key) && typeof value === "string" && value.length > 0) {
      masked[key] = "••••••••";
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

// ============================================================================
// Get Active Channel
// ============================================================================

export async function getActiveChannel(
  channel: NotificationChannelType,
  tenantId?: string | null
) {
  // Try tenant-specific first, then platform-level, then any active channel as fallback
  const where = tenantId
    ? [
        { channel, tenantId, isActive: true, isDefault: true },
        { channel, tenantId, isActive: true },
        { channel, tenantId: null, isActive: true, isDefault: true },
        { channel, tenantId: null, isActive: true },
      ]
    : [
        { channel, tenantId: null, isActive: true, isDefault: true },
        { channel, tenantId: null, isActive: true },
      ];

  for (const w of where) {
    const ch = await prisma.notificationChannel.findFirst({ where: w });
    if (ch) return ch;
  }

  // Final fallback: find ANY active channel of this type (regardless of tenant)
  const fallback = await prisma.notificationChannel.findFirst({
    where: { channel, isActive: true },
    orderBy: { isDefault: "desc" },
  });
  return fallback;
}

// ============================================================================
// Send Email
// ============================================================================

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  tenantId?: string | null;
}

export async function sendEmail({ to, subject, html, text, tenantId }: SendEmailParams): Promise<boolean> {
  const channel = await getActiveChannel("EMAIL", tenantId);

  if (!channel) {
    console.warn("No active EMAIL channel configured. Email not sent to:", to);
    return false;
  }

  const config = channel.config as Record<string, string>;

  try {
    if (channel.provider === "gmail_smtp" || channel.provider === "custom_smtp") {
      return await sendSmtpEmail(config as unknown as EmailSmtpConfig, to, subject, html, text);
    }
    if (channel.provider === "sendgrid") {
      return await sendSendGridEmail(config as unknown as EmailSendGridConfig, to, subject, html, text);
    }
    if (channel.provider === "mailgun") {
      return await sendMailgunEmail(config as unknown as EmailMailgunConfig, to, subject, html, text);
    }
    console.error("Unknown email provider:", channel.provider);
    return false;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

async function sendSmtpEmail(
  config: EmailSmtpConfig,
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.email,
      pass: config.password,
    },
  });

  await transporter.sendMail({
    from: config.fromName ? `"${config.fromName}" <${config.email}>` : config.email,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ""),
  });

  return true;
}

async function sendSendGridEmail(
  config: EmailSendGridConfig,
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: config.fromEmail, name: config.fromName || undefined },
      subject,
      content: [
        { type: "text/plain", value: text || html.replace(/<[^>]*>/g, "") },
        { type: "text/html", value: html },
      ],
    }),
  });
  return res.ok;
}

async function sendMailgunEmail(
  config: EmailMailgunConfig,
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  const form = new URLSearchParams();
  form.set("from", config.fromName ? `${config.fromName} <${config.fromEmail}>` : config.fromEmail);
  form.set("to", to);
  form.set("subject", subject);
  form.set("html", html);
  if (text) form.set("text", text);

  const res = await fetch(`https://api.mailgun.net/v3/${config.domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${config.apiKey}`).toString("base64")}`,
    },
    body: form,
  });
  return res.ok;
}

// ============================================================================
// Send SMS
// ============================================================================

interface SendSmsParams {
  to: string;
  message: string;
  tenantId?: string | null;
}

export async function sendSms({ to, message, tenantId }: SendSmsParams): Promise<boolean> {
  const channel = await getActiveChannel("SMS", tenantId);

  if (!channel) {
    console.warn("No active SMS channel configured. SMS not sent to:", to);
    return false;
  }

  const config = channel.config as Record<string, string>;

  try {
    if (channel.provider === "twilio") {
      return await sendTwilioSms(config as unknown as SmsTwilioConfig, to, message);
    }
    if (channel.provider === "msg91") {
      return await sendMsg91Sms(config as unknown as SmsMsg91Config, to, message);
    }
    console.error("Unknown SMS provider:", channel.provider);
    return false;
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return false;
  }
}

async function sendTwilioSms(config: SmsTwilioConfig, to: string, message: string): Promise<boolean> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const form = new URLSearchParams();
  form.set("To", to);
  form.set("From", config.fromNumber);
  form.set("Body", message);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  return res.ok;
}

async function sendMsg91Sms(config: SmsMsg91Config, to: string, message: string): Promise<boolean> {
  const res = await fetch("https://control.msg91.com/api/v5/flow/", {
    method: "POST",
    headers: {
      authkey: config.authKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: config.senderId,
      template_id: config.templateId,
      mobiles: to.replace(/[^0-9]/g, ""),
      message,
    }),
  });
  return res.ok;
}

// ============================================================================
// Send WhatsApp
// ============================================================================

interface SendWhatsAppParams {
  to: string;
  message: string;
  tenantId?: string | null;
}

export async function sendWhatsApp({ to, message, tenantId }: SendWhatsAppParams): Promise<boolean> {
  const channel = await getActiveChannel("WHATSAPP", tenantId);

  if (!channel) {
    console.warn("No active WHATSAPP channel configured. Message not sent to:", to);
    return false;
  }

  const config = channel.config as Record<string, string>;

  try {
    if (channel.provider === "whatsapp_business") {
      return await sendWhatsAppBusiness(config as unknown as WhatsAppBusinessConfig, to, message);
    }
    if (channel.provider === "twilio_whatsapp") {
      return await sendTwilioWhatsApp(config as unknown as WhatsAppTwilioConfig, to, message);
    }
    console.error("Unknown WhatsApp provider:", channel.provider);
    return false;
  } catch (error) {
    console.error("Failed to send WhatsApp:", error);
    return false;
  }
}

async function sendWhatsAppBusiness(config: WhatsAppBusinessConfig, to: string, message: string): Promise<boolean> {
  const url = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: to.replace(/[^0-9]/g, ""),
      type: "text",
      text: { body: message },
    }),
  });
  return res.ok;
}

async function sendTwilioWhatsApp(config: WhatsAppTwilioConfig, to: string, message: string): Promise<boolean> {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const form = new URLSearchParams();
  form.set("To", `whatsapp:${to}`);
  form.set("From", config.fromNumber.startsWith("whatsapp:") ? config.fromNumber : `whatsapp:${config.fromNumber}`);
  form.set("Body", message);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });
  return res.ok;
}

// ============================================================================
// Email Templates
// ============================================================================

export function otpEmailHtml(code: string, purpose: string, appName: string = "ICMS"): string {
  const purposeText = {
    REGISTRATION: "complete your registration",
    LOGIN: "log in to your account",
    PASSWORD_RESET: "reset your password",
    EMAIL_VERIFICATION: "verify your email address",
  }[purpose] || "verify your identity";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0d9488; margin-bottom: 16px;">${appName}</h2>
      <p>Your OTP code to ${purposeText}:</p>
      <div style="background: #f0fdfa; border: 2px solid #0d9488; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0d9488;">${code}</span>
      </div>
      <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;
}

export function registrationConfirmationHtml(params: {
  name: string;
  eventTitle: string;
  eventDate?: string;
  registrationId: string;
  amount: number;
  currency: string;
  status: string;
  appName?: string;
}): string {
  const { name, eventTitle, eventDate, registrationId, amount, currency, status, appName = "ICMS" } = params;
  const isFree = amount === 0;
  const statusColor = status === "CONFIRMED" ? "#10b981" : "#f59e0b";
  const statusText = status === "CONFIRMED" ? "Confirmed" : "Pending Payment";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #0d9488; margin-bottom: 4px;">${appName}</h2>
      <p style="color: #666; margin-top: 0;">Registration ${statusText}</p>
      <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Hello ${name},</strong></p>
        <p style="margin: 0 0 16px;">Your registration for <strong>${eventTitle}</strong> has been received.</p>
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #666;">Registration ID</td><td style="padding: 6px 0; text-align: right; font-family: monospace;">${registrationId.slice(-8).toUpperCase()}</td></tr>
          ${eventDate ? `<tr><td style="padding: 6px 0; color: #666;">Event Date</td><td style="padding: 6px 0; text-align: right;">${eventDate}</td></tr>` : ""}
          <tr><td style="padding: 6px 0; color: #666;">Amount</td><td style="padding: 6px 0; text-align: right;">${isFree ? "Free" : `${currency} ${amount.toLocaleString()}`}</td></tr>
          <tr><td style="padding: 6px 0; color: #666;">Status</td><td style="padding: 6px 0; text-align: right;"><span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></td></tr>
        </table>
      </div>
      ${!isFree && status !== "CONFIRMED" ? `<p style="color: #f59e0b; font-size: 14px;">Please complete your payment to confirm your spot.</p>` : ""}
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #999; font-size: 12px;">This is an automated email from ${appName}.</p>
    </div>
  `;
}

export function otpSmsText(code: string, purpose: string, appName: string = "ICMS"): string {
  return `${code} is your ${appName} OTP for ${purpose.toLowerCase().replace("_", " ")}. Valid for 10 minutes.`;
}
