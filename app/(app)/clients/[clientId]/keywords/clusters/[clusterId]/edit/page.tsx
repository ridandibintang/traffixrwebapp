import { notFound } from "next/navigation";
import { ClusterForm } from "@/components/forms/cluster-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteClusterAction, updateClusterAction } from "@/lib/actions/keywords";
import { createClient } from "@/lib/supabase/server";

export default async function EditClusterPage({
  params,
}: {
  params: Promise<{ clientId: string; clusterId: string }>;
}) {
  const { clientId, clusterId } = await params;
  const supabase = await createClient();
  const { data: cluster } = await supabase
    .from("keyword_clusters")
    .select("*")
    .eq("id", clusterId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!cluster) notFound();

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold">Edit cluster</h2>
        <DeleteButton
          action={deleteClusterAction.bind(null, cluster.id, clientId)}
          confirmText="Delete this cluster? Its keywords are kept without a cluster."
        />
      </div>
      <ClusterForm
        action={updateClusterAction.bind(null, cluster.id)}
        initial={cluster}
        cancelHref={`/clients/${clientId}/keywords`}
      />
    </>
  );
}
