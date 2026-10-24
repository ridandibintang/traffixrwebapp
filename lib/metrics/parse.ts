// Parses Google Search Console and GA4 CSV exports by header name (English or
// Indonesian UI). Pure functions, no database.
//
// GSC (Performance > Export > Download CSV, unzipped):
//   Queries.csv  "Top queries,Clicks,Impressions,CTR,Position"
//   Pages.csv    "Top pages,Clicks,Impressions,CTR,Position"
//   Dates.csv    "Date,Clicks,Impressions,CTR,Position"   -> period totals
// GA4 (Reports > Export > CSV): comment lines starting with "#" (including
//   "# 20261001-20261014"), then a table such as
//   "Session default channel group,Sessions,Engaged sessions,...,Key events"
//   or "Landing page,Sessions,...".
import Papa from "papaparse";

export type GscMetrics = { clicks: number; impressions: number; ctr: number; position: number };
export type GscRow = GscMetrics & { key: string };
export type ParsedGsc =
  | { kind: "queries" | "pages" | "dates"; rows: GscRow[] }
  | { kind: "unknown"; error: string };

export type Ga4Metrics = { sessions: number; engaged_sessions: number | null; key_events: number | null; engagement_rate: number | null };
export type Ga4Row = Ga4Metrics & { key: string };
export type ParsedGa4 =
  | { kind: "channels" | "landing_pages"; rows: Ga4Row[]; startDate: string | null; endDate: string | null }
  | { kind: "unknown"; error: string };

const H = {
  query: ["top queries", "query", "queries", "kueri teratas", "kueri"],
  page: ["top pages", "page", "pages", "halaman teratas", "halaman", "landing page", "landing page + query string", "halaman landing"],
  date: ["date", "tanggal"],
  clicks: ["clicks", "klik"],
  impressions: ["impressions", "tayangan"],
  ctr: ["ctr", "rkt"],
  position: ["position", "posisi", "average position", "posisi rata-rata"],
  channel: ["session default channel group", "session default channel grouping", "default channel group", "grup saluran default sesi", "session primary channel group (default channel group)", "first user default channel group"],
  sessions: ["sessions", "sesi"],
  engaged: ["engaged sessions", "sesi yang berinteraksi", "sesi engagement"],
  keyEvents: ["key events", "conversions", "peristiwa utama", "konversi"],
  engagementRate: ["engagement rate", "rasio engagement", "rasio interaksi"],
};

function norm(h: string) {
  return h.replace(/^﻿/, "").trim().toLowerCase();
}

function col(headers: string[], names: string[]) {
  const lower = headers.map(norm);
  for (const n of names) {
    const i = lower.indexOf(n);
    if (i !== -1) return i;
  }
  return -1;
}

/**
 * Decimal values ("12.5%", "0,73", "4,2", "2.100,50") -> number. A lone
 * separator followed by exactly three digits is treated as thousands only
 * when a second separator shows which one is decimal; otherwise it is a
 * decimal point. Use count() for whole-number metrics.
 */
export function num(value: unknown): number | null {
  let s = String(value ?? "").trim();
  if (!s || s === "-" || s === "–") return null;
  const percent = s.endsWith("%");
  s = s.replace(/[%\s]/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma !== -1) {
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return percent ? n / 100 : n;
}

/**
 * Whole-number metrics (clicks, impressions, sessions). Both "1,240" and
 * "1.240" are thousands here, because these metrics are never fractional.
 */
export function count(value: unknown): number | null {
  const s = String(value ?? "").trim().replace(/\s/g, "");
  if (!s || s === "-" || s === "–") return null;
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ""));
  const n = num(s);
  return n == null ? null : Math.round(n);
}

function ratio(value: unknown): number | null {
  const n = num(value);
  if (n == null) return null;
  // CTR exported as "12.5%" becomes 0.125; a bare "12.5" is also a percentage.
  return n > 1 ? n / 100 : n;
}

export function parseGscCsv(text: string): ParsedGsc {
  const result = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
  const [headerRow, ...body] = result.data;
  if (!headerRow) return { kind: "unknown", error: "Empty file." };
  const headers = headerRow.map(String);

  const clicks = col(headers, H.clicks);
  const impressions = col(headers, H.impressions);
  if (clicks === -1 || impressions === -1) {
    return { kind: "unknown", error: `Not a Search Console export (no Clicks/Impressions columns). Headers: ${headers.join(", ")}` };
  }
  const ctr = col(headers, H.ctr);
  const position = col(headers, H.position);

  let kind: "queries" | "pages" | "dates";
  let keyCol: number;
  if ((keyCol = col(headers, H.query)) !== -1) kind = "queries";
  else if ((keyCol = col(headers, H.page)) !== -1) kind = "pages";
  else if ((keyCol = col(headers, H.date)) !== -1) kind = "dates";
  else return { kind: "unknown", error: `Could not tell whether this is Queries, Pages or Dates. Headers: ${headers.join(", ")}` };

  const rows: GscRow[] = [];
  for (const r of body) {
    const key = String(r[keyCol] ?? "").trim();
    const c = count(r[clicks]);
    const i = count(r[impressions]);
    if (!key || c == null || i == null) continue;
    rows.push({
      key,
      clicks: c,
      impressions: i,
      ctr: ratio(r[ctr]) ?? (i > 0 ? c / i : 0),
      position: num(r[position]) ?? 0,
    });
  }
  return { kind, rows };
}

/** Period totals from Dates.csv rows: sums, CTR from sums, impression-weighted position. */
export function gscTotals(rows: GscRow[]): GscMetrics {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const weighted = rows.reduce((s, r) => s + r.position * r.impressions, 0);
  return {
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position: impressions > 0 ? Math.round((weighted / impressions) * 10) / 10 : 0,
  };
}

export function parseGa4Csv(text: string): ParsedGa4 {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  let startDate: string | null = null;
  let endDate: string | null = null;
  const tableLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith("#")) {
      const m = /(\d{4})(\d{2})(\d{2})\s*-\s*(\d{4})(\d{2})(\d{2})/.exec(line);
      if (m) {
        startDate = `${m[1]}-${m[2]}-${m[3]}`;
        endDate = `${m[4]}-${m[5]}-${m[6]}`;
      }
      continue;
    }
    tableLines.push(line);
  }
  const result = Papa.parse<string[]>(tableLines.join("\n"), { skipEmptyLines: "greedy" });
  const [headerRow, ...body] = result.data;
  if (!headerRow) return { kind: "unknown", error: "Empty file." };
  const headers = headerRow.map(String);

  const sessions = col(headers, H.sessions);
  if (sessions === -1) {
    return { kind: "unknown", error: `Not a GA4 export (no Sessions column). Headers: ${headers.join(", ")}` };
  }
  const engaged = col(headers, H.engaged);
  const keyEvents = col(headers, H.keyEvents);
  const engagementRate = col(headers, H.engagementRate);

  let kind: "channels" | "landing_pages";
  let keyCol: number;
  if ((keyCol = col(headers, H.channel)) !== -1) kind = "channels";
  else if ((keyCol = col(headers, H.page)) !== -1) kind = "landing_pages";
  else return { kind: "unknown", error: `Could not tell whether this is a channel or landing page report. Headers: ${headers.join(", ")}` };

  const rows: Ga4Row[] = [];
  for (const r of body) {
    const key = String(r[keyCol] ?? "").trim();
    const s = count(r[sessions]);
    if (!key || s == null) continue;
    // GA4 exports end with a totals row that repeats the header or is blank-keyed; skip "Grand total".
    if (/^(grand )?total$/i.test(key)) continue;
    rows.push({
      key,
      sessions: s,
      engaged_sessions: engaged === -1 ? null : count(r[engaged]),
      key_events: keyEvents === -1 ? null : count(r[keyEvents]),
      engagement_rate: engagementRate === -1 ? null : ratio(r[engagementRate]),
    });
  }
  return { kind, rows, startDate, endDate };
}

/** The organic row of a channel report, if present. */
export function ga4OrganicTotals(rows: Ga4Row[]): Ga4Metrics | null {
  const organic = rows.find((r) => /organic search|penelusuran organik/i.test(r.key));
  if (!organic) return null;
  return {
    sessions: organic.sessions,
    engaged_sessions: organic.engaged_sessions,
    key_events: organic.key_events,
    engagement_rate: organic.engagement_rate,
  };
}
