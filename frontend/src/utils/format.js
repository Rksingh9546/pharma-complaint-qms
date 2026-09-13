/** Shared display formatters. */

/**
 * Parse an ISO-ish value into a Date, or null.
 *
 * Date-only strings ("2025-11-10") are parsed as LOCAL time — new Date()
 * would treat them as UTC midnight and render the previous day in
 * negative-UTC-offset timezones. Classic off-by-one-day bug, avoided here.
 */
function toDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(value) {
  const d = toDate(value);
  return (
    d?.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) ?? null
  );
}

export function formatDateTime(value) {
  const d = toDate(value);
  return (
    d?.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    }) ?? null
  );
}