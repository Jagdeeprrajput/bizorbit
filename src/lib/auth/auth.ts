import "server-only";
import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/server/db";
import { env } from "@/lib/env";
import { sendMail } from "@/lib/email/mailer";
import { resetPasswordEmail, verificationEmail, welcomeEmail } from "@/lib/email/templates";

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(db, { provider: "postgresql" }),

  // BizOrbit is invite-only (blueprint §8.2) — accounts are created by HR/Admin
  // directly in the database, never through a public sign-up form.
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 12,
    requireEmailVerification: true,
    // TODO(Phase 12 — Notifications): move behind the EmailOutbox queue with
    // Resend + React Email, so a delivery failure is retried, not lost.
    //
    // Doubles as the invite-acceptance flow (§8.2): inviting an employee
    // creates their User row with no credential account yet, then sends this
    // same reset-password link. Better Auth's resetPassword endpoint creates
    // the credential account on first use, or updates it if one exists — so
    // "set your password" and "reset your password" are the same mechanism.
    sendResetPassword: async ({ user, url }) => {
      const hasAccount = await db.account.findFirst({ where: { userId: user.id } });
      const { html, text } = hasAccount ? resetPasswordEmail(url) : welcomeEmail(url);
      const subject = hasAccount ? "Reset your BizOrbit password" : "Welcome to BizOrbit — set your password";
      await sendMail({ to: user.email, subject, html, text });
    },
    onPasswordReset: async ({ user }) => {
      await db.user.updateMany({
        where: { id: user.id, status: "INVITED" },
        data: { status: "ACTIVE" },
      });
    },
  },

  emailVerification: {
    // TODO(Phase 12 — Notifications): same outbox treatment as above.
    sendVerificationEmail: async ({ user, url }) => {
      const { html, text } = verificationEmail(url);
      await sendMail({ to: user.email, subject: "Verify your BizOrbit email", html, text });
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days absolute (blueprint §8.4)
    updateAge: 60 * 60 * 24, // sliding refresh once per day of activity
  },

  user: {
    fields: {
      image: "avatarUrl",
    },
    additionalFields: {
      companyId: { type: "string", required: true, input: false },
      role: { type: "string", required: true, input: false, defaultValue: "EMPLOYEE" },
      status: { type: "string", required: true, input: false, defaultValue: "INVITED" },
      firstName: { type: "string", required: true },
      lastName: { type: "string", required: true },
      employeeCode: { type: "string", required: true, input: false },
      phone: { type: "string", required: false },
      departmentId: { type: "string", required: false, input: false },
      designationId: { type: "string", required: false, input: false },
      managerId: { type: "string", required: false, input: false },
      primaryOfficeId: { type: "string", required: false, input: false },
      employmentType: { type: "string", required: false, input: false },
      workMode: { type: "string", required: false, input: false },
    },
  },

  plugins: [
    twoFactor({ issuer: "BizOrbit" }),
    nextCookies(), // must be the last plugin — see Better Auth Next.js docs
  ],
});

export type Session = typeof auth.$Infer.Session;
