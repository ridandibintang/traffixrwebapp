import { ArticleForm } from "@/components/forms/article-form";
import { createArticleAction } from "@/lib/actions/articles";
import { getClientOr404, getTeam } from "@/lib/queries/clients";
import { getClientCycles } from "@/lib/queries/cycles";
import { createClient } from "@/lib/supabase/server";

export default async function NewArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ brief?: string }>;
}) {
  const { clientId } = await params;
  const { brief } = await searchParams;
  await getClientOr404(clientId);
  const supabase = await createClient();

  const [{ data: briefs }, team, cycles] = await Promise.all([
    supabase
      .from("content_briefs")
      .select("id, target_keyword, meta_title")
      .eq("client_id", clientId)
      .neq("status", "archived")
      .order("created_at", { ascending: false }),
    getTeam(),
    getClientCycles(clientId),
  ]);

  const selected = briefs?.find((b) => b.id === brief);

  return (
    <>
      <h2 className="text-lg font-semibold">New article</h2>
      <ArticleForm
        action={createArticleAction.bind(null, clientId)}
        defaults={{
          brief_id: selected?.id ?? null,
          title: selected?.meta_title ?? selected?.target_keyword ?? "",
        }}
        briefs={briefs ?? []}
        writers={team.filter((m) => m.role === "writer")}
        cycles={cycles.filter((c) => c.status !== "closed")}
        cancelHref={`/clients/${clientId}/articles`}
      />
    </>
  );
}
