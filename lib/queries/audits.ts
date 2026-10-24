import { fetchAll } from "@/lib/supabase/fetch-all";
import { createClient } from "@/lib/supabase/server";
import { issueFamily, normaliseIssueName } from "@/lib/audits/parse";
import type { Audit, AuditFinding, FindingSeverity, IssueRule, TaskCategory } from "@/lib/types";

export type AuditWithRefs = Audit & {
  client: { name: string } | null;
  cycle: { number: number } | null;
};

const AUDIT_SELECT = "*, client:clients(name), cycle:cycles(number)";

export async function getAudit(auditId: string): Promise<AuditWithRefs | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("audits").select(AUDIT_SELECT).eq("id", auditId).maybeSingle();
  return (data as AuditWithRefs | null) ?? null;
}

export async function getClientAudits(clientId: string): Promise<AuditWithRefs[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audits")
    .select(AUDIT_SELECT)
    .eq("client_id", clientId)
    .order("crawl_date", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as AuditWithRefs[];
}

export async function getAllAudits(): Promise<AuditWithRefs[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audits")
    .select(AUDIT_SELECT)
    .order("crawl_date", { ascending: false })
    .order("created_at", { ascending: false });
  return (data ?? []) as AuditWithRefs[];
}

/** Counts of findings per state for a list of audits. */
export async function getAuditStateCounts(auditIds: string[]) {
  const counts = new Map<string, { total: number; new: number; persisting: number; fixed: number }>();
  if (auditIds.length === 0) return counts;
  const supabase = await createClient();
  const data = await fetchAll((from, to) =>
    supabase.from("audit_findings").select("audit_id, state").in("audit_id", auditIds).order("id").range(from, to),
  );
  for (const f of data) {
    const c = counts.get(f.audit_id) ?? { total: 0, new: 0, persisting: 0, fixed: 0 };
    c[f.state] += 1;
    if (f.state !== "fixed") c.total += 1;
    counts.set(f.audit_id, c);
  }
  return counts;
}

export type FindingGroup = {
  issue_name: string;
  key: string;
  rule: IssueRule | null;
  counts: { new: number; persisting: number; fixed: number; open: number; converted: number; ignored: number };
  /** Active (not fixed) URLs, for the task */
  urls: string[];
  taskIds: string[];
  sampleDetails: Record<string, string> | null;
  severity: FindingSeverity;
  category: TaskCategory | null;
};

/** Findings grouped by issue, joined with the matching rule. */
export async function getAuditGroups(auditId: string): Promise<{ groups: FindingGroup[]; findings: AuditFinding[] }> {
  const supabase = await createClient();
  const [findings, { data: rules }] = await Promise.all([
    fetchAll<AuditFinding>((from, to) =>
      supabase.from("audit_findings").select("*").eq("audit_id", auditId).order("issue_name").order("url").order("id").range(from, to),
    ),
    supabase.from("issue_rules").select("*"),
  ]);

  const ruleByKey = new Map((rules ?? []).map((r) => [normaliseIssueName(r.issue_name), r]));
  const groups = new Map<string, FindingGroup>();

  for (const f of findings) {
    const key = normaliseIssueName(f.issue_name);
    let g = groups.get(key);
    if (!g) {
      const rule = ruleByKey.get(key) ?? ruleByKey.get(normaliseIssueName(issueFamily(f.issue_name))) ?? null;
      g = {
        issue_name: f.issue_name,
        key,
        rule,
        counts: { new: 0, persisting: 0, fixed: 0, open: 0, converted: 0, ignored: 0 },
        urls: [],
        taskIds: [],
        sampleDetails: null,
        severity: rule?.default_severity ?? f.severity,
        category: rule?.category ?? f.category,
      };
      groups.set(key, g);
    }
    g.counts[f.state] += 1;
    if (f.state !== "fixed") {
      g.counts[f.status] += 1;
      g.urls.push(f.url);
      if (!g.sampleDetails && f.details && typeof f.details === "object" && !Array.isArray(f.details)) {
        g.sampleDetails = f.details as Record<string, string>;
      }
    }
    if (f.task_id && !g.taskIds.includes(f.task_id)) g.taskIds.push(f.task_id);
  }

  const order: Record<FindingSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...groups.values()].sort(
    (a, b) => order[a.severity] - order[b.severity] || b.urls.length - a.urls.length || a.issue_name.localeCompare(b.issue_name),
  );
  return { groups: sorted, findings };
}

export async function getIssueRules(): Promise<IssueRule[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("issue_rules").select("*").order("category").order("issue_name");
  return data ?? [];
}
