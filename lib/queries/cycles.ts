import { createClient } from "@/lib/supabase/server";

export async function getClientCycles(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cycles")
    .select("id, number, start_date, end_date, status")
    .eq("client_id", clientId)
    .order("number", { ascending: false });
  return data ?? [];
}
