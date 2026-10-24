// Supabase projects created in 2025+ expose a "publishable" key; older ones
// expose an "anon" key. Both are safe for the browser and behave the same.
// Read lazily so a missing .env.local fails at request time with a clear
// message instead of breaking `next build`.
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.local.example to .env.local and fill it in.",
    );
  }

  return { url, key };
}
