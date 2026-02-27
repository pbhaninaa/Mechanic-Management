package com.test.app.TestAppBackEnd.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Arrays;
import java.util.List;

/**
 * Normalizes date strings to yyyy-MM-dd for consistent DB storage and range search.
 */
public final class DateFormatUtil {

    public static final String ISO_DATE = "yyyy-MM-dd";
    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE;

    private static final List<DateTimeFormatter> PARSERS = Arrays.asList(
            ISO,
            DateTimeFormatter.ofPattern("yyyy-MM-dd"),
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),
            DateTimeFormatter.ofPattern("MM/dd/yyyy"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),
            DateTimeFormatter.ofPattern("yyyy/MM/dd")
    );

    private DateFormatUtil() {}

    /**
     * Normalize a date string to yyyy-MM-dd for storage. Returns null if input is null or blank.
     * Supports common formats so that range search (string comparison) works in the DB.
     */
    public static String normalizeToIsoDate(String dateInput) {
        if (dateInput == null || dateInput.isBlank()) return null;
        String trimmed = dateInput.trim();
        for (DateTimeFormatter parser : PARSERS) {
            try {
                LocalDate d = LocalDate.parse(trimmed, parser);
                return d.format(ISO);
            } catch (DateTimeParseException ignored) {
                // try next
            }
        }
        return null; // do not store unparseable dates so range search stays reliable
    }
}
