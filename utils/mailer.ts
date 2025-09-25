// Next.js 15 (App Router) – Node.js runtime utility for sending emails
// ---------------------------------------------------------------
// Why `server-only`? Ensures this module is never bundled into the client.
// It also makes accidental imports from Client Components a build-time error.
import "server-only";

import nodemailer, {
  type Transporter,
  type SendMailOptions,
  type SentMessageInfo,
} from "nodemailer";

/**
 * In this project, env variables live in `.env.local`.
 * If you already have a helper like `getEnvVariable` in `lib/env.ts` (per your diagram),
 * feel free to swap this inline getter for that one.
 */
function getEnv(name: string, fallback?: string): string {
  const val = process.env[name] ?? fallback;
  if (!val) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return val;
}

// Centralize SMTP config. Matches the original Mailtrap fields.
const SMTP_HOST = getEnv("MAILTRAP_SMTP_HOST");
const SMTP_PORT = Number(getEnv("MAILTRAP_SMTP_PORT", "587"));
const SMTP_USER = getEnv("MAILTRAP_SMTP_USER");
const SMTP_PASS = getEnv("MAILTRAP_SMTP_PASSWORD");

// Default From header (override per-email if needed)
const MAIL_FROM = getEnv("MAIL_FROM", `no-reply@localhost`);

/**
 * Cache the transporter across hot reloads in dev and across
 * calls on the server to avoid reconnect overhead.
 */
let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (cachedTransporter) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true only for 465
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return cachedTransporter;
}

// Strongly-typed params for convenience in handlers and server actions.
export interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string; // Plain text body
  html?: string; // Optional HTML body
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: NonNullable<SendMailOptions["attachments"]>;
  from?: string; // Override default FROM
}

/**
 * Send an email via the configured SMTP transport.
 * Note: Only usable in server contexts (API routes, server actions, RSC).
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  cc,
  bcc,
  replyTo,
  attachments,
  from,
}: SendEmailParams): Promise<SentMessageInfo> {
  if (!text && !html) {
    throw new Error("sendEmail: provide at least `text` or `html`.");
  }

  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: from ?? MAIL_FROM,
      to,
      subject,
      text,
      html,
      cc,
      bcc,
      replyTo,
      attachments,
    });

    // Keep the dev-time log; avoid leaking PII in prod logs.
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Message sent:", info.messageId);
    }

    return info;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error sending email";
    // Prefer structured errors for API routes to map to 5xx/4xx
    console.error("❌ Error sending email:", message);
    throw error;
  }
}
