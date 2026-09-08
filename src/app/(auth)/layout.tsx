import Link from "next/link";
import { ShieldCheck, Lock, History } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { HeroOrbs } from "@/components/marketing/hero-orbs";
import { Reveal } from "@/components/motion/reveal";

const points = [
  { icon: Lock, text: "Database-backed sessions — revoked instantly the moment HR offboards you" },
  { icon: ShieldCheck, text: "Every permission re-checked on the server, on every request" },
  { icon: History, text: "Every sign-in is written to an immutable audit log" },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative isolate hidden overflow-hidden bg-secondary/40 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <HeroOrbs />
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Biz<span className="text-brand-text">Orbit</span>
        </Link>
        <Reveal className="max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            One system of record for attendance, leave, and tasks.
          </h2>
          <ul className="mt-8 space-y-4">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-muted-foreground">
                <Icon className="mt-0.5 size-4 shrink-0 text-brand-text" />
                <span className="text-balance">{text}</span>
              </li>
            ))}
          </ul>
        </Reveal>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} BizOrbit · Internal use only</p>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:justify-end">
          <Link href="/" className="text-lg font-semibold tracking-tight lg:hidden">
            Biz<span className="text-brand-text">Orbit</span>
          </Link>
          <ModeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
