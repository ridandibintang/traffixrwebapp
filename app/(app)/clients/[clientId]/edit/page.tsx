import { ClientForm } from "@/components/forms/client-form";
import { updateClientAction } from "@/lib/actions/clients";
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
      <h2 className="text-lg font-semibold">Edit client</h2>
      <ClientForm action={action} initial={client} cancelHref={`/clients/${client.id}`} />
    </>
  );
}
