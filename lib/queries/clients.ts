import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getClientOr404(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("clients").select("*").eq("id", clientId).maybeSingle();
  if (!data) notFound();
  return data;
}

export async function getTeam() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active")
    .eq("is_active", true)
    .order("full_name");
  return data ?? [];
}
