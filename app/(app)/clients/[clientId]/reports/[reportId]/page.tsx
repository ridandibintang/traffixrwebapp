import { notFound } from "next/navigation";
import { FileDown, RefreshCw } from "lucide-react";
import { ReportForm } from "@/components/forms/report-form";
import { ReportView } from "@/components/reports/report-view";
import { DeleteButton } from "@/components/shared/delete-button";
import { DownloadButton } from "@/components/shared/download-button";
import { ReportStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteReportAction, regenerateSummariesAction, updateReportAction } from "@/lib/actions/reports";
import { formatDate, formatRange } from "@/lib/dates";
import { assembleReport } from "@/lib/reports/assemble";
import { createClient } from "@/lib/supabase/server";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; reportId: string }>;
  searchParams: Promise<{ saved?: string; regenerated?: string }>;
}) {
  const { clientId, reportId } = await params;
  const notice = await searchParams;
  const supabase = await createClient();
  const { data: report } = await supabase.from("reports").select("*").eq("id", reportId).eq("client_id", clientId).maybeSingle();
  if (!report) notFound();
  const data = await assembleReport(supabase, report);
  if (!data) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">
              Cycle {data.cycle?.number ?? "?"} report · {formatRange(report.period_start, report.period_end)}
            </h2>
            <ReportStatusBadge status={report.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {data.cycle?.meeting_date ? `Meeting ${formatDate(data.cycle.meeting_date)} · ` : ""}
            Sections are assembled live from tasks, articles, crawls, backlinks, GBP posts and metrics. The text under each heading is yours to edit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={regenerateSummariesAction.bind(null, report.id)}>
            <Button type="submit" variant="outline" size="sm">
              <RefreshCw />
              Regenerate summaries
            </Button>
          </form>
          <DownloadButton href={`/api/reports/${report.id}/pdf`} size="sm">
            <FileDown />
            Export PDF
          </DownloadButton>
          <DeleteButton action={deleteReportAction.bind(null, report.id, clientId)} confirmText="Delete this report? The underlying tasks, articles and metrics are kept." />
        </div>
      </div>

      {notice.saved ? <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">Report saved.</p> : null}
      {notice.regenerated ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">Summaries regenerated from the current data. Edit them below if needed.</p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Report preview</CardTitle>
            <CardDescription>What the PDF will contain.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportView data={data} />
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-6 xl:self-start">
          <CardHeader>
            <CardTitle>Narrative</CardTitle>
            <CardDescription>Auto-filled from the numbers; adjust the wording before the meeting.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReportForm action={updateReportAction.bind(null, report.id)} report={report} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
