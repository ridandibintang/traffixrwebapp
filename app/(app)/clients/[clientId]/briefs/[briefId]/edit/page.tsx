import { notFound } from "next/navigation";
import { BriefForm } from "@/components/forms/brief-form";
import { updateBriefAction } from "@/lib/actions/briefs";
import { getBriefWithChildren } from "@/lib/queries/briefs";
import { createClient } from "@/lib/supabase/server";

export default async function EditBriefPage({
  params,
}: {
  params: Promise<{ clientId: string; briefId: string }>;
}) {
  const { clientId, briefId } = await params;
  const brief = await getBriefWithChildren(briefId);
  if (!brief || brief.client_id !== clientId) notFound();

  const supabase = await createClient();
  const { data: keywords } = await supabase
    .from("keywords")
    .select("id, keyword")
    .eq("client_id", clientId)
    .order("keyword");

  return (
    <>
      <h2 className="text-lg font-semibold">Edit brief</h2>
      <BriefForm
        action={updateBriefAction.bind(null, brief.id)}
        initial={brief}
        keywords={keywords ?? []}
        cancelHref={`/clients/${clientId}/briefs/${brief.id}`}
      />
    </>
  );
}
