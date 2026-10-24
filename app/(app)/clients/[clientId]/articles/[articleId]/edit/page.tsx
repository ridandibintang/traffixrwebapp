import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/forms/article-form";
import { updateArticleAction } from "@/lib/actions/articles";
import { getTeam } from "@/lib/queries/clients";
import { getClientCycles } from "@/lib/queries/cycles";
import { createClient } from "@/lib/supabase/server";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ clientId: string; articleId: string }>;
}) {
  const { clientId, articleId } = await params;
  const supabase = await createClient();
  const [{ data: article }, { data: briefs }, team, cycles] = await Promise.all([
    supabase.from("articles").select("*").eq("id", articleId).eq("client_id", clientId).maybeSingle(),
    supabase.from("content_briefs").select("id, target_keyword").eq("client_id", clientId).order("created_at", { ascending: false }),
    getTeam(),
    getClientCycles(clientId),
  ]);
  if (!article) notFound();

  return (
    <>
      <h2 className="text-lg font-semibold">Edit article</h2>
      <ArticleForm
        action={updateArticleAction.bind(null, article.id)}
        initial={article}
        briefs={briefs ?? []}
        writers={team.filter((m) => m.role === "writer")}
        cycles={cycles}
        cancelHref={`/clients/${clientId}/articles/${article.id}`}
      />
    </>
  );
}
