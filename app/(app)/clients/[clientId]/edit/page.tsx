import { ClientForm } from "@/components/forms/client-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteClientAction, updateClientAction } from "@/lib/actions/clients";
import { getClientOr404 } from "@/lib/queries/clients";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClientOr404(clientId);
  const action = updateClientAction.bind(null, client.id);

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold">Edit client</h2>
        <DeleteButton
          action={deleteClientAction.bind(null, client.id)}
          label="Delete client"
          confirmText={`Delete ${client.name}? This removes all of its cycles, tasks, keywords, briefs, articles, audits, backlinks and GBP posts. This cannot be undone.`}
        />
      </div>
      <ClientForm action={action} initial={client} cancelHref={`/clients/${client.id}`} />
    </>
  );
}
