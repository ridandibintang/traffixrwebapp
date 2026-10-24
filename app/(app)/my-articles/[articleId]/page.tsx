import Link from "next/link";
import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { CommentSection } from "@/components/articles/comment-section";
import { ReviewHistory } from "@/components/articles/review-history";
import { WriterActions } from "@/components/articles/writer-actions";
import { BriefView } from "@/components/briefs/brief-view";
import { DownloadButton } from "@/components/shared/download-button";
import { ArticleStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { asLinkItems } from "@/lib/form";
import { getArticle, getComments, getReviews } from "@/lib/queries/articles";
import { getBriefWithChildren } from "@/lib/queries/briefs";
import { createClient } from "@/lib/supabase/server";

function Block({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-semibold text-muted-foreground uppercase">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default async function WriterArticlePage({
  params,
}: {
  params: Promise<{ articleId: string }>;
}) {
  await getCurrentUser();
  const { articleId } = await params;
  const article = await getArticle(articleId);
  if (!article) notFound();

  const supabase = await createClient();
  const [brief, reviews, comments, { data: client }] = await Promise.all([
    article.brief_id ? getBriefWithChildren(article.brief_id) : Promise.resolve(null),
    getReviews(articleId),
    getComments("article", articleId),
    supabase.from("clients").select("*").eq("id", article.client_id).maybeSingle(),
  ]);

  const services = asLinkItems(client?.services);
  const keyPages = asLinkItems(client?.key_pages);
  const here = `/my-articles/${articleId}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/my-articles" className="text-xs text-muted-foreground hover:underline">← My articles</Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">{article.title}</h1>
          <ArticleStatusBadge status={article.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {article.client?.name} · Due {formatDate(article.due_date)}
          {brief ? ` · Target keyword: ${brief.target_keyword}` : ""}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Your next step</CardTitle>
            </CardHeader>
            <CardContent>
              <WriterActions article={article} />
            </CardContent>
          </Card>

          {reviews.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Review feedback</CardTitle>
                <CardDescription>Latest round first.</CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewHistory reviews={reviews} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSection entityType="article" entityId={article.id} comments={comments} revalidate={here} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>About {client?.name ?? "the client"}</CardTitle>
            <CardDescription>Who you are writing for.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {client?.website_url ? (
              <a href={client.website_url} target="_blank" rel="noreferrer" className="text-sm hover:underline">{client.website_url}</a>
            ) : null}
            <Block label="Audience" value={client?.audience ?? null} />
            <Block label="Brand voice" value={client?.brand_voice ?? null} />
            {services.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Services</p>
                <ul className="text-sm">
                  {services.map((s, i) => (
                    <li key={i}>
                      {s.url ? <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">{s.name}</a> : s.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {keyPages.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Key pages</p>
                <ul className="text-sm">
                  {keyPages.map((p, i) => (
                    <li key={i}>
                      {p.url ? <a href={p.url} target="_blank" rel="noreferrer" className="hover:underline">{p.name}</a> : p.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Block label="Client notes" value={client?.client_notes ?? null} />
          </CardContent>
        </Card>
      </div>

      {brief ? (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Content brief</CardTitle>
              <CardDescription>Follow this structure. Every outline row is a heading in the article.</CardDescription>
            </div>
            <DownloadButton href={`/api/briefs/${brief.id}/docx`} variant="outline" size="sm">
              <Download />
              Download .docx
            </DownloadButton>
          </CardHeader>
          <CardContent>
            <BriefView brief={brief} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
