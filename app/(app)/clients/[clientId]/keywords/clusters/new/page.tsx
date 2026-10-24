import { ClusterForm } from "@/components/forms/cluster-form";
import { createClusterAction } from "@/lib/actions/keywords";
import { getClientOr404 } from "@/lib/queries/clients";

export default async function NewClusterPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await getClientOr404(clientId);
  return (
    <>
      <h2 className="text-lg font-semibold">New keyword cluster</h2>
      <ClusterForm
        action={createClusterAction.bind(null, clientId)}
        cancelHref={`/clients/${clientId}/keywords`}
      />
    </>
  );
}
