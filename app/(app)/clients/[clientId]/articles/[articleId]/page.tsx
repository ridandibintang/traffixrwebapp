import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Pencil, SearchCheck } from "lucide-react";
import { CommentSection } from "@/components/articles/comment-section";
import { ReviewForm } from "@/components/articles/review-form";
import { ReviewHistory } from "@/components/articles/review-history";
import { DeleteButton } from "@/components/shared/delete-button";
import { LinkButton } from "@/components/shared/link-button";
import { ArticleStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteArticleAction, startReviewAction, submitReviewAction } from "@/lib/actions/articles";
import { formatDate } from "@/lib/dates";
import { getArticle, getComments, getReviews } from "@/lib/queries/articles";

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

function ExtLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return <span className="text-muted-foreground">Not yet</span>;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
      {label}
      <ExternalLink className="size-3" />
    </a>
  );
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ clientId: string; articleId: string }>;
}) {
  const { clientId, articleId } = await params;
  const article = await getArticle(articleId);
  if (!article || article.client_id !== clientId) notFound();

  const [reviews, comments] = await Promise.all([getReviews(articleId), getComments("article", articleId)]);
  const base = `/clients/${clientId}`;
  const here = `${base}/articles/${articleId}`;
  const canReview = article.status === "in_review";
  const canStartReview = article.status === "submitted";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{article.title}</h2>
            <ArticleStatusBadge status={article.status} />
          </div>
          {article.brief_id ? (
            <p className="text-sm text-muted-foreground">
              Brief:{" "}
              <Link href={`${base}/briefs/${article.brief_id}`} className="hover:underline">
                {article.brief?.target_keyword}
              </Link>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No brief attached.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canStartReview ? (
            <form action={startReviewAction.bind(null, article.id, clientId)}>
              <Button type="submit" size="sm">
                <SearchCheck />
                Start review
              </Button>
            </form>
          ) : null}
          <LinkButton href={`${here}/edit`} variant="outline" size="sm"><Pencil />Edit</LinkButton>
          <DeleteButton action={deleteArticleAction.bind(null, article.id, clientId)} confirmText="Delete this article and its reviews?" />
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-4 rounded-lg border p-4 sm:grid-cols-3 lg:grid-cols-6">
        <Meta label="Writer">{article.writer?.full_name ?? "Unassigned"}</Meta>
        <Meta label="Due">{formatDate(article.due_date)}</Meta>
        <Meta label="Cycle">{article.cycle ? `Cycle ${article.cycle.number}` : "—"}</Meta>
        <Meta label="Draft"><ExtLink href={article.draft_url} label="Google Docs" /></Meta>
        <Meta label="Submitted">{article.submitted_at ? formatDate(article.submitted_at.slice(0, 10)) : "—"}</Meta>
        <Meta label="Published"><ExtLink href={article.published_url} label={article.published_at ? formatDate(article.published_at.slice(0, 10)) : "Live page"} /></Meta>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {canReview ? (
            <Card>
              <CardHeader>
                <CardTitle>Review</CardTitle>
                <CardDescription>Read the draft, tick what passes, then approve or request a revision.</CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewForm action={submitReviewAction.bind(null, article.id)} round={reviews.length + 1} />
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardHeader>
              <CardTitle>Review history</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewHistory reviews={reviews} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
            <CardDescription>Discussion with the writer lives here, not in chat.</CardDescription>
          </CardHeader>
          <CardContent>
            <CommentSection entityType="article" entityId={article.id} comments={comments} revalidate={here} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
