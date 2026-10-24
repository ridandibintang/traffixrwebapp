/**
 * Phase 0 seed: one client (Jatis Mobile), one admin, two writers (Aura, Hamzah).
 *
 * Runs against whichever Supabase project .env.local points to, using the
 * server-only secret key so it can create Auth users. Safe to re-run: existing
 * users and clients are updated, not duplicated.
 *
 *   npm run db:seed
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/types/database";
import type { UserRole } from "../lib/types";

config({ path: ".env.local" });

function requireEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(`Missing env: set ${names.join(" or ")} in .env.local`);
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const secretKey = requireEnv("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
const password = requireEnv("SEED_PASSWORD");

const supabase = createClient<Database>(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type SeedUser = { email: string; full_name: string; role: UserRole };

const SEED_USERS: SeedUser[] = [
  {
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@traffixr.test",
    full_name: "Bintang",
    role: "admin",
  },
  {
    email: process.env.SEED_WRITER_AURA_EMAIL ?? "aura@traffixr.test",
    full_name: "Aura",
    role: "writer",
  },
  {
    email: process.env.SEED_WRITER_HAMZAH_EMAIL ?? "hamzah@traffixr.test",
    full_name: "Hamzah",
    role: "writer",
  },
];

const SEED_CLIENT = {
  name: "Jatis Mobile",
  website_url: "https://jatismobile.com",
  cms: "WordPress",
  status: "active" as const,
};

async function findUserIdByEmail(email: string): Promise<string | null> {
  // A 3-person team fits comfortably in one page.
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (error) throw error;
  const match = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  return match?.id ?? null;
}

async function seedUser(user: SeedUser) {
  let id = await findUserIdByEmail(user.email);

  if (!id) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: user.full_name, role: user.role },
    });
    if (error) throw error;
    id = data.user.id;
    console.log(`created  ${user.role.padEnd(6)} ${user.email}`);
  } else {
    console.log(`exists   ${user.role.padEnd(6)} ${user.email}`);
  }

  // The auth trigger creates the profile; this makes name/role/active exact
  // even when the user already existed with different metadata.
  const { error } = await supabase
    .from("profiles")
    .upsert({ id, full_name: user.full_name, role: user.role, is_active: true });
  if (error) throw error;
}

async function seedClient() {
  const { data: existing, error: findError } = await supabase
    .from("clients")
    .select("id")
    .ilike("website_url", SEED_CLIENT.website_url)
    .maybeSingle();
  if (findError) throw findError;

  if (existing) {
    console.log(`exists   client ${SEED_CLIENT.name}`);
    return;
  }

  const { error } = await supabase.from("clients").insert(SEED_CLIENT);
  if (error) throw error;
  console.log(`created  client ${SEED_CLIENT.name}`);
}

async function main() {
  console.log(`Seeding ${supabaseUrl}`);
  for (const user of SEED_USERS) await seedUser(user);
  await seedClient();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
