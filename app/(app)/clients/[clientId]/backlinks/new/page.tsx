import { BacklinkForm } from "@/components/forms/backlink-form";
import { createBacklinkAction } from "@/lib/actions/backlinks";
import { monthKey, todayIso } from "@/lib/dates";
import { getClientOr404 } from "@/lib/queries/clients";

export default async function NewBacklinkPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await getClientOr404(clientId);

  return (
    <>
      <h2 className="text-lg font-semibold">Add backlink</h2>
      <BacklinkForm
        action={createBacklinkAction.bind(null, clientId)}
        defaultMonth={monthKey(todayIso())}
        cancelHref={`/clients/${clientId}/backlinks`}
      />
    </>
  );
}
