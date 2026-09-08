"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Loader2, ShieldCheck, ShieldOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth/auth-client";

type Step = "closed" | "password" | "scan" | "confirm";

export function TwoFactorSettings({ initiallyEnabled }: { initiallyEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = React.useState(initiallyEnabled);
  const [step, setStep] = React.useState<Step>("closed");
  const [password, setPassword] = React.useState("");
  const [qrDataUrl, setQrDataUrl] = React.useState("");
  const [backupCodes, setBackupCodes] = React.useState<string[]>([]);
  const [confirmCode, setConfirmCode] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const [disablePassword, setDisablePassword] = React.useState("");
  const [showDisable, setShowDisable] = React.useState(false);

  function beginEnable() {
    setPassword("");
    setStep("password");
  }

  function submitPassword() {
    if (!password) return;
    startTransition(async () => {
      const { data, error } = await authClient.twoFactor.enable({ password, method: "totp" });
      if (error || !data || data.method !== "totp") {
        toast.error(error?.message ?? "Couldn't start 2FA setup — check your password.");
        return;
      }
      const qr = await QRCode.toDataURL(data.totpURI, { margin: 1, width: 220 });
      setQrDataUrl(qr);
      setBackupCodes(data.backupCodes);
      setStep("scan");
    });
  }

  function confirmSetup() {
    if (confirmCode.length < 6) return;
    startTransition(async () => {
      const { error } = await authClient.twoFactor.verifyTotp({ code: confirmCode });
      if (error) {
        toast.error(error.message ?? "That code didn't match — try again.");
        setConfirmCode("");
        return;
      }
      toast.success("Two-factor authentication is now active.");
      setEnabled(true);
      setStep("closed");
      router.refresh();
    });
  }

  function submitDisable() {
    if (!disablePassword) return;
    startTransition(async () => {
      const { error } = await authClient.twoFactor.disable({ password: disablePassword });
      if (error) {
        toast.error(error.message ?? "Couldn't disable 2FA — check your password.");
        return;
      }
      toast.success("Two-factor authentication disabled.");
      setEnabled(false);
      setShowDisable(false);
      setDisablePassword("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <div className="flex items-center gap-3">
          {enabled ? (
            <ShieldCheck className="size-5 text-[var(--status-good)]" />
          ) : (
            <ShieldOff className="size-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {enabled ? "Two-factor authentication is on" : "Two-factor authentication is off"}
            </p>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? "You'll be asked for a code from your authenticator app when you sign in."
                : "Add an authenticator-app code as a second step at sign-in."}
            </p>
          </div>
        </div>
        {enabled ? (
          <Button variant="outline" size="sm" onClick={() => setShowDisable(true)}>
            Disable
          </Button>
        ) : (
          <Button size="sm" onClick={beginEnable}>
            <KeyRound className="size-3.5" />
            Enable
          </Button>
        )}
      </div>

      {/* Enable flow */}
      <Dialog open={step !== "closed"} onOpenChange={(open) => !open && setStep("closed")}>
        <DialogContent>
          {step === "password" && (
            <>
              <DialogHeader>
                <DialogTitle>Confirm your password</DialogTitle>
                <DialogDescription>
                  For your security, confirm your password before setting up two-factor authentication.
                </DialogDescription>
              </DialogHeader>
              <Input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Current password"
                onKeyDown={(e) => e.key === "Enter" && submitPassword()}
              />
              <DialogFooter>
                <Button disabled={isPending || !password} onClick={submitPassword}>
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "scan" && (
            <>
              <DialogHeader>
                <DialogTitle>Scan this QR code</DialogTitle>
                <DialogDescription>
                  Scan with Google Authenticator, 1Password, or any TOTP app. Save your backup codes
                  somewhere safe — each one works only once if you lose access to your device.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4">
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="Two-factor setup QR code" className="rounded-md border border-border" />
                )}
                <div className="grid w-full grid-cols-2 gap-1.5 rounded-md bg-secondary p-3 font-mono text-xs">
                  {backupCodes.map((code) => (
                    <span key={code}>{code}</span>
                  ))}
                </div>
              </div>
              <Button onClick={() => setStep("confirm")}>I&apos;ve saved my backup codes</Button>
            </>
          )}

          {step === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>Verify the code</DialogTitle>
                <DialogDescription>Enter the current 6-digit code from your app to finish setup.</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center py-2">
                <InputOTP maxLength={6} value={confirmCode} onChange={setConfirmCode} autoFocus>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <DialogFooter>
                <Button disabled={isPending || confirmCode.length < 6} onClick={confirmSetup}>
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  Activate
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable flow */}
      <Dialog open={showDisable} onOpenChange={setShowDisable}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication</DialogTitle>
            <DialogDescription>
              Confirm your password to turn off two-factor authentication for your account.
            </DialogDescription>
          </DialogHeader>
          <Label htmlFor="disable-password" className="sr-only">
            Password
          </Label>
          <Input
            id="disable-password"
            type="password"
            autoFocus
            value={disablePassword}
            onChange={(e) => setDisablePassword(e.target.value)}
            placeholder="Current password"
            onKeyDown={(e) => e.key === "Enter" && submitDisable()}
          />
          <DialogFooter>
            <Button variant="destructive" disabled={isPending || !disablePassword} onClick={submitDisable}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Disable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
