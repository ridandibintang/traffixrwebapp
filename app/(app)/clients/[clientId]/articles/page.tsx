import Link from "next/link";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { ArticleStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate, todayIso } from "@/lib/dates";
import { getClientArticles } from "@/lib/queries/articles";
import { cn } from "@/lib/utils";

export default async function ArticlesPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const articles = await getClientArticles(clientId);
  const today = todayIso();
  const base = `/clients/${clientId}/articles`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Articles</h2>
          <p className="text-sm text-muted-foreground">From brief to published, with reviews in between.</p>
        </div>
        <LinkButton href={`${base}/new`} size="sm"><Plus />New article</LinkButton>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          title="No articles yet"
          description="Open a brief and click Create article to assign it to a writer."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Brief</TableHead>
              <TableHead>Writer</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Links</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((a) => {
              const overdue = a.due_date && a.due_date < today && !["approved", "published"].includes(a.status);
              return (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <Link href={`${base}/${a.id}`} className="hover:underline">{a.title}</Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.brief_id ? (
                      <Link href={`/clients/${clientId}/briefs/${a.brief_id}`} className="hover:underline">
                        {a.brief?.target_keyword}
                      </Link>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.writer?.full_name ?? "Unassigned"}</TableCell>
                  <TableCell className={cn("text-muted-foreground", overdue && "font-medium text-destructive")}>
                    {formatShortDate(a.due_date)}
                  </TableCell>
                  <TableCell><ArticleStatusBadge status={a.status} /></TableCell>
                  <TableCell className="text-xs">
                    {a.draft_url ? <a href={a.draft_url} target="_blank" rel="noreferrer" className="mr-2 hover:underline">Draft</a> : null}
                    {a.published_url ? <a href={a.published_url} target="_blank" rel="noreferrer" className="hover:underline">Live</a> : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
