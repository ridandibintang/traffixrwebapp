import { NextResponse, type NextRequest } from "next/server";
import { assembleReport } from "@/lib/reports/assemble";
import { renderReportPdf, reportFilename } from "@/lib/reports/pdf";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Export a cycle report as PDF. RLS: only admins can read reports.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> },
) {
  const { reportId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims?.sub) return new NextResponse("Unauthorized", { status: 401 });

  const { data: report } = await supabase.from("reports").select("*").eq("id", reportId).maybeSingle();
  if (!report) return new NextResponse("Not found", { status: 404 });

  const data = await assembleReport(supabase, report);
  if (!data) return new NextResponse("Not found", { status: 404 });

  const pdf = await renderReportPdf(data);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${reportFilename(data)}"`,
      "Cache-Control": "no-store",
    },
  });
}
