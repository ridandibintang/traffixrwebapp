import { BriefForm } from "@/components/forms/brief-form";
import { createBriefAction } from "@/lib/actions/briefs";
import { getClientOr404 } from "@/lib/queries/clients";
import { createClient } from "@/lib/supabase/server";

export default async function NewBriefPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ cluster?: string; keyword?: string }>;
}) {
  const { clientId } = await params;
  const { cluster, keyword } = await searchParams;
  await getClientOr404(clientId);
  const supabase = await createClient();

  const { data: keywords } = await supabase
    .from("keywords")
    .select("id, keyword, cluster_id, search_volume")
    .eq("client_id", clientId)
    .order("search_volume", { ascending: false, nullsFirst: false });

  // Starting from a cluster: prefill with its highest-volume keyword.
  let defaultKeyword: { id: string | null; text: string } | undefined;
  if (keyword) {
    const k = keywords?.find((kw) => kw.id === keyword);
    if (k) defaultKeyword = { id: k.id, text: k.keyword };
  } else if (cluster) {
    const k = keywords?.find((kw) => kw.cluster_id === cluster);
    if (k) defaultKeyword = { id: k.id, text: k.keyword };
    else {
      const { data: c } = await supabase.from("keyword_clusters").select("name").eq("id", cluster).maybeSingle();
      if (c) defaultKeyword = { id: null, text: c.name.toLowerCase() };
    }
  }

  return (
    <>
      <h2 className="text-lg font-semibold">New content brief</h2>
      <BriefForm
        action={createBriefAction.bind(null, clientId)}
        defaultKeyword={defaultKeyword}
        keywords={(keywords ?? []).map((k) => ({ id: k.id, keyword: k.keyword }))}
        cancelHref={`/clients/${clientId}/briefs`}
      />
    </>
  );
}
