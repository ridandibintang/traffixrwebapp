import { notFound } from "next/navigation";
import { KeywordForm } from "@/components/forms/keyword-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteKeywordAction, updateKeywordAction } from "@/lib/actions/keywords";
import { getClientClusters } from "@/lib/queries/keywords";
import { createClient } from "@/lib/supabase/server";

export default async function EditKeywordPage({
  params,
}: {
  params: Promise<{ clientId: string; keywordId: string }>;
}) {
  const { clientId, keywordId } = await params;
  const supabase = await createClient();
  const [{ data: keyword }, clusters] = await Promise.all([
    supabase.from("keywords").select("*").eq("id", keywordId).eq("client_id", clientId).maybeSingle(),
    getClientClusters(clientId),
  ]);
  if (!keyword) notFound();

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold">Edit keyword</h2>
        <DeleteButton
          action={deleteKeywordAction.bind(null, keyword.id, clientId)}
          confirmText="Delete this keyword? Briefs that reference it keep their own copy of the text."
        />
      </div>
      <KeywordForm
        action={updateKeywordAction.bind(null, keyword.id)}
        initial={keyword}
        clusters={clusters}
        cancelHref={`/clients/${clientId}/keywords`}
      />
    </>
  );
}
