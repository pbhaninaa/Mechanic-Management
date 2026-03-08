package com.test.app.TestAppBackEnd.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Logs the configured frontend URL at startup. Used for password reset links.
 * If you see localhost:5173 here but expect a different URL, check application.yml and application.properties.
 */
@Component
public class FrontendUrlLogger {

    private static final Logger log = LoggerFactory.getLogger(FrontendUrlLogger.class);

    private final FrontendUrlResolver frontendUrlResolver;

    public FrontendUrlLogger(FrontendUrlResolver frontendUrlResolver) {
        this.frontendUrlResolver = frontendUrlResolver;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logFrontendUrl() {
        String defaultUrl = frontendUrlResolver.getDefaultFrontendUrl();
        log.info("Frontend base URL (default): {}. Links use request Origin when in allowlist.", defaultUrl);
        if (defaultUrl.contains("localhost") || defaultUrl.contains("127.0.0.1")) {
            log.warn("WARNING: default frontend URL is local. For production set app.frontend-url (or APP_FRONTEND_URL) to your Vercel URL.");
        }
    }
}
