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
  return { formatDate, formatDateTime, DATE_FORMAT, DATETIME_FORMAT };
}
