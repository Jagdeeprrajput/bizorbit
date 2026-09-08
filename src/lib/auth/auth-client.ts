"use client";

import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  // Login page reads `data.twoFactorRedirect` itself and does a soft navigation —
  // no onTwoFactorRedirect/twoFactorPage here to avoid double-navigating.
  plugins: [twoFactorClient()],
});

export const { signIn, signOut, useSession } = authClient;
