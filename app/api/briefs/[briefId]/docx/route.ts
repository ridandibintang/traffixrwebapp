import { NextResponse, type NextRequest } from "next/server";
import { briefFilename, renderBriefDocx } from "@/lib/briefs/docx";
import { getBriefWithChildren } from "@/lib/queries/briefs";
import { createClient } from "@/lib/supabase/server";

// Export a brief as the Golden Standard .docx. RLS decides who can read the
// brief: admins always, writers only for briefs of their assigned articles.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ briefId: string }> },
) {
  const { briefId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const brief = await getBriefWithChildren(briefId);
  if (!brief) return new NextResponse("Not found", { status: 404 });

  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", brief.client_id)
    .single();

  const clientName = client?.name ?? "Client";
  const buffer = await renderBriefDocx(brief, clientName);
  const filename = briefFilename(clientName, brief.target_keyword);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
