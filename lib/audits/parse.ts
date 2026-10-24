// Parses crawl exports into issue groups. Three shapes are recognised:
//
// 1. Screaming Frog per-issue CSVs from Bulk Export > Issues > All, e.g.
//    page_titles_duplicate.csv. One row per URL; the issue name comes from
//    the file name ("Page Titles: Duplicate").
// 2. Screaming Frog Reports > Issues Overview (counts and priorities, no URLs).
// 3. Audit workbooks (.xlsx) built from a crawl: one sheet per topic with a
//    title row, a note row, then a header row. An "Issue" or "Problem"
//    column splits the sheet into finer groups ("Page Titles: Over 561px").
//    An "Issue Tracker" sheet (Issue, Priority, Detail Tab, ...) works like
//    the Issues Overview, and its rows without a detail tab become
//    site-level findings on the home page.
//
// Columns are matched by header name, never by position.
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { FindingSeverity, TaskCategory } from "@/lib/types";

export type IssueRow = { url: string; details: Record<string, string> };

export type OverviewRow = {
  issue_name: string;
  issue_type: string | null;
  issue_priority: string | null; // High | Medium | Low
  urls: number | null;
  description: string | null;
  how_to_fix: string | null;
  category_hint: string | null;
};

export type ParsedFile =
  | { kind: "issues"; source: string; issue_name: string; rows: IssueRow[]; headers: string[] }
  | { kind: "overview"; source: string; rows: OverviewRow[]; headers: string[] }
  | { kind: "unknown"; source: string; headers: string[]; error: string };

// Screaming Frog tab names, longest first so "page titles" wins over "page".
const TABS = [
  "response codes", "page titles", "meta description", "meta keywords", "structured data",
  "custom search", "custom extraction", "search console", "change detection", "link metrics",
  "internal", "external", "security", "url", "h1", "h2", "content", "images", "canonicals",
  "pagination", "directives", "hreflang", "javascript", "links", "amp", "sitemaps", "pagespeed",
  "mobile", "analytics", "validation", "accessibility",
];

// Header names that hold the affected URL, in order of preference.
const URL_HEADERS = [
  "address", "url", "page url", "redirecting url", "page with the link", "image url",
  "source", "page", "landing page", "external url", "destination", "from",
];
const ISSUE_COLUMN_HEADERS = ["issue", "problem", "issue type", "filter"];
const DROP_DETAIL_HEADERS = ["done?", "done", "owner", "notes", "new title", "new meta description", "change link to"];
const SKIP_SHEET = /inventory|summary|coverage|notes|overview|all urls|readme|legend/i;
const MAX_DETAIL_COLUMNS = 24;
const MAX_DETAIL_LENGTH = 300;
const HEADER_SCAN_ROWS = 15;

function titleCase(s: string) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => {
      if (/^h[1-6]$/.test(w)) return w.toUpperCase();
      if (/^\(?\d+[a-z]*\)?$/.test(w)) return w;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

/** page_titles_over_60_characters.csv -> "Page Titles: Over 60 Characters" */
export function issueNameFromFilename(filename: string): string {
  let base = filename.replace(/\.[^.]+$/, "").toLowerCase();
  base = base.replace(/^issues?[_-]/, "").replace(/[_-]+/g, " ").trim();
  for (const tab of TABS) {
    if (base === tab) return titleCase(tab);
    if (base.startsWith(`${tab} `)) return `${titleCase(tab)}: ${titleCase(base.slice(tab.length + 1).trim())}`;
  }
  return titleCase(base);
}

/** Key for matching findings across audits and rules: case/space-insensitive. */
export function normaliseIssueName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9()%]+/g, " ").trim();
}

/** The part before ":" (the Screaming Frog tab or workbook sheet). */
export function issueFamily(name: string) {
  return name.split(":")[0].trim();
}

const ON_PAGE_FAMILIES = [
  "page title", "meta description", "meta keywords", "heading", "h1", "h2", "content", "image", "url", "canonical", "on-page", "on page",
];

/** Suggested task category for an issue, from its family or a category hint. */
export function suggestCategory(issueName: string, hint?: string | null): TaskCategory {
  const family = issueFamily(issueName).toLowerCase();
  const h = (hint ?? "").toLowerCase();
  if (ON_PAGE_FAMILIES.some((f) => family.startsWith(f) || h.startsWith(f))) return "on_page";
  if (h.includes("content")) return "content";
  if (h.includes("backlink") || h.includes("off-page")) return "off_page";
  return "technical";
}

export function severityFromPriority(priority: string | null | undefined): FindingSeverity {
  const p = (priority ?? "").trim().toLowerCase();
  if (p === "high" || p === "critical") return p === "critical" ? "critical" : "high";
  if (p === "low") return "low";
  return "medium";
}

function norm(h: unknown) {
  return String(h ?? "").replace(/^﻿/, "").trim().toLowerCase();
}

function findColumn(headers: string[], candidates: string[]) {
  const lower = headers.map(norm);
  for (const c of candidates) {
    const i = lower.indexOf(c);
    if (i !== -1) return i;
  }
  return -1;
}

function toInt(value: unknown): number | null {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const n = Number(s.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Locate the header row: the first row (within the first rows) that names a URL column. */
function findHeaderRow(matrix: string[][]): number {
  for (let i = 0; i < Math.min(matrix.length, HEADER_SCAN_ROWS); i++) {
    const row = matrix[i] ?? [];
    const filled = row.filter((c) => String(c ?? "").trim() !== "").length;
    if (filled < 2) continue;
    if (findColumn(row.map(String), URL_HEADERS) !== -1) return i;
    if (findColumn(row.map(String), ["issue name"]) !== -1) return i;
    if (findColumn(row.map(String), ["issue"]) !== -1 && findColumn(row.map(String), ["priority"]) !== -1) return i;
  }
  return -1;
}

type TableOpts = { baseIssueName: string; siteUrl?: string | null };

/** Core: a matrix of cells (header row somewhere near the top) -> parsed files. */
export function parseTable(source: string, matrix: string[][], opts: TableOpts): ParsedFile[] {
  const headerIndex = findHeaderRow(matrix);
  if (headerIndex === -1) {
    return [{
      kind: "unknown",
      source,
      headers: (matrix[0] ?? []).map(String),
      error: `No URL column found (looked for ${URL_HEADERS.slice(0, 6).join(", ")}, ...).`,
    }];
  }
  const headers = (matrix[headerIndex] ?? []).map((h) => String(h ?? "").trim());
  const body = matrix.slice(headerIndex + 1);
  const lower = headers.map(norm);
  const cell = (row: string[], i: number) => (i === -1 ? "" : String(row[i] ?? "").trim());

  // Screaming Frog Issues Overview, or a workbook Issue Tracker.
  const issueNameCol = lower.indexOf("issue name");
  const issueCol = lower.indexOf("issue");
  const priorityCol = findColumn(headers, ["issue priority", "priority"]);
  const detailTabCol = lower.indexOf("detail tab");
  const isSfOverview = issueNameCol !== -1 && (lower.includes("urls") || lower.includes("issue type"));
  const isTracker = issueCol !== -1 && priorityCol !== -1 && (detailTabCol !== -1 || lower.includes("affected") || lower.includes("category"));

  if (isSfOverview || isTracker) {
    const nameCol = isSfOverview ? issueNameCol : issueCol;
    const typeCol = lower.indexOf("issue type");
    const urlsCol = lower.indexOf("urls");
    const affectedCol = lower.indexOf("affected");
    const descCol = findColumn(headers, ["description", "why it matters"]);
    const fixCol = findColumn(headers, ["how to fix", "recommended fix"]);
    const categoryCol = lower.indexOf("category");

    const overview: OverviewRow[] = [];
    const siteLevelFiles: ParsedFile[] = [];
    for (const row of body) {
      const issue = cell(row, nameCol);
      if (!issue) continue;
      const detailTab = cell(row, detailTabCol);
      const priority = cell(row, priorityCol) || null;
      const hint = cell(row, categoryCol) || null;
      overview.push({
        issue_name: detailTab || issue,
        issue_type: cell(row, typeCol) || null,
        issue_priority: priority,
        urls: urlsCol !== -1 ? toInt(cell(row, urlsCol)) : null,
        description: cell(row, descCol) || null,
        how_to_fix: cell(row, fixCol) || null,
        category_hint: hint,
      });
      // Tracker rows that have no detail sheet are site-wide issues: one finding on the home page.
      if (isTracker && !detailTab && opts.siteUrl) {
        const details: Record<string, string> = {};
        if (hint) details["Category"] = hint;
        if (priority) details["Priority"] = priority;
        const affected = cell(row, affectedCol);
        if (affected) details["Affected"] = affected;
        const why = cell(row, descCol);
        if (why) details["Why it matters"] = why.slice(0, MAX_DETAIL_LENGTH);
        const fix = cell(row, fixCol);
        if (fix) details["Recommended fix"] = fix.slice(0, MAX_DETAIL_LENGTH);
        siteLevelFiles.push({ kind: "issues", source, issue_name: issue, rows: [{ url: opts.siteUrl, details }], headers });
      }
    }
    return [{ kind: "overview", source, rows: overview, headers }, ...siteLevelFiles];
  }

  const urlCol = findColumn(headers, URL_HEADERS);
  if (urlCol === -1) {
    return [{ kind: "unknown", source, headers, error: `No URL column found. Headers: ${headers.join(", ")}` }];
  }
  const splitCol = issueNameCol !== -1 ? issueNameCol : findColumn(headers, ISSUE_COLUMN_HEADERS);
  const detailCols = headers
    .map((h, i) => i)
    .filter((i) => i !== urlCol && i !== splitCol && !DROP_DETAIL_HEADERS.includes(lower[i]) && headers[i] !== "")
    .slice(0, MAX_DETAIL_COLUMNS);

  const groups = new Map<string, IssueRow[]>();
  const seen = new Set<string>();
  for (const row of body) {
    const url = cell(row, urlCol);
    if (!url || !/^https?:\/\//i.test(url) && !/^\//.test(url)) continue;
    const label = cell(row, splitCol);
    const issueName =
      splitCol === -1 || !label
        ? opts.baseIssueName
        : issueNameCol !== -1
          ? label
          : `${opts.baseIssueName}: ${label}`;
    const dedupe = `${normaliseIssueName(issueName)}\u0000${url}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const details: Record<string, string> = {};
    for (const i of detailCols) {
      const v = cell(row, i);
      if (v) details[headers[i]] = v.length > MAX_DETAIL_LENGTH ? `${v.slice(0, MAX_DETAIL_LENGTH)}…` : v;
    }
    groups.set(issueName, [...(groups.get(issueName) ?? []), { url, details }]);
  }

  return [...groups.entries()].map(([issue_name, rows]) => ({ kind: "issues", source, issue_name, rows, headers }));
}

/** A Screaming Frog CSV export (per-issue file or Issues Overview). */
export function parseScreamingFrogCsv(filename: string, text: string, siteUrl?: string | null): ParsedFile[] {
  const result = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
  return parseTable(filename, result.data, { baseIssueName: issueNameFromFilename(filename), siteUrl });
}

/** An .xlsx audit workbook: every data sheet becomes one or more issue groups. */
export function parseWorkbook(
  filename: string,
  data: Uint8Array,
  siteUrl?: string | null,
): { files: ParsedFile[]; skippedSheets: string[] } {
  const wb = XLSX.read(data, { type: "array", cellDates: false });
  const files: ParsedFile[] = [];
  const skippedSheets: string[] = [];
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const matrix = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, raw: false, defval: "", blankrows: false });
    const parsed = parseTable(`${filename} › ${name}`, matrix, { baseIssueName: name.trim(), siteUrl });
    const hasOverview = parsed.some((p) => p.kind === "overview");
    if (!hasOverview && SKIP_SHEET.test(name)) {
      skippedSheets.push(name);
      continue;
    }
    for (const p of parsed) {
      if (p.kind === "unknown") skippedSheets.push(name);
      else files.push(p);
    }
  }
  return { files, skippedSheets };
}

/** Dispatch on file type. */
export async function parseExportFile(file: File, siteUrl?: string | null): Promise<{ files: ParsedFile[]; skipped: string[] }> {
  if (/\.xlsx?$|\.xlsm$/i.test(file.name)) {
    const { files, skippedSheets } = parseWorkbook(file.name, new Uint8Array(await file.arrayBuffer()), siteUrl);
    return { files, skipped: skippedSheets.map((s) => `${file.name} › ${s}`) };
  }
  const parsed = parseScreamingFrogCsv(file.name, await file.text(), siteUrl);
  return {
    files: parsed.filter((p) => p.kind !== "unknown"),
    skipped: parsed.filter((p) => p.kind === "unknown").map((p) => `${file.name}: ${(p as { error: string }).error}`),
  };
}
