import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types/database";
import { getSupabaseEnv } from "./env";

// For Server Components, Server Actions and Route Handlers.
export async function createClient() {
  // Read cookies first: it marks the route as dynamic, so `next build` never
  // tries to prerender an auth-gated page (and never needs env at build time).
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component: cookies cannot be written there.
          // The proxy refreshes the session on the next request instead.
        }
      },
    },
  });
}
