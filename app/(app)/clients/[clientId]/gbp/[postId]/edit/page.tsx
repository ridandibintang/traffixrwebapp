import { notFound } from "next/navigation";
import { GbpPostForm } from "@/components/forms/gbp-post-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { deleteGbpPostAction, updateGbpPostAction } from "@/lib/actions/gbp";
import { todayIso } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export default async function EditGbpPostPage({
  params,
}: {
  params: Promise<{ clientId: string; postId: string }>;
}) {
  const { clientId, postId } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("gbp_posts")
    .select("*")
    .eq("id", postId)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!post) notFound();

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold">Edit GBP post</h2>
        <DeleteButton action={deleteGbpPostAction.bind(null, post.id, clientId)} />
      </div>
      <GbpPostForm
        action={updateGbpPostAction.bind(null, post.id)}
        initial={post}
        defaultDate={todayIso()}
        cancelHref={`/clients/${clientId}/gbp`}
      />
    </>
  );
}
