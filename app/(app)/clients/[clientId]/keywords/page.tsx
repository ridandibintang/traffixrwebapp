import Link from "next/link";
import { FileUp, FolderPlus, Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { IntentBadge, PriorityBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { KEYWORD_SOURCE, PAGE_TYPE } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import type { Keyword, KeywordCluster } from "@/lib/types";

const num = new Intl.NumberFormat("en-US");

function KeywordTable({ rows, base }: { rows: Keyword[]; base: string }) {
  if (rows.length === 0) {
    return <p className="px-1 py-2 text-sm text-muted-foreground">No keywords in this cluster.</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Keyword</TableHead>
          <TableHead className="text-right">Volume</TableHead>
          <TableHead className="text-right">KD</TableHead>
          <TableHead className="text-right">CPC</TableHead>
          <TableHead>Intent</TableHead>
          <TableHead>Source</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((k) => (
          <TableRow key={k.id}>
            <TableCell className="font-medium">
              <Link href={`${base}/${k.id}/edit`} className="hover:underline">{k.keyword}</Link>
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {k.search_volume != null ? num.format(k.search_volume) : "—"}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">{k.difficulty ?? "—"}</TableCell>
            <TableCell className="text-right text-muted-foreground">{k.cpc ?? "—"}</TableCell>
            <TableCell><IntentBadge intent={k.intent} /></TableCell>
            <TableCell className="text-muted-foreground">{KEYWORD_SOURCE[k.source]}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function KeywordsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const [{ data: clusters }, { data: keywords }] = await Promise.all([
    supabase.from("keyword_clusters").select("*").eq("client_id", clientId).order("priority", { ascending: false }).order("name"),
    supabase.from("keywords").select("*").eq("client_id", clientId).order("search_volume", { ascending: false, nullsFirst: false }).order("keyword"),
  ]);

  const byCluster = new Map<string | null, Keyword[]>();
  for (const k of keywords ?? []) {
    byCluster.set(k.cluster_id, [...(byCluster.get(k.cluster_id) ?? []), k]);
  }
  const unclustered = byCluster.get(null) ?? [];
  const base = `/clients/${clientId}/keywords`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Keywords</h2>
          <p className="text-sm text-muted-foreground">
            {keywords?.length ?? 0} keywords in {clusters?.length ?? 0} clusters. Briefs are created from clusters.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`${base}/import`} variant="outline" size="sm"><FileUp />Import CSV</LinkButton>
          <LinkButton href={`${base}/clusters/new`} variant="outline" size="sm"><FolderPlus />New cluster</LinkButton>
          <LinkButton href={`${base}/new`} size="sm"><Plus />Add keyword</LinkButton>
        </div>
      </div>

      {(clusters ?? []).length === 0 && unclustered.length === 0 ? (
        <EmptyState
          title="No keywords yet"
          description="Import a CSV from your keyword research or add keywords one by one, then group them into clusters."
        />
      ) : null}

      {(clusters ?? []).map((cluster: KeywordCluster) => (
        <section key={cluster.id} className="flex flex-col gap-2 rounded-lg border p-4">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">
                  <Link href={`${base}/clusters/${cluster.id}/edit`} className="hover:underline">{cluster.name}</Link>
                </h3>
                <PriorityBadge priority={cluster.priority} />
                <IntentBadge intent={cluster.intent} />
              </div>
              <p className="text-xs text-muted-foreground">
                {cluster.page_type ? PAGE_TYPE[cluster.page_type] : "Page type not set"}
                {cluster.target_url ? ` · ${cluster.target_url}` : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <LinkButton href={`${base}/new?cluster=${cluster.id}`} variant="ghost" size="sm"><Plus />Keyword</LinkButton>
              <LinkButton href={`/clients/${clientId}/briefs/new?cluster=${cluster.id}`} variant="outline" size="sm">
                Create brief
              </LinkButton>
            </div>
          </header>
          <KeywordTable rows={byCluster.get(cluster.id) ?? []} base={base} />
        </section>
      ))}

      {unclustered.length > 0 ? (
        <section className="flex flex-col gap-2 rounded-lg border border-dashed p-4">
          <h3 className="font-medium text-muted-foreground">Not in a cluster</h3>
          <KeywordTable rows={unclustered} base={base} />
        </section>
      ) : null}
    </div>
  );
}
