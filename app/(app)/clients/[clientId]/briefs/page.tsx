import Link from "next/link";
import { FileJson, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { ArticleStatusBadge, BriefStatusBadge, IntentBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatShortDate } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function BriefsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const [{ data: briefs }, { data: articles }] = await Promise.all([
    supabase.from("content_briefs").select("*").eq("client_id", clientId).order("created_at", { ascending: false }),
    supabase.from("articles").select("id, brief_id, status").eq("client_id", clientId),
  ]);
  const articleByBrief = new Map((articles ?? []).filter((a) => a.brief_id).map((a) => [a.brief_id!, a]));
  const base = `/clients/${clientId}/briefs`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Content briefs</h2>
          <p className="text-sm text-muted-foreground">Golden Standard briefs, imported from Claude or written here.</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href={`${base}/import`} variant="outline" size="sm"><FileJson />Import JSON</LinkButton>
          <LinkButton href={`${base}/new`} size="sm"><Plus />New brief</LinkButton>
        </div>
      </div>

      {(briefs ?? []).length === 0 ? (
        <EmptyState
          title="No briefs yet"
          description="Import the JSON file from the Golden Standard skill, or write a brief with the 7-section form."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target keyword</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Words</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Article</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {briefs!.map((b) => {
              const article = articleByBrief.get(b.id);
              return (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">
                    <Link href={`${base}/${b.id}`} className="hover:underline">{b.target_keyword}</Link>
                  </TableCell>
                  <TableCell><IntentBadge intent={b.search_intent} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {b.word_count_min != null ? `${b.word_count_min}–${b.word_count_max ?? "?"}` : "—"}
                  </TableCell>
                  <TableCell><BriefStatusBadge status={b.status} /></TableCell>
                  <TableCell>
                    {article ? (
                      <Link href={`/clients/${clientId}/articles/${article.id}`} className="hover:underline">
                        <ArticleStatusBadge status={article.status} />
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatShortDate(b.created_at.slice(0, 10))}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
