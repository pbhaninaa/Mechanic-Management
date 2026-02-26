package com.test.app.TestAppBackEnd.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    @Value("${app.frontend-url:https://172.20.10.11:3000}")
    private String frontendUrl;

    @EventListener(ApplicationReadyEvent.class)
    public void logFrontendUrl() {
        log.info("Password reset links will use: {}", frontendUrl);
        if (frontendUrl.contains("localhost:5173")) {
            log.warn("WARNING: app.frontend-url contains localhost:5173 - if you access the app via IP (e.g. 172.20.10.11:3000), "
                    + "set app.frontend-url in application.yml to match (e.g. https://172.20.10.11:3000)");
        }
    }
}
