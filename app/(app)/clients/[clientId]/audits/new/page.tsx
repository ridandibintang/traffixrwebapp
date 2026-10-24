import { AuditUploadForm } from "@/components/forms/audit-upload-form";
import { createAuditAction } from "@/lib/actions/audits";
import { todayIso } from "@/lib/dates";
import { getClientOr404 } from "@/lib/queries/clients";
import { getClientCycles } from "@/lib/queries/cycles";

export default async function NewAuditPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await getClientOr404(clientId);
  const cycles = await getClientCycles(clientId);
  const open = cycles.filter((c) => c.status !== "closed");
  const active = open.find((c) => c.status === "active") ?? open[0];

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">Import Screaming Frog crawl</h2>
        <p className="text-sm text-muted-foreground">
          Findings are grouped per issue, matched against your issue rules, and compared with the previous crawl.
        </p>
      </div>
      <AuditUploadForm
        action={createAuditAction.bind(null, clientId)}
        cycles={open}
        defaultCycleId={active?.id ?? null}
        defaultDate={todayIso()}
        cancelHref={`/clients/${clientId}/audits`}
      />
    </>
  );
}
