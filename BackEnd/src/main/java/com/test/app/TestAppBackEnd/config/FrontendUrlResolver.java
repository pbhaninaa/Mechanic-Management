package com.test.app.TestAppBackEnd.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Resolves the frontend base URL for building links (reset password, "View booking", etc.).
 * Uses the current request's Origin header only when it is in the allowlist; otherwise uses the configured default.
 * This avoids sending users to an attacker's domain (e.g. spoofed Origin for password reset links).
 */
@Component
public class FrontendUrlResolver {

    private final String defaultFrontendUrl;
    private final Set<String> allowedOrigins;

    public FrontendUrlResolver(
            @Value("${app.frontend-url:https://mechanic-management-4m995c2rk-pbhanina-5058s-projects.vercel.app}") String defaultFrontendUrl,
            @Value("${app.frontend-allowed-origins:}") String allowedOriginsConfig) {
        this.defaultFrontendUrl = normalizeBaseUrl(defaultFrontendUrl);
        this.allowedOrigins = parseAllowedOrigins(allowedOriginsConfig, this.defaultFrontendUrl);
    }

    private static Set<String> parseAllowedOrigins(String config, String defaultUrl) {
        if (config == null || config.isBlank()) {
            return Set.of(defaultUrl != null && !defaultUrl.isBlank() ? defaultUrl : "https://mechanic-management-4m995c2rk-pbhanina-5058s-projects.vercel.app");
        }
        return Arrays.stream(config.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(FrontendUrlResolver::normalizeBaseUrl)
                .collect(Collectors.toSet());
    }

    private static String normalizeBaseUrl(String url) {
        if (url == null || url.isBlank()) return url;
        String u = url.trim();
        return u.endsWith("/") ? u.substring(0, u.length() - 1) : u;
    }

    /**
     * Returns the frontend base URL to use for links in the current request.
     * If the request has an Origin header that is in the allowlist, that origin is returned;
     * otherwise the configured default is returned. When there is no current request (e.g. async),
     * returns the default.
     */
    public String getFrontendBaseUrl() {
        HttpServletRequest request = getCurrentRequest();
        if (request == null) return defaultFrontendUrl;

        String origin = request.getHeader("Origin");
        if (origin == null || origin.isBlank()) {
            String referer = request.getHeader("Referer");
            if (referer != null && !referer.isBlank()) {
                try {
                    int pathStart = referer.indexOf('/', referer.indexOf("://") + 3);
                    origin = pathStart > 0 ? referer.substring(0, pathStart) : referer;
                } catch (Exception ignored) {
                    origin = null;
                }
            }
        }
        if (origin != null && !origin.isBlank()) {
            String normalized = normalizeBaseUrl(origin);
            if (allowedOrigins.contains(normalized)) return normalized;
        }
        return defaultFrontendUrl;
    }

    private static HttpServletRequest getCurrentRequest() {
        try {
            var attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes sra) return sra.getRequest();
        } catch (Exception ignored) { }
        return null;
    }

    /** Returns the configured default URL (for logging / when no request). */
    public String getDefaultFrontendUrl() {
        return defaultFrontendUrl;
    }
}
