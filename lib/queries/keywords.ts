import { createClient } from "@/lib/supabase/server";

export async function getClientClusters(clientId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("keyword_clusters")
    .select("id, name")
    .eq("client_id", clientId)
    .order("name");
  return data ?? [];
}
