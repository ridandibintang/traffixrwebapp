import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { ArticleStatusBadge, BriefStatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { formatShortDate, todayIso } from "@/lib/dates";
import { ARTICLE_STATUS, ARTICLE_STATUS_ORDER } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

// Cross-client content pipeline: where every article stands, and briefs
// that are ready but not yet turned into an article.
export default async function ContentPage() {
  await requireAdmin();
  const supabase = await createClient();
  const today = todayIso();

  const [{ data: articles }, { data: briefs }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, status, due_date, client_id, brief_id, client:clients(name), writer:profiles!articles_writer_id_fkey(full_name)")
      .neq("status", "published")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("content_briefs")
      .select("id, target_keyword, status, client_id, client:clients(name)")
      .eq("status", "ready")
      .order("created_at", { ascending: false }),
  ]);

  const usedBriefIds = new Set((articles ?? []).map((a) => a.brief_id).filter(Boolean));
  const { data: briefsWithArticles } = await supabase
    .from("articles")
    .select("brief_id")
    .not("brief_id", "is", null);
  for (const a of briefsWithArticles ?? []) usedBriefIds.add(a.brief_id);
  const unassignedBriefs = (briefs ?? []).filter((b) => !usedBriefIds.has(b.id));

  const counts = new Map(ARTICLE_STATUS_ORDER.map((s) => [s, 0]));
  for (const a of articles ?? []) counts.set(a.status, (counts.get(a.status) ?? 0) + 1);

  return (
    <>
      <PageHeader title="Content" description="Every article in flight across clients, and briefs waiting for a writer." />

      <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {ARTICLE_STATUS_ORDER.filter((s) => s !== "published").map((s) => (
          <Card key={s}>
            <CardHeader className="p-4">
              <CardDescription>{ARTICLE_STATUS[s]}</CardDescription>
              <CardTitle className="text-2xl">{counts.get(s) ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Articles in progress</CardTitle>
            <CardDescription>Submitted and in-review articles need your attention first.</CardDescription>
          </CardHeader>
          <CardContent>
            {(articles ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No articles in progress.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Writer</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles!.map((a) => {
                    const overdue = a.due_date && a.due_date < today && a.status !== "approved";
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          <Link href={`/clients/${a.client_id}/articles/${a.id}`} className="hover:underline">{a.title}</Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{a.client?.name}</TableCell>
                        <TableCell className="text-muted-foreground">{a.writer?.full_name ?? "Unassigned"}</TableCell>
                        <TableCell className={cn("text-muted-foreground", overdue && "font-medium text-destructive")}>
                          {formatShortDate(a.due_date)}
                        </TableCell>
                        <TableCell><ArticleStatusBadge status={a.status} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Briefs ready to assign</CardTitle>
            <CardDescription>Ready briefs that have no article yet.</CardDescription>
          </CardHeader>
          <CardContent>
            {unassignedBriefs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every ready brief has an article.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Target keyword</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedBriefs.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">
                        <Link href={`/clients/${b.client_id}/briefs/${b.id}`} className="hover:underline">{b.target_keyword}</Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{b.client?.name}</TableCell>
                      <TableCell><BriefStatusBadge status={b.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
