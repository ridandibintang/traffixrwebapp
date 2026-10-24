import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { ClientTabs } from "@/components/layout/client-tabs";
import { LinkButton } from "@/components/shared/link-button";
import { ClientStatusBadge } from "@/components/shared/status-badge";
import { requireAdmin } from "@/lib/auth";
import { getClientOr404 } from "@/lib/queries/clients";

export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}) {
  await requireAdmin();
  const { clientId } = await params;
  const client = await getClientOr404(clientId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link href="/clients" className="text-xs text-muted-foreground hover:underline">
          ← All clients
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{client.name}</h1>
              <ClientStatusBadge status={client.status} />
            </div>
            <a
              href={client.website_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"
            >
              {client.website_url}
              <ExternalLink className="size-3.5" />
            </a>
          </div>
          <LinkButton href={`/clients/${client.id}/edit`} variant="outline">
            <Pencil />
            Edit client
          </LinkButton>
        </div>
        <ClientTabs clientId={client.id} />
      </div>
      {children}
    </div>
  );
}
