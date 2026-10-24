"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { bool, firstIssue, optStr, str, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";
import type { ArticleStatus } from "@/lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES = [
  "draft", "assigned", "writing", "submitted", "in_review", "revision", "approved", "published",
] as const;

const articleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  brief_id: z.uuid().nullable(),
  writer_id: z.uuid().nullable(),
  cycle_id: z.uuid().nullable(),
  due_date: z.string().regex(ISO_DATE).nullable(),
  status: z.enum(STATUSES),
  draft_url: z.url({ message: "Draft URL must be a full URL" }).nullable(),
  published_url: z.url({ message: "Published URL must be a full URL" }).nullable(),
});

function parseArticle(fd: FormData, fallbackStatus: ArticleStatus) {
  return articleSchema.safeParse({
    title: str(fd, "title"),
    brief_id: optStr(fd, "brief_id"),
    writer_id: optStr(fd, "writer_id"),
    cycle_id: optStr(fd, "cycle_id"),
    due_date: optStr(fd, "due_date"),
    status: str(fd, "status") || fallbackStatus,
    draft_url: optStr(fd, "draft_url"),
    published_url: optStr(fd, "published_url"),
  });
}

/** Timestamps that follow a status change. */
function timestampsFor(
  status: ArticleStatus,
  previous: { status: ArticleStatus; submitted_at: string | null; approved_at: string | null; published_at: string | null },
) {
  const now = new Date().toISOString();
  const patch: { submitted_at?: string | null; approved_at?: string | null; published_at?: string | null } = {};
  if (status === "submitted" && previous.status !== "submitted") patch.submitted_at = now;
  if (status === "approved" && !previous.approved_at) patch.approved_at = now;
  if (status === "published" && !previous.published_at) patch.published_at = now;
  if (status !== "published" && previous.status === "published") patch.published_at = null;
  return patch;
}

export async function createArticleAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = parseArticle(fd, "draft");
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  // A fresh article with a writer starts as Assigned.
  const status: ArticleStatus =
    parsed.data.status === "draft" && parsed.data.writer_id ? "assigned" : parsed.data.status;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("articles")
    .insert({ ...parsed.data, status, client_id: clientId })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`, "layout");
  revalidatePath("/content");
  redirect(`/clients/${clientId}/articles/${data.id}`);
}

export async function updateArticleAction(
  articleId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("articles")
    .select("client_id, status, submitted_at, approved_at, published_at")
    .eq("id", articleId)
    .maybeSingle();
  if (!existing) return { error: "Article not found." };

  const parsed = parseArticle(fd, existing.status);
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { error } = await supabase
    .from("articles")
    .update({ ...parsed.data, ...timestampsFor(parsed.data.status, existing) })
    .eq("id", articleId);
  if (error) return { error: error.message };

  revalidatePath(`/clients/${existing.client_id}`, "layout");
  revalidatePath("/content");
  revalidatePath("/my-articles", "layout");
  redirect(`/clients/${existing.client_id}/articles/${articleId}`);
}

export async function deleteArticleAction(articleId: string, clientId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("articles").delete().eq("id", articleId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`, "layout");
  revalidatePath("/content");
  redirect(`/clients/${clientId}/articles`);
}

/** Submitted -> In review, so the writer sees it is being read. */
export async function startReviewAction(articleId: string, clientId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("articles")
    .update({ status: "in_review" })
    .eq("id", articleId)
    .in("status", ["submitted", "revision"]);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}/articles/${articleId}`);
  revalidatePath("/my-articles", "layout");
  redirect(`/clients/${clientId}/articles/${articleId}`);
}

/** One review round: three checks, notes, and the decision. */
export async function submitReviewAction(
  articleId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const user = await requireAdmin();
  const decision = str(fd, "decision");
  if (decision !== "approve" && decision !== "revise") return { error: "Choose approve or request revision." };
  const notes = optStr(fd, "notes");
  if (decision === "revise" && !notes) return { error: "Add notes so the writer knows what to change." };

  const supabase = await createClient();
  const { data: article } = await supabase
    .from("articles")
    .select("client_id, status, submitted_at, approved_at, published_at")
    .eq("id", articleId)
    .maybeSingle();
  if (!article) return { error: "Article not found." };

  const { count } = await supabase
    .from("article_reviews")
    .select("id", { count: "exact", head: true })
    .eq("article_id", articleId);

  const { error: reviewError } = await supabase.from("article_reviews").insert({
    article_id: articleId,
    reviewer_id: user.id,
    round: (count ?? 0) + 1,
    intent_ok: bool(fd, "intent_ok"),
    readability_ok: bool(fd, "readability_ok"),
    facts_ok: bool(fd, "facts_ok"),
    notes,
    decision,
  });
  if (reviewError) return { error: reviewError.message };

  const status: ArticleStatus = decision === "approve" ? "approved" : "revision";
  const { error } = await supabase
    .from("articles")
    .update({ status, ...timestampsFor(status, article) })
    .eq("id", articleId);
  if (error) return { error: error.message };

  revalidatePath(`/clients/${article.client_id}`, "layout");
  revalidatePath("/content");
  revalidatePath("/my-articles", "layout");
  redirect(`/clients/${article.client_id}/articles/${articleId}`);
}
