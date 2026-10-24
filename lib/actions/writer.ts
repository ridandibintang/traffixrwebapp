"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { optStr, type FormState } from "@/lib/form";
import { createClient } from "@/lib/supabase/server";

// Writer lane. RLS limits these to the writer's own articles, and the
// protect_article_from_writer trigger limits which columns and statuses a
// writer can change. These actions only add friendlier checks on top.

function revalidateArticle(articleId: string, clientId: string) {
  revalidatePath(`/my-articles/${articleId}`);
  revalidatePath("/my-articles");
  revalidatePath(`/clients/${clientId}/articles/${articleId}`);
  revalidatePath("/content");
  revalidatePath("/dashboard");
}

async function loadOwnArticle(articleId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("id, client_id, status, draft_url")
    .eq("id", articleId)
    .maybeSingle();
  return { supabase, article: data };
}

/** Save the Google Docs link. Moves Assigned -> Writing. */
export async function saveDraftUrlAction(
  articleId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await getCurrentUser();
  const draftUrl = optStr(fd, "draft_url");
  if (!draftUrl || !/^https?:\/\/\S+$/i.test(draftUrl)) return { error: "Paste the full Google Docs link." };

  const { supabase, article } = await loadOwnArticle(articleId);
  if (!article) return { error: "Article not found." };

  const status = article.status === "assigned" || article.status === "draft" ? "writing" : article.status;
  const { error } = await supabase
    .from("articles")
    .update({ draft_url: draftUrl, status })
    .eq("id", articleId);
  if (error) return { error: error.message };

  revalidateArticle(articleId, article.client_id);
  return { error: null };
}

/** Writing or Revision -> Submitted. */
export async function submitForReviewAction(articleId: string) {
  await getCurrentUser();
  const { supabase, article } = await loadOwnArticle(articleId);
  if (!article) throw new Error("Article not found.");
  if (!article.draft_url) throw new Error("Add the draft link before submitting.");
  if (!["assigned", "writing", "revision"].includes(article.status)) {
    throw new Error("This article cannot be submitted right now.");
  }

  const { error } = await supabase.from("articles").update({ status: "submitted" }).eq("id", articleId);
  if (error) throw new Error(error.message);

  revalidateArticle(articleId, article.client_id);
  redirect(`/my-articles/${articleId}`);
}

/** Approved -> Published, with the live URL. */
export async function markPublishedAction(
  articleId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await getCurrentUser();
  const publishedUrl = optStr(fd, "published_url");
  if (!publishedUrl || !/^https?:\/\/\S+$/i.test(publishedUrl)) return { error: "Paste the full published URL." };

  const { supabase, article } = await loadOwnArticle(articleId);
  if (!article) return { error: "Article not found." };
  if (article.status !== "approved") return { error: "Only approved articles can be marked as published." };

  const { error } = await supabase
    .from("articles")
    .update({ published_url: publishedUrl, status: "published" })
    .eq("id", articleId);
  if (error) return { error: error.message };

  revalidateArticle(articleId, article.client_id);
  return { error: null };
}
