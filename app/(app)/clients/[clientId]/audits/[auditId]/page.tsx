import { notFound } from "next/navigation";
import { FileDown } from "lucide-react";
import { AuditGroups, type GroupRow } from "@/components/audits/audit-groups";
import { IssueRuleForm } from "@/components/forms/issue-rule-form";
import { DeleteButton } from "@/components/shared/delete-button";
import { AuditTypeBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { convertFindingsAction, deleteAuditAction, saveIssueRuleAction } from "@/lib/actions/audits";
import { formatDate } from "@/lib/dates";
import { getAudit, getAuditGroups } from "@/lib/queries/audits";
import { getTeam } from "@/lib/queries/clients";
import { createClient } from "@/lib/supabase/server";

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-semibold text-muted-foreground uppercase">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </div>
  );
}

export default async function AuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string; auditId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { clientId, auditId } = await params;
  const { created } = await searchParams;
  const audit = await getAudit(auditId);
  if (!audit || audit.client_id !== clientId) notFound();

  const [{ groups }, team] = await Promise.all([getAuditGroups(auditId), getTeam()]);

  const supabase = await createClient();
  const files = await Promise.all(
    (audit.file_paths ?? []).map(async (path) => {
      const { data } = await supabase.storage.from("audit-files").createSignedUrl(path, 3600);
      return { name: path.split("/").pop() ?? path, url: data?.signedUrl ?? null };
    }),
  );

  const totals = groups.reduce(
    (acc, g) => ({
      findings: acc.findings + g.urls.length,
      new: acc.new + g.counts.new,
      persisting: acc.persisting + g.counts.persisting,
      fixed: acc.fixed + g.counts.fixed,
    }),
    { findings: 0, new: 0, persisting: 0, fixed: 0 },
  );

  const rows: GroupRow[] = groups.map((g) => ({
    issue_name: g.issue_name,
    key: g.key,
    hasRule: !!g.rule,
    severity: g.severity,
    category: g.category,
    counts: g.counts,
    urlCount: g.urls.length,
    taskIds: g.taskIds,
  }));
  const unclassified = groups.filter((g) => !g.rule && g.urls.length > 0);
  const here = `/clients/${clientId}/audits/${auditId}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Crawl of {formatDate(audit.crawl_date)}</h2>
            <AuditTypeBadge type={audit.type} />
          </div>
          <p className="text-sm text-muted-foreground">
            {audit.cycle ? `Cycle ${audit.cycle.number}` : "No cycle"} · {audit.total_urls ?? 0} URLs with issues
            {audit.summary ? ` · ${audit.summary}` : ""}
          </p>
        </div>
        <DeleteButton action={deleteAuditAction.bind(null, audit.id, clientId)} confirmText="Delete this crawl and its findings? Tasks already created are kept." />
      </div>

      {created ? (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          Created {created} task{created === "1" ? "" : "s"} in {audit.cycle ? `Cycle ${audit.cycle.number}` : "the backlog"}.
        </p>
      ) : null}

      <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-5">
        <Stat label="Issue types" value={groups.filter((g) => g.urls.length > 0).length} />
        <Stat label="Findings" value={totals.findings} />
        <Stat label="New" value={totals.new} />
        <Stat label="Persisting" value={totals.persisting} />
        <Stat label="Fixed since last crawl" value={totals.fixed} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Findings by issue</CardTitle>
          <CardDescription>
            Tick the issues that should become tasks, set a priority, and create them in one go. Fixed rows are what disappeared since the previous crawl.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditGroups
            // Remount when a rule is saved so newly classified issues get preselected.
            key={rows.filter((r) => r.hasRule).length}
            auditId={audit.id}
            clientId={clientId}
            groups={rows}
            team={team}
            action={convertFindingsAction.bind(null, audit.id)}
          />
        </CardContent>
      </Card>

      {unclassified.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Classify new issue types</CardTitle>
            <CardDescription>
              These Screaming Frog issues have no rule yet. Save one once and every future crawl applies it.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {unclassified.map((g) => (
              <div key={g.key} className="rounded-lg border p-4">
                <p className="mb-3 text-sm font-medium">
                  {g.issue_name} <span className="font-normal text-muted-foreground">· {g.urls.length} URLs</span>
                </p>
                <IssueRuleForm
                  action={saveIssueRuleAction}
                  initial={{
                    issue_name: g.issue_name,
                    category: g.category ?? "technical",
                    default_severity: g.severity,
                    task_title_template: null,
                    ignore_by_default: false,
                  }}
                  lockIssueName
                  returnTo={here}
                  compact
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {files.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Original files</CardTitle>
            <CardDescription>Stored as uploaded. Links are valid for one hour.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-1 text-sm">
              {files.map((f) => (
                <li key={f.name}>
                  {f.url ? (
                    <a href={f.url} className="inline-flex items-center gap-1 hover:underline">
                      <FileDown className="size-3.5" />
                      {f.name}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{f.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
