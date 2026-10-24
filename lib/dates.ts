// Date helpers for plain "YYYY-MM-DD" strings (the format Postgres `date`
// columns use). All math is done in local time, which is what the team sees.

export type IsoDate = string;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toIso(d: Date): IsoDate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromIso(iso: IsoDate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayIso(): IsoDate {
  return toIso(new Date());
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const d = fromIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function diffDays(a: IsoDate, b: IsoDate): number {
  return Math.round((fromIso(b).getTime() - fromIso(a).getTime()) / 86_400_000);
}

/** Monday of the week containing `iso`. */
export function startOfWeek(iso: IsoDate): IsoDate {
  const d = fromIso(iso);
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - offset);
  return toIso(d);
}

export function endOfWeek(iso: IsoDate): IsoDate {
  return addDays(startOfWeek(iso), 6);
}

export function startOfMonth(iso: IsoDate): IsoDate {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso: IsoDate): IsoDate {
  const d = fromIso(startOfMonth(iso));
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  return toIso(d);
}

/** ISO 8601 week key, e.g. 2026-W44. */
export function isoWeekKey(iso: IsoDate): string {
  const d = fromIso(iso);
  // Thursday of this week decides the ISO year
  const thursday = new Date(d);
  thursday.setDate(d.getDate() - ((d.getDay() + 6) % 7) + 3);
  const year = thursday.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const week =
    1 +
    Math.round(
      ((thursday.getTime() - jan4.getTime()) / 86_400_000 -
        3 +
        ((jan4.getDay() + 6) % 7)) /
        7,
    );
  return `${year}-W${pad(week)}`;
}

/** Month key, e.g. 2026-10. */
export function monthKey(iso: IsoDate): string {
  return iso.slice(0, 7);
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const shortDateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const monthFmt = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });

export function formatDate(iso: IsoDate | null | undefined): string {
  return iso ? dateFmt.format(fromIso(iso)) : "—";
}

export function formatShortDate(iso: IsoDate | null | undefined): string {
  return iso ? shortDateFmt.format(fromIso(iso)) : "—";
}

export function formatMonth(iso: IsoDate): string {
  return monthFmt.format(fromIso(startOfMonth(iso)));
}

export function formatRange(start: IsoDate, end: IsoDate): string {
  return `${shortDateFmt.format(fromIso(start))} – ${dateFmt.format(fromIso(end))}`;
}
