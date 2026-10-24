// Shared helpers for server-action forms.
import type { LinkItem } from "@/lib/types";

export type FormState = { error: string | null };

export const initialFormState: FormState = { error: null };

export function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export function optStr(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v === "" ? null : v;
}

export function optInt(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function optNumber(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === "on" || fd.get(key) === "true";
}

/** One entry per non-empty line of a textarea. */
export function lines(fd: FormData, key: string): string[] {
  return str(fd, key)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/** "Name | https://url" per line -> [{ name, url }]. A line without "|" is a name only. */
export function linkItems(fd: FormData, key: string): LinkItem[] {
  return lines(fd, key).map((line) => {
    const [name, ...rest] = line.split("|");
    return { name: name.trim(), url: rest.join("|").trim() };
  });
}

export function linkItemsToText(items: unknown): string {
  if (!Array.isArray(items)) return "";
  return items
    .map((i) => {
      if (!i || typeof i !== "object") return "";
      const { name = "", url = "" } = i as Partial<LinkItem>;
      return url ? `${name} | ${url}` : name;
    })
    .filter(Boolean)
    .join("\n");
}

export function asLinkItems(value: unknown): LinkItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((i): i is LinkItem => !!i && typeof i === "object" && "name" in i)
    .map((i) => ({ name: String(i.name ?? ""), url: String(i.url ?? "") }));
}

/** Picks the first zod issue as a readable message. */
export function firstIssue(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  const issue = error.issues[0];
  if (!issue) return "Invalid input.";
  const field = issue.path.map(String).join(".");
  return field ? `${field}: ${issue.message}` : issue.message;
}
