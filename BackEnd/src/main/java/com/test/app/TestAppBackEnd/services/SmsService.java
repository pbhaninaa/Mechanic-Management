package com.test.app.TestAppBackEnd.services;

import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Sends SMS via Twilio. Configure twilio.account-sid, twilio.auth-token, and either:
 * - twilio.from-number (phone number, e.g. +1234567890), or
 * - twilio.messaging-service-sid (MG... from Messaging Services).
 * If not configured, sendSms does nothing (no-op).
 */
@Service
public class SmsService {

    private static final Logger log = LoggerFactory.getLogger(SmsService.class);

    @Value("${twilio.account-sid:}")
    private String accountSid;

    @Value("${twilio.auth-token:}")
    private String authToken;

    @Value("${twilio.from-number:}")
    private String fromNumber;

    @Value("${twilio.messaging-service-sid:}")
    private String messagingServiceSid;

    private volatile boolean initialized = false;

    private boolean isConfigured() {
        if (accountSid == null || accountSid.isBlank() || authToken == null || authToken.isBlank()) {
            return false;
        }
        return (fromNumber != null && !fromNumber.isBlank())
                || (messagingServiceSid != null && !messagingServiceSid.isBlank());
    }

    private void initTwilio() {
        if (!initialized && isConfigured()) {
            synchronized (this) {
                if (!initialized) {
                    Twilio.init(accountSid, authToken);
                    initialized = true;
                    log.info("Twilio SMS initialized");
                }
            }
        }
    }

    /**
     * Normalize phone to E.164 (e.g. +27812345678). If countryCode missing, assumes +27 for SA.
     */
    public static String toE164(String phoneNumber, String countryCode) {
        if (phoneNumber == null || phoneNumber.isBlank()) return null;
        String cleaned = phoneNumber.replaceAll("\\D", "");
        if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
        String cc = (countryCode != null && !countryCode.isBlank()) ? countryCode.trim() : "+27";
        if (!cc.startsWith("+")) cc = "+" + cc.replaceAll("\\D", "");
        return cc + cleaned;
    }

    /**
     * Send SMS. No-op if Twilio not configured or phone invalid. Runs async.
     */
    @Async
    public void sendSms(String toPhoneNumber, String countryCode, String body) {
        if (!isConfigured()) {
            log.debug("SMS disabled: Twilio not configured");
            return;
        }
        String to = toE164(toPhoneNumber, countryCode);
        if (to == null) {
            log.warn("SMS skipped: invalid phone");
            return;
        }
        initTwilio();
        try {
            createAndSend(new PhoneNumber(to), body);
            log.info("SMS sent to {}", to);
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", to, e.getMessage(), e);
        }
    }

    /**
     * Send SMS using full E.164 number (e.g. +27812345678).
     */
    @Async
    public void sendSms(String toE164, String body) {
        if (!isConfigured()) return;
        if (toE164 == null || !toE164.startsWith("+")) {
            log.warn("SMS skipped: invalid E.164 number");
            return;
        }
        initTwilio();
        try {
            createAndSend(new PhoneNumber(toE164), body);
            log.info("SMS sent to {}", toE164);
        } catch (Exception e) {
            log.error("Failed to send SMS to {}: {}", toE164, e.getMessage(), e);
        }
    }

    private Message createAndSend(PhoneNumber to, String body) {
        if (messagingServiceSid != null && !messagingServiceSid.isBlank()) {
            return Message.creator(to, messagingServiceSid, body).create();
        }
        return Message.creator(to, new PhoneNumber(fromNumber), body).create();
    }
}
