import { createClient } from "@/lib/supabase/server";
import type { Article, ArticleReview, Comment } from "@/lib/types";

export type ArticleDetail = Article & {
  client: { name: string; website_url: string } | null;
  writer: { full_name: string } | null;
  brief: { target_keyword: string } | null;
  cycle: { number: number } | null;
};

const ARTICLE_SELECT =
  "*, client:clients(name, website_url), writer:profiles!articles_writer_id_fkey(full_name), brief:content_briefs(target_keyword), cycle:cycles(number)";

/** Scoped by RLS: admins see all, writers only their own. */
export async function getArticle(articleId: string): Promise<ArticleDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select(ARTICLE_SELECT).eq("id", articleId).maybeSingle();
  return (data as ArticleDetail | null) ?? null;
}

export async function getClientArticles(clientId: string): Promise<ArticleDetail[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ArticleDetail[];
}

export async function getMyArticles(writerId: string): Promise<ArticleDetail[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select(ARTICLE_SELECT)
    .eq("writer_id", writerId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as ArticleDetail[];
}

export type ReviewWithReviewer = ArticleReview & { reviewer: { full_name: string } | null };

export async function getReviews(articleId: string): Promise<ReviewWithReviewer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("article_reviews")
    .select("*, reviewer:profiles!article_reviews_reviewer_id_fkey(full_name)")
    .eq("article_id", articleId)
    .order("round", { ascending: false });
  return (data ?? []) as ReviewWithReviewer[];
}

export type CommentWithAuthor = Comment & { author: { full_name: string } | null };

export async function getComments(entityType: "article" | "content_brief", entityId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("*, author:profiles!comments_author_id_fkey(full_name)")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at");
  return (data ?? []) as CommentWithAuthor[];
}
