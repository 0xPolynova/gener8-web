import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { seedSupabase } from "../src/lib/data/seed-supabase";

function loadEnv(path: string) {
  try {
    const raw = readFileSync(path, "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env"));

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_PROJECT_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!url || !key) {
  throw new Error("Missing SUPABASE_PROJECT_URL / SUPABASE_SERVICE_ROLE_KEY");
}

async function runSql(query: string) {
  const res = await fetch(`${url}/pg/query`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`SQL failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

async function tablesExist() {
  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await sb.from("users").select("id").limit(1);
  return !error;
}

async function main() {
  const schema = readFileSync(
    resolve(process.cwd(), "supabase/schema.sql"),
    "utf8",
  );

  if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL is set — use psql to apply supabase/schema.sql:");
    console.log('  psql "$DATABASE_URL" -f supabase/schema.sql');
  }

  let applied = false;
  try {
    await runSql(schema);
    applied = true;
    console.log("Schema applied via pg-meta.");
  } catch (error) {
    console.log("Could not apply SQL through the Data API (service role cannot run DDL).");
    console.log(String(error));
  }

  if (!(await tablesExist())) {
    console.error(`
Tables are not in the project yet. In the Supabase SQL editor, paste and run:

  supabase/schema.sql

Then re-run: npm run db:setup
`);
    process.exit(1);
  }

  const sb = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await seedSupabase(sb);
  console.log(applied ? "Seeded after applying schema." : "Seed result:", result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
