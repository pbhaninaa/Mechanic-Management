package com.test.app.TestAppBackEnd.util;

/**
 * Ensures description strings are never null, empty, or just "-" for display and storage.
 */
public final class DescriptionUtils {

    private DescriptionUtils() {}

    /**
     * Returns a non-empty description. If the given string is null, blank, or "-" (trimmed), returns the fallback.
     */
    public static String ensureDescription(String description, String fallback) {
        if (fallback == null) fallback = "Service";
        if (description == null || description.isBlank()) return fallback;
        String t = description.trim();
        if (t.isEmpty() || "-".equals(t)) return fallback;
        return t;
    }
}
