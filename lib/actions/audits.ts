"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  issueFamily,
  normaliseIssueName,
  parseExportFile,
  severityFromPriority,
  suggestCategory,
  type OverviewRow,
} from "@/lib/audits/parse";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/dates";
import { bool, firstIssue, optStr, str, type FormState } from "@/lib/form";
import { SEVERITY_TO_PRIORITY } from "@/lib/labels";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { createClient } from "@/lib/supabase/server";
import type { FindingSeverity, FindingStatus, PriorityLevel, TablesInsert, TaskCategory } from "@/lib/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const BUCKET = "audit-files";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const CATEGORIES = [
  "on_page", "technical", "content", "keyword_research", "off_page", "gbp", "reporting", "other",
] as const;
const SEVERITIES = ["low", "medium", "high", "critical"] as const;

// "use server" files may only export async functions, so this stays local.
const DEFAULT_TITLE_TEMPLATE = "{issue} ({count} URLs)";

function safeFilename(name: string) {
  return name.replace(/[^\w.()\-]+/g, "_").slice(0, 120) || "file.csv";
}

function renderTitle(template: string | null, vars: { issue: string; count: number; client: string }) {
  return (template || DEFAULT_TITLE_TEMPLATE)
    .replace(/\{issue\}/g, vars.issue)
    .replace(/\{count\}/g, String(vars.count))
    .replace(/\{client\}/g, vars.client)
    .trim();
}

// ---------------------------------------------------------------------------
// Upload a crawl: store files, parse findings, compare with the previous audit
// ---------------------------------------------------------------------------
const auditSchema = z.object({
  type: z.enum(["on_page", "technical"]),
  cycle_id: z.uuid().nullable(),
  crawl_date: z.string().regex(ISO_DATE, "Crawl date is required"),
});

export async function createAuditAction(
  clientId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = auditSchema.safeParse({
    type: str(fd, "type"),
    cycle_id: optStr(fd, "cycle_id"),
    crawl_date: str(fd, "crawl_date"),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Choose at least one CSV export." };
  const tooBig = files.find((f) => f.size > MAX_FILE_BYTES);
  if (tooBig) return { error: `${tooBig.name} is larger than 20 MB.` };

  const supabase = await createClient();
  const [{ data: client }, { data: rules }] = await Promise.all([
    supabase.from("clients").select("name, website_url").eq("id", clientId).single(),
    supabase.from("issue_rules").select("*"),
  ]);
  if (!client) return { error: "Client not found." };
  const ruleByKey = new Map((rules ?? []).map((r) => [normaliseIssueName(r.issue_name), r]));

  // Parse everything first so a bad file fails before anything is written.
  const overviewByKey = new Map<string, OverviewRow>();
  const skipped: string[] = [];
  type Row = { issue_name: string; key: string; url: string; details: Record<string, string> };
  const rows = new Map<string, Row>(); // dedupe by issue + url
  for (const f of files) {
    const parsed = await parseExportFile(f, client.website_url);
    skipped.push(...parsed.skipped);
    for (const p of parsed.files) {
      if (p.kind === "overview") {
        for (const r of p.rows) overviewByKey.set(normaliseIssueName(r.issue_name), r);
      } else if (p.kind === "issues") {
        const key = normaliseIssueName(p.issue_name);
        for (const r of p.rows) rows.set(`${key}\u0000${r.url}`, { issue_name: p.issue_name, key, url: r.url, details: r.details });
      }
    }
  }
  // A rule or overview row for the whole family ("Page Titles") also covers
  // its sub-issues ("Page Titles: Over 561px").
  const lookup = <T,>(map: Map<string, T>, issueName: string) =>
    map.get(normaliseIssueName(issueName)) ?? map.get(normaliseIssueName(issueFamily(issueName)));
  if (rows.size === 0) {
    return {
      error:
        "No URL-level findings in these files. Upload the per-issue CSVs from Bulk Export > Issues > All, or an audit workbook (.xlsx) with URL columns." +
        (skipped.length ? ` Skipped: ${skipped.join("; ")}` : ""),
    };
  }

  // Previous audit of the same type for this client, for the comparison.
  const { data: previous } = await supabase
    .from("audits")
    .select("id, crawl_date")
    .eq("client_id", clientId)
    .eq("type", parsed.data.type)
    .order("crawl_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .insert({
      client_id: clientId,
      cycle_id: parsed.data.cycle_id,
      type: parsed.data.type,
      crawl_date: parsed.data.crawl_date,
      summary: skipped.length ? `Skipped: ${skipped.join("; ")}` : null,
    })
    .select("id")
    .single();
  if (auditError) return { error: auditError.message };

  // Store the original files.
  const filePaths: string[] = [];
  for (const f of files) {
    const path = `${clientId}/${audit.id}/${safeFilename(f.name)}`;
    const contentType = /.xlsx?$|.xlsm$/i.test(f.name)
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv";
    const { error } = await supabase.storage.from(BUCKET).upload(path, f, { contentType, upsert: true });
    if (error) {
      await supabase.from("audits").delete().eq("id", audit.id);
      return { error: `Could not store ${f.name}: ${error.message}` };
    }
    filePaths.push(path);
  }

  // Compare with the previous crawl.
  type Prev = { key: string; url: string; status: FindingStatus; task_id: string | null; details: unknown; severity: FindingSeverity; category: TaskCategory | null; issue_name: string };
  const prevByKey = new Map<string, Prev>();
  if (previous) {
    const prevFindings = await fetchAll((from, to) =>
      supabase
        .from("audit_findings")
        .select("issue_name, url, status, task_id, details, severity, category")
        .eq("audit_id", previous.id)
        .neq("state", "fixed")
        .order("id")
        .range(from, to),
    );
    for (const f of prevFindings) {
      const key = normaliseIssueName(f.issue_name);
      prevByKey.set(`${key}\u0000${f.url}`, { ...f, key });
    }
  }

  const inserts: TablesInsert<"audit_findings">[] = [];
  const activeUrls = new Set<string>();
  for (const [compound, r] of rows) {
    const rule = lookup(ruleByKey, r.issue_name);
    const overview = lookup(overviewByKey, r.issue_name);
    const prev = prevByKey.get(compound);
    let status: FindingStatus = "open";
    let taskId: string | null = null;
    if (prev?.status === "converted" && prev.task_id) {
      status = "converted";
      taskId = prev.task_id;
    } else if (prev?.status === "ignored" || rule?.ignore_by_default) {
      status = "ignored";
    }
    activeUrls.add(r.url);
    inserts.push({
      audit_id: audit.id,
      issue_name: r.issue_name,
      category: rule?.category ?? suggestCategory(r.issue_name, overview?.category_hint),
      severity: rule?.default_severity ?? severityFromPriority(overview?.issue_priority),
      url: r.url,
      details: r.details,
      state: prev ? "persisting" : "new",
      status,
      task_id: taskId,
    });
  }
  // Findings from the previous crawl that are gone now count as fixed here.
  for (const [compound, p] of prevByKey) {
    if (rows.has(compound)) continue;
    inserts.push({
      audit_id: audit.id,
      issue_name: p.issue_name,
      category: p.category,
      severity: p.severity,
      url: p.url,
      details: (p.details ?? {}) as Record<string, string>,
      state: "fixed",
      status: p.status,
      task_id: p.task_id,
    });
  }

  for (let i = 0; i < inserts.length; i += 500) {
    const { error } = await supabase.from("audit_findings").insert(inserts.slice(i, i + 500));
    if (error) return { error: `Findings could not be saved: ${error.message}` };
  }

  await supabase
    .from("audits")
    .update({ file_paths: filePaths, total_urls: activeUrls.size })
    .eq("id", audit.id);

  revalidatePath(`/clients/${clientId}`, "layout");
  revalidatePath("/audits");
  redirect(`/clients/${clientId}/audits/${audit.id}`);
}

export async function deleteAuditAction(auditId: string, clientId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: audit } = await supabase.from("audits").select("file_paths").eq("id", auditId).maybeSingle();
  if (audit?.file_paths?.length) await supabase.storage.from(BUCKET).remove(audit.file_paths);
  const { error } = await supabase.from("audits").delete().eq("id", auditId);
  if (error) throw new Error(error.message);
  revalidatePath(`/clients/${clientId}`, "layout");
  revalidatePath("/audits");
  redirect(`/clients/${clientId}/audits`);
}

// ---------------------------------------------------------------------------
// Convert selected issue groups into tasks
// ---------------------------------------------------------------------------
export async function convertFindingsAction(
  auditId: string,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();
  const selected = fd.getAll("issue").map(String).filter(Boolean);
  if (selected.length === 0) return { error: "Tick at least one issue to convert." };
  const assigneeId = optStr(fd, "assignee_id");

  const supabase = await createClient();
  const { data: audit } = await supabase
    .from("audits")
    .select("id, client_id, cycle_id, crawl_date, client:clients(name)")
    .eq("id", auditId)
    .maybeSingle();
  if (!audit) return { error: "Audit not found." };

  const [findings, { data: rules }] = await Promise.all([
    fetchAll((from, to) =>
      supabase.from("audit_findings").select("*").eq("audit_id", auditId).neq("state", "fixed").eq("status", "open").order("id").range(from, to),
    ),
    supabase.from("issue_rules").select("*"),
  ]);
  const ruleByKey = new Map((rules ?? []).map((r) => [normaliseIssueName(r.issue_name), r]));

  let created = 0;
  for (const key of selected) {
    const group = findings.filter((f) => normaliseIssueName(f.issue_name) === key);
    if (group.length === 0) continue;
    const issueName = group[0].issue_name;
    const rule = ruleByKey.get(key) ?? ruleByKey.get(normaliseIssueName(issueFamily(issueName)));
    const urls = [...new Set(group.map((f) => f.url))];
    const priority = (optStr(fd, `priority_${key}`) ?? SEVERITY_TO_PRIORITY[rule?.default_severity ?? group[0].severity]) as PriorityLevel;
    const sample = group[0].details && typeof group[0].details === "object" ? (group[0].details as Record<string, string>) : {};
    const sampleText = Object.entries(sample).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(" · ");

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        client_id: audit.client_id,
        cycle_id: audit.cycle_id,
        title: renderTitle(rule?.task_title_template ?? null, { issue: issueName, count: urls.length, client: audit.client?.name ?? "" }),
        description: `From the Screaming Frog crawl on ${formatDate(audit.crawl_date)}. Issue: ${issueName}.${sampleText ? ` Example: ${sampleText}.` : ""}`,
        category: rule?.category ?? group[0].category ?? "technical",
        priority,
        status: "todo",
        assignee_id: assigneeId,
        source: "audit",
        audit_id: audit.id,
        affected_urls: urls,
      })
      .select("id")
      .single();
    if (error) return { error: `Task for "${issueName}" failed: ${error.message}` };

    const groupIds = group.map((f) => f.id);
    for (let i = 0; i < groupIds.length; i += 500) {
      const { error: updateError } = await supabase
        .from("audit_findings")
        .update({ status: "converted", task_id: task.id })
        .in("id", groupIds.slice(i, i + 500));
      if (updateError) return { error: updateError.message };
    }
    created += 1;
  }

  revalidatePath(`/clients/${audit.client_id}`, "layout");
  revalidatePath("/dashboard");
  redirect(`/clients/${audit.client_id}/audits/${auditId}?created=${created}`);
}

/** Ignore or reopen every open finding of one issue in this audit. */
export async function setGroupStatusAction(auditId: string, issueKey: string, status: "ignored" | "open") {
  await requireAdmin();
  const supabase = await createClient();
  const { data: audit } = await supabase.from("audits").select("client_id").eq("id", auditId).maybeSingle();
  if (!audit) return;
  const findings = await fetchAll((from, to) =>
    supabase
      .from("audit_findings")
      .select("id, issue_name, status")
      .eq("audit_id", auditId)
      .neq("state", "fixed")
      .neq("status", "converted")
      .order("id")
      .range(from, to),
  );
  const ids = findings.filter((f) => normaliseIssueName(f.issue_name) === issueKey).map((f) => f.id);
  if (ids.length === 0) return;
  for (let i = 0; i < ids.length; i += 500) {
    const { error } = await supabase.from("audit_findings").update({ status }).in("id", ids.slice(i, i + 500));
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/clients/${audit.client_id}/audits/${auditId}`);
}

// ---------------------------------------------------------------------------
// Issue rules: classify a Screaming Frog issue once, reuse forever
// ---------------------------------------------------------------------------
const ruleSchema = z.object({
  issue_name: z.string().trim().min(1, "Issue name is required"),
  category: z.enum(CATEGORIES),
  default_severity: z.enum(SEVERITIES),
  task_title_template: z.string().trim().nullable(),
  ignore_by_default: z.boolean(),
});

function parseRule(fd: FormData) {
  return ruleSchema.safeParse({
    issue_name: str(fd, "issue_name"),
    category: str(fd, "category"),
    default_severity: str(fd, "default_severity") || "medium",
    task_title_template: optStr(fd, "task_title_template"),
    ignore_by_default: bool(fd, "ignore_by_default"),
  });
}

/** Create or replace the rule for an issue, then apply its severity/category to open findings. */
export async function saveIssueRuleAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseRule(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const returnTo = optStr(fd, "return_to");

  const supabase = await createClient();
  const { data: existing } = await supabase.from("issue_rules").select("id, issue_name");
  const match = (existing ?? []).find((r) => normaliseIssueName(r.issue_name) === normaliseIssueName(parsed.data.issue_name));

  const { error } = match
    ? await supabase.from("issue_rules").update(parsed.data).eq("id", match.id)
    : await supabase.from("issue_rules").insert(parsed.data);
  if (error) return { error: error.message };

  // Keep open findings of this issue in step with the rule.
  const findings = await fetchAll((from, to) =>
    supabase.from("audit_findings").select("id, issue_name").eq("status", "open").order("id").range(from, to),
  );
  const ids = findings
    .filter((f) => normaliseIssueName(f.issue_name) === normaliseIssueName(parsed.data.issue_name))
    .map((f) => f.id);
  for (let i = 0; i < ids.length; i += 500) {
    await supabase
      .from("audit_findings")
      .update({
        category: parsed.data.category,
        severity: parsed.data.default_severity,
        ...(parsed.data.ignore_by_default ? { status: "ignored" as const } : {}),
      })
      .in("id", ids.slice(i, i + 500));
  }

  revalidatePath("/audits", "layout");
  revalidatePath("/clients", "layout");
  redirect(returnTo && returnTo.startsWith("/") ? returnTo : "/audits/rules");
}

export async function updateIssueRuleAction(ruleId: string, _prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = parseRule(fd);
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("issue_rules").update(parsed.data).eq("id", ruleId);
  if (error) return { error: error.code === "23505" ? "A rule with that issue name already exists." : error.message };
  revalidatePath("/audits", "layout");
  redirect("/audits/rules");
}

export async function deleteIssueRuleAction(ruleId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("issue_rules").delete().eq("id", ruleId);
  if (error) throw new Error(error.message);
  revalidatePath("/audits", "layout");
  redirect("/audits/rules");
}
