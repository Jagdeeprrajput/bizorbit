import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";
import { RegisterForm } from "./register-form";

// Reads the database on every request — must never be statically prerendered,
// both because the company list can change and because a build-time DB call
// would fail against a placeholder connection string anyway.
export const dynamic = "force-dynamic";

// Bootstrap-only: creates the company and its first Super Admin. Disabled
// the moment a company exists — see blueprint §8.2. There is no general
// public sign-up in BizOrbit.
export default async function RegisterPage() {
  const existingCompany = await db.company.findFirst({ select: { id: true } });

  if (existingCompany) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-accent">
          <ShieldOff className="size-6 text-accent-foreground" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Setup already complete</h1>
        <p className="mt-2 text-sm text-muted-foreground text-balance">
          BizOrbit is invite-only. If you need an account, ask your HR team or admin.
        </p>
        <Button asChild variant="outline" className="mt-8 w-full">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    );
  }

  return <RegisterForm />;
}
