import { notFound } from "next/navigation";
import { Download, FilePlus2, Pencil } from "lucide-react";
import { BriefView } from "@/components/briefs/brief-view";
import { DeleteButton } from "@/components/shared/delete-button";
import { DownloadButton } from "@/components/shared/download-button";
import { LinkButton } from "@/components/shared/link-button";
import { ArticleStatusBadge, BriefStatusBadge } from "@/components/shared/status-badge";
import { deleteBriefAction } from "@/lib/actions/briefs";
import { getBriefWithChildren } from "@/lib/queries/briefs";
import { createClient } from "@/lib/supabase/server";

export default async function BriefPage({
  params,
}: {
  params: Promise<{ clientId: string; briefId: string }>;
}) {
  const { clientId, briefId } = await params;
  const brief = await getBriefWithChildren(briefId);
  if (!brief || brief.client_id !== clientId) notFound();

  const supabase = await createClient();
  const { data: article } = await supabase
    .from("articles")
    .select("id, status, title")
    .eq("brief_id", briefId)
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const base = `/clients/${clientId}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{brief.target_keyword}</h2>
            <BriefStatusBadge status={brief.status} />
          </div>
          {article ? (
            <p className="text-sm text-muted-foreground">
              Article:{" "}
              <a href={`${base}/articles/${article.id}`} className="hover:underline">
                {article.title}
              </a>{" "}
              <ArticleStatusBadge status={article.status} />
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No article yet.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <DownloadButton href={`/api/briefs/${brief.id}/docx`} variant="outline" size="sm">
            <Download />
            Export .docx
          </DownloadButton>
          <LinkButton href={`${base}/briefs/${brief.id}/edit`} variant="outline" size="sm">
            <Pencil />
            Edit
          </LinkButton>
          {!article ? (
            <LinkButton href={`${base}/articles/new?brief=${brief.id}`} size="sm">
              <FilePlus2 />
              Create article
            </LinkButton>
          ) : null}
          <DeleteButton
            action={deleteBriefAction.bind(null, brief.id, clientId)}
            confirmText="Delete this brief? Its article (if any) keeps existing without a brief."
          />
        </div>
      </div>

      <BriefView brief={brief} />
    </div>
  );
}
