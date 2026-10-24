import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile;
};

// Loads the signed-in user and their profile. Redirects to /login when there is
// no session, and signs out users whose profile is missing or deactivated.
export async function getCurrentUser(): Promise<CurrentUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) redirect("/auth/signout?reason=inactive");

  return { id: user.id, email: user.email ?? "", profile };
}

export async function requireAdmin(): Promise<CurrentUser> {
  const current = await getCurrentUser();
  if (current.profile.role !== "admin") redirect("/my-articles");
  return current;
}

export function homePathFor(role: Profile["role"]) {
  return role === "admin" ? "/dashboard" : "/my-articles";
}
