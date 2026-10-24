import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { GbpStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { endOfWeek, formatRange, formatShortDate, startOfWeek, todayIso } from "@/lib/dates";
import { GBP_POST_TYPE } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import type { GbpPost } from "@/lib/types";

export default async function GbpPostsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const supabase = await createClient();
  const { data: posts } = await supabase
    .from("gbp_posts")
    .select("*")
    .eq("client_id", clientId)
    .order("scheduled_date", { ascending: false });

  const thisWeek = startOfWeek(todayIso());
  const byWeek = new Map<string, GbpPost[]>();
  for (const p of posts ?? []) {
    const key = startOfWeek(p.scheduled_date);
    byWeek.set(key, [...(byWeek.get(key) ?? []), p]);
  }
  const base = `/clients/${clientId}/gbp`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Google Business Profile posts</h2>
          <p className="text-sm text-muted-foreground">Weekly schedule. Posting itself happens in the Google dashboard.</p>
        </div>
        <LinkButton href={`${base}/new`} size="sm">
          <Plus />
          Schedule post
        </LinkButton>
      </div>

      {byWeek.size === 0 ? (
        <EmptyState title="No posts scheduled" description="Plan this week's post to keep the profile active." />
      ) : (
        [...byWeek.entries()].map(([weekStart, rows]) => (
          <section key={weekStart} className="flex flex-col gap-2">
            <header className="flex items-center gap-2">
              <h3 className="font-medium">Week of {formatRange(weekStart, endOfWeek(weekStart))}</h3>
              {weekStart === thisWeek ? <Badge variant="outline">This week</Badge> : null}
            </header>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>CTA</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">{formatShortDate(p.scheduled_date)}</TableCell>
                    <TableCell className="font-medium">
                      <Link href={`${base}/${p.id}/edit`} className="hover:underline">
                        {p.title || <span className="text-muted-foreground">(untitled)</span>}
                      </Link>
                    </TableCell>
                    <TableCell>{GBP_POST_TYPE[p.post_type]}</TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground" title={p.cta_url ?? ""}>
                      {p.cta_url ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.requested_by_client ? "Client" : "—"}</TableCell>
                    <TableCell><GbpStatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        ))
      )}
    </div>
  );
}
