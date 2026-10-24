import { KeywordImportForm } from "@/components/forms/keyword-import-form";
import { importKeywordsAction } from "@/lib/actions/keywords";
import { getClientOr404 } from "@/lib/queries/clients";
import { getClientClusters } from "@/lib/queries/keywords";

export default async function ImportKeywordsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await getClientOr404(clientId);
  const clusters = await getClientClusters(clientId);

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold">Import keywords from CSV</h2>
        <p className="text-sm text-muted-foreground">
          Works with exports from Claude keyword research, SE Ranking, or any sheet with a keyword column.
        </p>
      </div>
      <KeywordImportForm
        action={importKeywordsAction.bind(null, clientId)}
        clusters={clusters}
        backHref={`/clients/${clientId}/keywords`}
      />
    </>
  );
}
