import { createClient } from "@/lib/supabase/server";
import type { BriefWithChildren } from "@/lib/types";

/** Brief plus children, scoped by RLS (admins: all; writers: assigned briefs). */
export async function getBriefWithChildren(briefId: string): Promise<BriefWithChildren | null> {
  const supabase = await createClient();
  const { data: brief } = await supabase
    .from("content_briefs")
    .select("*")
    .eq("id", briefId)
    .maybeSingle();
  if (!brief) return null;

  const [{ data: competitors }, { data: links }, { data: outline }] = await Promise.all([
    supabase.from("brief_competitors").select("*").eq("brief_id", briefId).order("position"),
    supabase.from("brief_internal_links").select("*").eq("brief_id", briefId).order("position"),
    supabase.from("brief_outline_items").select("*").eq("brief_id", briefId).order("position"),
  ]);

  return {
    ...brief,
    competitors: competitors ?? [],
    internal_links: links ?? [],
    outline: outline ?? [],
  };
}
