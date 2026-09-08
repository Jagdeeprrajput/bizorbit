import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js auto-loads .env.local for the app; the Prisma CLI does not, so load it explicitly.
config({ path: ".env.local" });

// The CLI (migrate, studio, db pull/push) needs a direct, non-pooled
// connection — Neon's pooled endpoint doesn't support the session-level
// features migrations rely on. The running app uses DATABASE_URL (pooled)
// via @prisma/adapter-pg instead — see src/server/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DIRECT_URL"),
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});
