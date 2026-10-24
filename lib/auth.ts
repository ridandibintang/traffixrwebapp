import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile;
};

/**
 * Loads the signed-in user and their profile. Redirects to /login when there
 * is no session, and signs out users whose profile is missing or deactivated.
 *
 * Wrapped in React cache() so the root layout, a client layout and the page
 * share one lookup per request instead of repeating it three times.
 * getClaims() verifies the JWT locally (asymmetric signing keys) and only
 * falls back to the Auth server for legacy secrets, so this is usually one
 * database query per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", claims.sub)
    .maybeSingle();

  if (!profile || !profile.is_active) redirect("/auth/signout?reason=inactive");

  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : "", profile };
});

export async function requireAdmin(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (current.profile.role !== "admin") redirect("/my-articles");
  return current;
}

export function homePathFor(role: Profile["role"]) {
  return role === "admin" ? "/dashboard" : "/my-articles";
}
