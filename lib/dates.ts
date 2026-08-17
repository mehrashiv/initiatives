const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function offsetDate(days: number): Date {
  const base = startOfDay(new Date());
  base.setDate(base.getDate() + days);
  return base;
}

export function dayDiff(a: Date, b: Date): number {
  return Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / 86_400_000);
}

// Date-only columns (end_date, start_date, delivery_date) come back as bare
// "YYYY-MM-DD" strings. Parsing that directly with `new Date(...)` reads it as
// UTC midnight, which displays as the previous day in any negative-UTC-offset
// browser — force local-midnight interpretation instead. Every date-only
// column read in the app should route through this, not a local re-implementation.
export function parseDateOnly(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

export function formatShortDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

export function formatLongDate(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return (parts[0][0] + (parts[0][1] ?? parts[0][0])).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function toDateInputValue(date: Date | null): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateInputValue(value: string): Date | null {
  return value ? new Date(`${value}T00:00:00`) : null;
}

export function getQuarterLabel(date: Date): string {
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `Q${quarter} ${date.getFullYear()}`;
}

export function getQuarterStartDate(quarterLabel: string): Date {
  const match = quarterLabel.match(/^Q([1-4]) (\d{4})$/);
  if (!match) throw new Error(`Invalid quarter label: ${quarterLabel}`);
  const quarter = Number(match[1]);
  const year = Number(match[2]);
  return new Date(year, (quarter - 1) * 3, 1);
}

export function getQuarterEndDate(quarterLabel: string): Date {
  const start = getQuarterStartDate(quarterLabel);
  return new Date(start.getFullYear(), start.getMonth() + 3, 1);
}

export function getRecentQuarterLabels(date: Date, count: number): string[] {
  const labels: string[] = [];
  let year = date.getFullYear();
  let quarter = Math.floor(date.getMonth() / 3) + 1;
  for (let i = 0; i < count; i++) {
    labels.push(`Q${quarter} ${year}`);
    quarter -= 1;
    if (quarter === 0) {
      quarter = 4;
      year -= 1;
    }
  }
  return labels;
}

export interface DateBucket {
  label: string;
  start: Date; // inclusive
  end: Date; // exclusive
}

export function getTrailingWeekBuckets(today: Date, count: number): DateBucket[] {
  const upperBound = startOfDay(today);
  upperBound.setDate(upperBound.getDate() + 1); // today counts toward the most recent bucket
  const buckets: DateBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const end = new Date(upperBound);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 7);
    buckets.push({ label: formatShortDate(start), start, end });
  }
  return buckets;
}

export function getTrailingMonthBuckets(today: Date, count: number): DateBucket[] {
  const buckets: DateBucket[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
    buckets.push({ label: MONTHS[start.getMonth()], start, end });
  }
  return buckets;
}

export function getTrailingQuarterBuckets(today: Date, count: number): DateBucket[] {
  const labels = getRecentQuarterLabels(today, count).reverse();
  return labels.map((label) => {
    const start = getQuarterStartDate(label);
    const end = new Date(start.getFullYear(), start.getMonth() + 3, 1);
    return { label, start, end };
  });
}

export function getGranularityBuckets(granularity: "Week" | "Month" | "Quarter", today: Date): DateBucket[] {
  if (granularity === "Week") return getTrailingWeekBuckets(today, 7);
  if (granularity === "Quarter") return getTrailingQuarterBuckets(today, 4);
  return getTrailingMonthBuckets(today, 7);
}

export function formatRelativeTime(date: Date, today: Date): string {
  const diff = dayDiff(today, date);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff} days ago`;
  const weeks = Math.round(diff / 7);
  if (weeks < 5) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  const months = Math.round(diff / 30);
  return months <= 1 ? "1 month ago" : `${months} months ago`;
}
