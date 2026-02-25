/**
 * Safe localStorage utilities to prevent JSON.parse crashes on corrupted/invalid data
 */

/**
 * Safely parse JSON from localStorage. Returns defaultValue if key is missing or parse fails.
 * @param {string} key - localStorage key
 * @param {*} defaultValue - Value to return on missing key or parse failure
 * @returns {*} Parsed value or defaultValue
 */
export function getSafeJson(key, defaultValue = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue ?? null;
    return JSON.parse(raw);
  } catch {
    return defaultValue ?? null;
  }
}

/**
 * Get user profile safely (alias for common use case)
 */
export function getSafeUserProfile(defaultValue = {}) {
  return getSafeJson("userProfile", defaultValue) || defaultValue;
}
