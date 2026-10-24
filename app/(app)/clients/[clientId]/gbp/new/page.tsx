import { GbpPostForm } from "@/components/forms/gbp-post-form";
import { createGbpPostAction } from "@/lib/actions/gbp";
import { todayIso } from "@/lib/dates";
import { getClientOr404 } from "@/lib/queries/clients";

export default async function NewGbpPostPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  await getClientOr404(clientId);

  return (
    <>
      <h2 className="text-lg font-semibold">Schedule GBP post</h2>
      <GbpPostForm
        action={createGbpPostAction.bind(null, clientId)}
        defaultDate={todayIso()}
        cancelHref={`/clients/${clientId}/gbp`}
      />
    </>
  );
}
