// One schema for a brief and its three child lists, shared by the 7-section
// form and the JSON import so both paths validate and save identically.
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/lib/types";

const INTENTS = ["informational", "navigational", "commercial", "transactional"] as const;

const nullableText = z
  .string()
  .transform((s) => (s.trim() === "" ? null : s))
  .nullable();

export const competitorSchema = z.object({
  position: z.number().int().min(1),
  domain: z.string().trim().min(1, "Competitor domain is required"),
  page_title: nullableText,
  url: z.string().trim().regex(/^https?:\/\/\S+$/i, "Competitor URL must be a full URL"),
});

export const internalLinkSchema = z.object({
  position: z.number().int().min(1),
  url: z.string().trim().regex(/^https?:\/\/\S+$/i, "Internal link URL must be a full URL"),
  anchor_text: z.string().trim().min(1, "Anchor text is required"),
  placement_note: nullableText,
});

export const outlineItemSchema = z.object({
  position: z.number().int().min(1),
  level: z.enum(["h1", "h2", "h3"]),
  heading: z.string().trim().min(1, "Heading is required"),
  key_points: nullableText,
});

export const briefPayloadSchema = z
  .object({
    target_keyword: z.string().trim().min(1, "Target keyword is required"),
    keyword_id: z.uuid().nullable(),
    status: z.enum(["draft", "ready", "archived"]),
    objective: nullableText,
    search_intent: z.enum(INTENTS).nullable(),
    intent_reason: nullableText,
    target_audience: nullableText,
    word_count_min: z.number().int().min(0).nullable(),
    word_count_max: z.number().int().min(0).nullable(),
    meta_title: nullableText,
    meta_description: nullableText,
    content_gaps: nullableText,
    writing_best_practices: nullableText,
    conclusion_notes: nullableText,
    cta_copy: nullableText,
    competitors: z.array(competitorSchema),
    internal_links: z.array(internalLinkSchema),
    outline: z.array(outlineItemSchema),
  })
  .refine(
    (b) => b.word_count_min == null || b.word_count_max == null || b.word_count_max >= b.word_count_min,
    { message: "Maximum word count must be at least the minimum", path: ["word_count_max"] },
  );

export type BriefPayload = z.infer<typeof briefPayloadSchema>;

// The file the Golden Standard skill produces next to the .docx.
export const briefImportSchema = z.object({
  schema_version: z.literal(1),
  client: z
    .object({ name: z.string().optional(), website_url: z.string().optional() })
    .partial()
    .optional(),
  brief: z.object({
    target_keyword: z.string().min(1),
    objective: z.string().nullish(),
    search_intent: z.enum(INTENTS).nullish(),
    intent_reason: z.string().nullish(),
    target_audience: z.string().nullish(),
    word_count_min: z.number().int().nullish(),
    word_count_max: z.number().int().nullish(),
    meta_title: z.string().nullish(),
    meta_description: z.string().nullish(),
    content_gaps: z.string().nullish(),
    writing_best_practices: z.string().nullish(),
    conclusion_notes: z.string().nullish(),
    cta_copy: z.string().nullish(),
  }),
  competitors: z
    .array(z.object({ position: z.number().int(), domain: z.string(), page_title: z.string().nullish(), url: z.string() }))
    .default([]),
  internal_links: z
    .array(z.object({ position: z.number().int(), url: z.string(), anchor_text: z.string(), placement_note: z.string().nullish() }))
    .default([]),
  outline: z
    .array(z.object({ position: z.number().int(), level: z.enum(["h1", "h2", "h3"]), heading: z.string(), key_points: z.string().nullish() }))
    .default([]),
});

export type BriefImport = z.infer<typeof briefImportSchema>;

/** Converts the import file into the shared payload (status becomes "ready"). */
export function importToPayload(file: BriefImport): unknown {
  const b = file.brief;
  return {
    target_keyword: b.target_keyword,
    keyword_id: null,
    status: "ready",
    objective: b.objective ?? "",
    search_intent: b.search_intent ?? null,
    intent_reason: b.intent_reason ?? "",
    target_audience: b.target_audience ?? "",
    word_count_min: b.word_count_min ?? null,
    word_count_max: b.word_count_max ?? null,
    meta_title: b.meta_title ?? "",
    meta_description: b.meta_description ?? "",
    content_gaps: b.content_gaps ?? "",
    writing_best_practices: b.writing_best_practices ?? "",
    conclusion_notes: b.conclusion_notes ?? "",
    cta_copy: b.cta_copy ?? "",
    competitors: [...file.competitors]
      .sort((a, c) => a.position - c.position)
      .map((c, i) => ({ ...c, position: i + 1, page_title: c.page_title ?? "" })),
    internal_links: [...file.internal_links]
      .sort((a, c) => a.position - c.position)
      .map((l, i) => ({ ...l, position: i + 1, placement_note: l.placement_note ?? "" })),
    outline: [...file.outline]
      .sort((a, c) => a.position - c.position)
      .map((o, i) => ({ ...o, position: i + 1, key_points: o.key_points ?? "" })),
  };
}

/** Inserts or replaces a brief and its child rows. Returns the brief id. */
export async function saveBrief(
  supabase: SupabaseClient<Database>,
  input: { clientId: string; payload: BriefPayload; briefId?: string; createdBy?: string },
): Promise<{ id: string } | { error: string }> {
  const { competitors, internal_links, outline, ...fields } = input.payload;

  let briefId = input.briefId;
  if (briefId) {
    const { error } = await supabase.from("content_briefs").update(fields).eq("id", briefId);
    if (error) return { error: error.message };
    // Replace children wholesale; the lists are small.
    const deletes = await Promise.all([
      supabase.from("brief_competitors").delete().eq("brief_id", briefId),
      supabase.from("brief_internal_links").delete().eq("brief_id", briefId),
      supabase.from("brief_outline_items").delete().eq("brief_id", briefId),
    ]);
    const failed = deletes.find((d) => d.error);
    if (failed?.error) return { error: failed.error.message };
  } else {
    const { data, error } = await supabase
      .from("content_briefs")
      .insert({ ...fields, client_id: input.clientId, created_by: input.createdBy ?? null })
      .select("id")
      .single();
    if (error) return { error: error.message };
    briefId = data.id;
  }

  const id = briefId;
  const inserts = await Promise.all([
    competitors.length
      ? supabase.from("brief_competitors").insert(competitors.map((c) => ({ ...c, brief_id: id })))
      : Promise.resolve({ error: null }),
    internal_links.length
      ? supabase.from("brief_internal_links").insert(internal_links.map((l) => ({ ...l, brief_id: id })))
      : Promise.resolve({ error: null }),
    outline.length
      ? supabase.from("brief_outline_items").insert(outline.map((o) => ({ ...o, brief_id: id })))
      : Promise.resolve({ error: null }),
  ]);
  const failed = inserts.find((r) => r.error);
  if (failed?.error) return { error: failed.error.message };

  return { id };
}

// Default text for section 6 on a new brief; editable per brief.
export const DEFAULT_BEST_PRACTICES = `Keep paragraphs to 2–4 sentences. Write in second person, plain and confident.

Every parallel item (each method, cause, or FAQ) gets its own H3, no exceptions.

Add one relevant image per H2 with descriptive alt text.

Place internal links contextually where the outline notes them, never clustered in one section.

Use the target keyword naturally in the H1, the intro, one H2, and the conclusion. No stuffing.

One CTA mid-article and one in the conclusion. Keep the educational value first.`;
