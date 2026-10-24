"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { firstIssue, optInt, optNumber, optStr, str, type FormState } from "@/lib/form";
import { parseKeywordCsv } from "@/lib/keywords/csv";
import { createClient } from "@/lib/supabase/server";
import type { KeywordSource, TablesInsert } from "@/lib/types";

const INTENTS = ["informational", "navigational", "commercial", "transactional"] as const;

// ---------------------------------------------------------------------------
// Clusters
// ---------------------------------------------------------------------------
const clusterSchema = z.object({
  name: z.string().min(1, "Name is required"),
  intent: z.enum(INTENTS).nullable(),
  page_type: z.enum(["blog", "landing", "service"]).nullable(),
  target_url: z.url({ message: "Target URL must be a full URL" }).nullable(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

function parseCluster(fd: FormData) {
  return clusterSchema.safeParse({
    name: str(fd, "name"),
    intent: optStr(fd, "intent"),
    page_type: optStr(fd, "page_type"),
    target_url: optStr(fd, "target_url"),
    priority: str(fd, "priority") || "medium",
  });
}

export async function createClusterAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseCluster(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("keyword_clusters")
    .insert({ ...parsed.data, client_id: clientId });
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/keywords`);
  redirect(`/clients/${clientId}/keywords`);
}

export async function updateClusterAction(
  clusterId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseCluster(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("keyword_clusters")
    .update(parsed.data)
    .eq("id", clusterId)
    .select("client_id")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/clients/${data.client_id}/keywords`);
  redirect(`/clients/${data.client_id}/keywords`);
}

export async function deleteClusterAction(clusterId: string, clientId: string) {
  await requireAdmin();
  const supabase = await createClient();
  // Keywords in the cluster are kept (cluster_id becomes null).
  const { error } = await supabase.from("keyword_clusters").delete().eq("id", clusterId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}/keywords`);
  redirect(`/clients/${clientId}/keywords`);
}

// ---------------------------------------------------------------------------
// Keywords
// ---------------------------------------------------------------------------
const keywordSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  cluster_id: z.uuid().nullable(),
  search_volume: z.number().int().min(0).nullable(),
  difficulty: z.number().min(0).max(100).nullable(),
  cpc: z.number().min(0).nullable(),
  intent: z.enum(INTENTS).nullable(),
  source: z.enum(["manual", "dataforseo", "se_ranking"]),
});

function parseKeyword(fd: FormData) {
  return keywordSchema.safeParse({
    keyword: str(fd, "keyword").toLowerCase(),
    cluster_id: optStr(fd, "cluster_id"),
    search_volume: optInt(fd, "search_volume"),
    difficulty: optNumber(fd, "difficulty"),
    cpc: optNumber(fd, "cpc"),
    intent: optStr(fd, "intent"),
    source: str(fd, "source") || "manual",
  });
}

function duplicateMessage(code: string | undefined, message: string) {
  return code === "23505" ? "This keyword already exists for this client." : message;
}

export async function createKeywordAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseKeyword(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("keywords").insert({
    ...parsed.data,
    client_id: clientId,
    fetched_at: parsed.data.source === "manual" ? null : new Date().toISOString(),
  });
  if (error) return { error: duplicateMessage(error.code, error.message) };

  revalidatePath(`/clients/${clientId}/keywords`);
  redirect(`/clients/${clientId}/keywords`);
}

export async function updateKeywordAction(
  keywordId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseKeyword(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("keywords")
    .update(parsed.data)
    .eq("id", keywordId)
    .select("client_id")
    .single();
  if (error) return { error: duplicateMessage(error.code, error.message) };

  revalidatePath(`/clients/${data.client_id}/keywords`);
  redirect(`/clients/${data.client_id}/keywords`);
}

export async function deleteKeywordAction(keywordId: string, clientId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("keywords").delete().eq("id", keywordId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}/keywords`);
  redirect(`/clients/${clientId}/keywords`);
}

// ---------------------------------------------------------------------------
// CSV import (parsing lives in lib/keywords/csv.ts so it can be tested)
// ---------------------------------------------------------------------------
export type ImportState = FormState & { imported?: number; skipped?: number };

export async function importKeywordsAction(
  clientId: string,
  _prev: ImportState,
  fd: FormData,
): Promise<ImportState> {
  await requireAdmin();

  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file first." };
  if (file.size > 5 * 1024 * 1024) return { error: "CSV is larger than 5 MB." };

  const source = (optStr(fd, "source") ?? "manual") as KeywordSource;
  const defaultClusterId = optStr(fd, "cluster_id");

  const parsed = parseKeywordCsv(await file.text());
  if (!parsed.ok) return { error: parsed.error };
  if (parsed.rows.length === 0) return { error: "No keywords found in the file.", skipped: parsed.skipped };

  const supabase = await createClient();

  // Resolve cluster names to ids, creating missing clusters on the fly.
  const { data: existingClusters } = await supabase
    .from("keyword_clusters")
    .select("id, name")
    .eq("client_id", clientId);
  const clusterByName = new Map(
    (existingClusters ?? []).map((c) => [c.name.trim().toLowerCase(), c.id]),
  );

  const fetchedAt = source === "manual" ? null : new Date().toISOString();
  const rows: TablesInsert<"keywords">[] = [];
  for (const r of parsed.rows) {
    let clusterId = defaultClusterId;
    if (r.cluster_name) {
      const key = r.cluster_name.toLowerCase();
      if (!clusterByName.has(key)) {
        const { data: created } = await supabase
          .from("keyword_clusters")
          .insert({ client_id: clientId, name: r.cluster_name })
          .select("id")
          .single();
        if (created) clusterByName.set(key, created.id);
      }
      clusterId = clusterByName.get(key) ?? clusterId;
    }
    rows.push({
      client_id: clientId,
      keyword: r.keyword,
      cluster_id: clusterId,
      search_volume: r.search_volume,
      difficulty: r.difficulty,
      cpc: r.cpc,
      intent: r.intent,
      source,
      fetched_at: fetchedAt,
    });
  }

  // Existing keywords are refreshed (volume, difficulty, cpc, intent, cluster).
  const { error } = await supabase
    .from("keywords")
    .upsert(rows, { onConflict: "client_id,keyword" });
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/keywords`);
  return { error: null, imported: rows.length, skipped: parsed.skipped };
}
