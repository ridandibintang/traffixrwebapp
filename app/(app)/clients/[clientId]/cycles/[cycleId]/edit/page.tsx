import { notFound } from "next/navigation";
import { CycleForm } from "@/components/forms/cycle-form";
import { updateCycleAction } from "@/lib/actions/cycles";
import { createClient } from "@/lib/supabase/server";

export default async function EditCyclePage({
  params,
}: {
  params: Promise<{ clientId: string; cycleId: string }>;
}) {
  const { clientId, cycleId } = await params;
  const supabase = await createClient();
  const { data: cycle } = await supabase
    .from("cycles")
    .select("*")
    .eq("id", cycleId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!cycle) notFound();

  return (
    <>
      <h2 className="text-lg font-semibold">Edit cycle {cycle.number}</h2>
      <CycleForm
        action={updateCycleAction.bind(null, cycle.id)}
        initial={cycle}
        isEdit
        cancelHref={`/clients/${clientId}/cycles/${cycle.id}`}
      />
    </>
  );
}
