// Parses a keyword CSV by header names, not positions, so exports from
// Claude research sheets, SE Ranking, DataForSEO, or a plain spreadsheet all
// work. Pure function: no database, easy to test.
import Papa from "papaparse";
import type { SearchIntent } from "@/lib/types";

const INTENTS = ["informational", "navigational", "commercial", "transactional"] as const;

export const HEADER_ALIASES = {
  keyword: ["keyword", "query", "term", "keywords"],
  search_volume: ["search_volume", "search volume", "volume", "sv", "monthly searches", "avg. monthly searches"],
  difficulty: ["difficulty", "kd", "keyword difficulty", "seo difficulty", "difficulty index"],
  cpc: ["cpc", "cpc (usd)", "cost per click", "cpc (idr)"],
  intent: ["intent", "search intent"],
  cluster: ["cluster", "group", "topic", "parent topic"],
} as const;

type Field = keyof typeof HEADER_ALIASES;

export type ParsedKeywordRow = {
  keyword: string;
  cluster_name: string | null;
  search_volume: number | null;
  difficulty: number | null;
  cpc: number | null;
  intent: SearchIntent | null;
};

export type ParsedKeywordCsv =
  | { ok: true; rows: ParsedKeywordRow[]; skipped: number; headers: string[] }
  | { ok: false; error: string; headers: string[] };

function normaliseHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function mapHeaders(headers: string[]): Partial<Record<Field, string>> {
  const map: Partial<Record<Field, string>> = {};
  for (const h of headers) {
    const n = normaliseHeader(h);
    for (const field of Object.keys(HEADER_ALIASES) as Field[]) {
      if (!map[field] && (HEADER_ALIASES[field] as readonly string[]).includes(n)) {
        map[field] = h;
      }
    }
  }
  return map;
}

/** "1,200", "1.2K", "Rp 3.500" -> number; empty or junk -> null. */
export function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const raw = String(value).trim();
  if (raw === "") return null;
  const k = /^([\d.,]+)\s*k$/i.exec(raw);
  if (k) {
    const n = Number(k[1].replace(/,/g, ""));
    return Number.isFinite(n) ? Math.round(n * 1000) : null;
  }
  const cleaned = raw.replace(/[^\d.-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function toIntent(value: unknown): SearchIntent | null {
  const v = String(value ?? "").trim().toLowerCase();
  if ((INTENTS as readonly string[]).includes(v)) return v as SearchIntent;
  // Common single-letter codes from SEO tools: I / N / C / T
  const codes: Record<string, SearchIntent> = { i: "informational", n: "navigational", c: "commercial", t: "transactional" };
  return codes[v] ?? null;
}

export function parseKeywordCsv(text: string): ParsedKeywordCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  const headers = result.meta.fields ?? [];
  const map = mapHeaders(headers);

  if (!map.keyword) {
    return {
      ok: false,
      headers,
      error: `No keyword column found. Headers seen: ${headers.join(", ") || "(none)"}. Expected one of: ${HEADER_ALIASES.keyword.join(", ")}.`,
    };
  }

  const rows: ParsedKeywordRow[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const row of result.data) {
    const keyword = String(row[map.keyword] ?? "").trim().toLowerCase();
    if (!keyword || seen.has(keyword)) {
      skipped += 1;
      continue;
    }
    seen.add(keyword);

    const volume = map.search_volume ? toNumber(row[map.search_volume]) : null;
    const clusterName = map.cluster ? String(row[map.cluster] ?? "").trim() : "";

    rows.push({
      keyword,
      cluster_name: clusterName || null,
      search_volume: volume == null ? null : Math.round(volume),
      difficulty: map.difficulty ? toNumber(row[map.difficulty]) : null,
      cpc: map.cpc ? toNumber(row[map.cpc]) : null,
      intent: map.intent ? toIntent(row[map.intent]) : null,
    });
  }

  return { ok: true, rows, skipped, headers };
}
