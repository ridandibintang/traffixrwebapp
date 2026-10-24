import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { LinkButton } from "@/components/shared/link-button";
import { CategoryBadge, SeverityBadge } from "@/components/shared/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { getIssueRules } from "@/lib/queries/audits";

export default async function IssueRulesPage() {
  await requireAdmin();
  const rules = await getIssueRules();

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Issue rules"
          description="How each Screaming Frog issue type becomes a task. Classified once, applied to every crawl."
        />
        <div className="flex gap-2">
          <LinkButton href="/audits" variant="outline">Back to audits</LinkButton>
          <LinkButton href="/audits/rules/new"><Plus />New rule</LinkButton>
        </div>
      </div>

      {rules.length === 0 ? (
        <EmptyState
          title="No rules yet"
          description="Rules are usually created from an audit page, where unclassified issues are listed with suggestions."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Task title template</TableHead>
              <TableHead>Default</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  <Link href={`/audits/rules/${r.id}/edit`} className="hover:underline">{r.issue_name}</Link>
                </TableCell>
                <TableCell><CategoryBadge category={r.category} /></TableCell>
                <TableCell><SeverityBadge severity={r.default_severity} /></TableCell>
                <TableCell className="text-muted-foreground">{r.task_title_template ?? "{issue} ({count} URLs)"}</TableCell>
                <TableCell className="text-muted-foreground">{r.ignore_by_default ? "Ignored" : "Suggested as task"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
