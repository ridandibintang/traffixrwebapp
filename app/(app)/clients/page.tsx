import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { ClientStatusBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { formatRange } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function ClientsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const [{ data: clients }, { data: activeCycles }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase
      .from("cycles")
      .select("client_id, number, start_date, end_date")
      .eq("status", "active"),
  ]);

  const activeByClient = new Map((activeCycles ?? []).map((c) => [c.client_id, c]));

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Clients" description="Profiles, context, and two-week cycles." />
        <LinkButton href="/clients/new">
          <Plus />
          New client
        </LinkButton>
      </div>

      {(clients ?? []).length === 0 ? (
        <EmptyState
          title="No clients yet"
          description="Create the first client to start planning cycles."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>CMS</TableHead>
              <TableHead>Active cycle</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients!.map((client) => {
              const cycle = activeByClient.get(client.id);
              return (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">
                    <Link href={`/clients/${client.id}`} className="hover:underline">
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.website_url}</TableCell>
                  <TableCell>{client.cms ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {cycle ? `Cycle ${cycle.number} · ${formatRange(cycle.start_date, cycle.end_date)}` : "—"}
                  </TableCell>
                  <TableCell>
                    <ClientStatusBadge status={client.status} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
}
