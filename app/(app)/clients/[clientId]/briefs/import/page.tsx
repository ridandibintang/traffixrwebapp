import { BriefImportForm } from "@/components/forms/brief-import-form";
import { importBriefAction } from "@/lib/actions/briefs";
import { getClientOr404 } from "@/lib/queries/clients";

export default async function ImportBriefPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClientOr404(clientId);

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">Import brief</h2>
        <p className="text-sm text-muted-foreground">
          Creates a brief for {client.name} from the JSON that the Golden Standard skill writes next to the .docx. The brief is marked Ready.
        </p>
      </div>
      <BriefImportForm
        action={importBriefAction.bind(null, clientId)}
        cancelHref={`/clients/${clientId}/briefs`}
      />
    </>
  );
}
