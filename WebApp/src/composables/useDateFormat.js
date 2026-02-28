import { format } from "date-fns";

/** Standard date format used throughout the app */
export const DATE_FORMAT = "dd MMM yyyy";
/** Date + time format for timestamps */
export const DATETIME_FORMAT = "dd MMM yyyy, HH:mm";

/**
 * Format a date string for display. Returns "—" for invalid/missing values.
 * @param {string|Date|null|undefined} value - ISO date string or Date object
 * @returns {string}
 */
export function formatDate(value) {
  if (value == null || value === "") return "—";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "—";
    return format(d, DATE_FORMAT);
  } catch {
    return "—";
  }
}
export function parseLocalDate(value) {
  if (!value || typeof value !== "string") return null;

  const parts = value.split("-");
  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

/**
 * Convert a date value to ISO date-only string "yyyy-MM-dd" for backend LocalDate.
 * Accepts: "yyyy-MM-dd" string, ISO datetime string, or Date object.
 * @param {string|Date|null|undefined} value
 * @returns {string|null} "yyyy-MM-dd" or null
 */
export function toLocalDateString(value) {
  if (value == null || value === "") return null;
  try {
    let d;
    if (typeof value === "string") {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
      d = new Date(value);
    } else {
      d = value;
    }
    if (!(d instanceof Date) || isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return null;
  }
}
/**
 * Format a datetime string for display (includes time).
 * @param {string|Date|null|undefined} value - ISO datetime string or Date object
 * @returns {string}
 */
export function formatDateTime(value) {
  if (value == null || value === "") return "—";
  try {
    const d = typeof value === "string" ? new Date(value) : value;
    if (isNaN(d.getTime())) return "—";
    return format(d, DATETIME_FORMAT);
  } catch {
    return "—";
  }
}

export function useDateFormat() {
  return { formatDate, formatDateTime, toLocalDateString, DATE_FORMAT, DATETIME_FORMAT };
}
