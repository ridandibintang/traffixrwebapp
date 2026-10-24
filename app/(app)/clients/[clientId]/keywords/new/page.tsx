import { KeywordForm } from "@/components/forms/keyword-form";
import { createKeywordAction } from "@/lib/actions/keywords";
import { getClientOr404 } from "@/lib/queries/clients";
import { getClientClusters } from "@/lib/queries/keywords";

export default async function NewKeywordPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ cluster?: string }>;
}) {
  const { clientId } = await params;
  const { cluster } = await searchParams;
  await getClientOr404(clientId);
  const clusters = await getClientClusters(clientId);

  return (
    <>
      <h2 className="text-lg font-semibold">Add keyword</h2>
      <KeywordForm
        action={createKeywordAction.bind(null, clientId)}
        defaultClusterId={cluster ?? null}
        clusters={clusters}
        cancelHref={`/clients/${clientId}/keywords`}
      />
    </>
  );
}
