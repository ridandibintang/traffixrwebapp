import { notFound } from "next/navigation";
import { BacklinkForm } from "@/components/forms/backlink-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteBacklinkAction, updateBacklinkAction } from "@/lib/actions/backlinks";
import { monthKey, todayIso } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function EditBacklinkPage({
  params,
}: {
  params: Promise<{ clientId: string; backlinkId: string }>;
}) {
  const { clientId, backlinkId } = await params;
  const supabase = await createClient();
  const { data: backlink } = await supabase
    .from("backlinks")
    .select("*")
    .eq("id", backlinkId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!backlink) notFound();

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold">Edit backlink</h2>
        <DeleteButton action={deleteBacklinkAction.bind(null, backlink.id, clientId)} />
      </div>
      <BacklinkForm
        action={updateBacklinkAction.bind(null, backlink.id)}
        initial={backlink}
        defaultMonth={monthKey(todayIso())}
        cancelHref={`/clients/${clientId}/backlinks`}
      />
    </>
  );
}
