"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  briefImportSchema,
  briefPayloadSchema,
  importToPayload,
  saveBrief,
} from "@/lib/briefs/schema";
import { firstIssue, optInt, optStr, str, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

function parseJsonField<T>(fd: FormData, key: string, fallback: T): T {
  const raw = str(fd, key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Reads the 7-section form into the shared payload shape. */
function parseBriefForm(fd: FormData) {
  return briefPayloadSchema.safeParse({
    target_keyword: str(fd, "target_keyword"),
    keyword_id: optStr(fd, "keyword_id"),
    status: str(fd, "status") || "draft",
    objective: str(fd, "objective"),
    search_intent: optStr(fd, "search_intent"),
    intent_reason: str(fd, "intent_reason"),
    target_audience: str(fd, "target_audience"),
    word_count_min: optInt(fd, "word_count_min"),
    word_count_max: optInt(fd, "word_count_max"),
    meta_title: str(fd, "meta_title"),
    meta_description: str(fd, "meta_description"),
    content_gaps: str(fd, "content_gaps"),
    writing_best_practices: str(fd, "writing_best_practices"),
    conclusion_notes: str(fd, "conclusion_notes"),
    cta_copy: str(fd, "cta_copy"),
    competitors: parseJsonField(fd, "competitors_json", []),
    internal_links: parseJsonField(fd, "internal_links_json", []),
    outline: parseJsonField(fd, "outline_json", []),
  });
}

export async function createBriefAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const parsed = parseBriefForm(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const result = await saveBrief(supabase, { clientId, payload: parsed.data, createdBy: user.id });
  if ("error" in result) return { error: result.error };

  revalidatePath(`/clients/${clientId}/briefs`);
  redirect(`/clients/${clientId}/briefs/${result.id}`);
}

export async function updateBriefAction(
  briefId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseBriefForm(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("content_briefs")
    .select("client_id")
    .eq("id", briefId)
    .maybeSingle();
  if (!existing) return { error: "Brief not found." };

  const result = await saveBrief(supabase, { clientId: existing.client_id, payload: parsed.data, briefId });
  if ("error" in result) return { error: result.error };

  revalidatePath(`/clients/${existing.client_id}/briefs`, "layout");
  redirect(`/clients/${existing.client_id}/briefs/${briefId}`);
}

export async function deleteBriefAction(briefId: string, clientId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("content_briefs").delete().eq("id", briefId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}/briefs`);
  redirect(`/clients/${clientId}/briefs`);
}

/** Import Brief: the JSON file produced by the Golden Standard skill. */
export async function importBriefAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireAdmin();

  let text = str(fd, "json_text");
  const file = fd.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) return { error: "JSON file is larger than 2 MB." };
    text = await file.text();
  }
  if (!text) return { error: "Choose a JSON file or paste the JSON." };

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { error: "The file is not valid JSON." };
  }

  const imported = briefImportSchema.safeParse(json);
  if (!imported.success) return { error: `JSON does not match the brief format: ${firstIssue(imported.error)}` };

  const supabase = await createClient();

  // Guard against importing a brief written for another client.
  const declaredSite = imported.data.client?.website_url;
  if (declaredSite) {
    const { data: client } = await supabase.from("clients").select("website_url").eq("id", clientId).single();
    const host = (u: string) => u.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "").toLowerCase();
    if (client && host(client.website_url) !== host(declaredSite)) {
      return { error: `This brief was written for ${declaredSite}, not for this client.` };
    }
  }

  const payload = briefPayloadSchema.safeParse(importToPayload(imported.data));
  if (!payload.success) return { error: firstIssue(payload.error) };

  // Link to an existing keyword row when the text matches.
  const { data: keyword } = await supabase
    .from("keywords")
    .select("id")
    .eq("client_id", clientId)
    .ilike("keyword", payload.data.target_keyword)
    .maybeSingle();

  const result = await saveBrief(supabase, {
    clientId,
    payload: { ...payload.data, keyword_id: keyword?.id ?? null },
    createdBy: user.id,
  });
  if ("error" in result) return { error: result.error };

  revalidatePath(`/clients/${clientId}/briefs`);
  redirect(`/clients/${clientId}/briefs/${result.id}`);
}
