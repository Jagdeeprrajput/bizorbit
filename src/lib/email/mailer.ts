import "server-only";
import nodemailer from "nodemailer";
import { env } from "@/lib/env";

// Direct SMTP send for now (verification + password reset only). Phase 12
// replaces this with Resend + React Email behind the EmailOutbox queue, so
// a delivery failure is retried instead of silently lost — see AGENTS.md §12.3.
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
});

export async function sendMail(options: { to: string; subject: string; html: string; text: string }) {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
