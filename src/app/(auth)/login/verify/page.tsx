"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth/auth-client";

export default function TwoFactorVerifyPage() {
  const router = useRouter();
  const [code, setCode] = React.useState("");
  const [useBackupCode, setUseBackupCode] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  function submit() {
    if (code.length < 6) return;
    startTransition(async () => {
      const { error } = useBackupCode
        ? await authClient.twoFactor.verifyBackupCode({ code })
        : await authClient.twoFactor.verifyTotp({ code });

      if (error) {
        toast.error(error.message ?? "That code didn't work — try again.");
        setCode("");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-accent">
          <ShieldCheck className="size-6 text-brand-text" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Two-factor verification</h1>
        <p className="mt-2 text-sm text-muted-foreground text-balance">
          {useBackupCode
            ? "Enter one of your 8-character backup codes."
            : "Enter the 6-digit code from your authenticator app."}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        {useBackupCode ? (
          <input
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.trim())}
            maxLength={11}
            placeholder="XXXX-XXXX"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-center font-mono text-lg tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        ) : (
          <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        )}

        <Button className="w-full" size="lg" disabled={isPending || code.length < 6} onClick={submit}>
          {isPending && <Loader2 className="size-4 animate-spin" />}
          Verify
        </Button>

        <button
          type="button"
          className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
          onClick={() => {
            setUseBackupCode((v) => !v);
            setCode("");
          }}
        >
          {useBackupCode ? "Use authenticator app instead" : "Use a backup code instead"}
        </button>
      </div>
    </motion.div>
  );
}
