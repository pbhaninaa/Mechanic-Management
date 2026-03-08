package com.test.app.TestAppBackEnd.services;

import ch.qos.logback.classic.Logger;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;


@Service
public class ClientNotificationService {

    private final EmailService emailService;
    private final SmsService smsService;
    private final UserProfileRepository userProfileRepository;

    public ClientNotificationService(EmailService emailService,
                                     SmsService smsService,
                                     UserProfileRepository userProfileRepository) {
        this.emailService = emailService;
        this.smsService = smsService;
        this.userProfileRepository = userProfileRepository;
    }

    private String getClientEmail(String username) {
        if (username == null || username.isBlank()) return null;
        return userProfileRepository.findByUsername(username)
                .map(UserProfile::getEmail)
                .filter(e -> e != null && !e.isBlank())
                .orElse(username.contains("@") ? username : null);
    }

    private UserProfile getClientProfile(String username) {
        if (username == null || username.isBlank()) return null;
        return userProfileRepository.findByUsername(username).orElse(null);
    }

    private static final String BUSINESS_ADDRESS = "123 Main Street, Cape Town, South Africa";

    @Async
    public void notifyRequestAccepted(String username, String paymentLink, String serviceType, String jobDescription) {
        UserProfile profile = getClientProfile(username);
        String toEmail = profile != null && profile.getEmail() != null && !profile.getEmail().isBlank()
                ? profile.getEmail() : (username != null && username.contains("@") ? username : null);

        String jobContext = com.test.app.TestAppBackEnd.util.DescriptionUtils.ensureDescription(jobDescription, serviceType);

        String subject = "Your " + serviceType + " Request Has Been Accepted";
        String body = "Hi " + username + ",\n\n" +
                "Good news! Your request for " + jobContext + " has been accepted.\n\n" +
                "To confirm your booking, please complete your payment using the link below:\n\n" +
                paymentLink + "\n\n" +
                "You can also access payment from your Request History in the app.\n\n" +
                "Thank you for choosing our service!";

        if (toEmail != null) {
            emailService.sendEmailNotification(toEmail, subject, body);
        }

        if (profile != null && profile.getPhoneNumber() != null && !profile.getPhoneNumber().isBlank()) {
            String smsBody = "MechConnect: Your " + jobContext + " request has been accepted. Pay now: " + paymentLink;
            smsService.sendSms(profile.getPhoneNumber(), profile.getCountryCode(), smsBody);
        }
    }

    @Async
    public void notifyServiceCompleted(String clientUsername, String loggedInUsername, String serviceType, String jobDescription) {
        UserProfile profile = getClientProfile(clientUsername);
        String toEmail = profile != null && profile.getEmail() != null && !profile.getEmail().isBlank()
                ? profile.getEmail() : (clientUsername != null && clientUsername.contains("@") ? clientUsername : null);

        String jobContext = com.test.app.TestAppBackEnd.util.DescriptionUtils.ensureDescription(jobDescription, serviceType);

        // Determine the collection address (staff's address if available)
        String collectionAddress = BUSINESS_ADDRESS;
        if (loggedInUsername != null && !loggedInUsername.isBlank()) {
            UserProfile loggedInProfile = userProfileRepository.findByUsername(loggedInUsername).orElse(null);
            if (loggedInProfile != null && loggedInProfile.getAddress() != null && !loggedInProfile.getAddress().isBlank()) {
                collectionAddress = loggedInProfile.getAddress();
            }
        }

        // Encode for URLs
        String encodedAddress = URLEncoder.encode(collectionAddress, StandardCharsets.UTF_8);
        String wazeLink = "https://waze.com/ul?q=" + encodedAddress + "&navigate=yes";
        String googleLink = "https://www.google.com/maps/dir/?api=1&destination=" + encodedAddress;

        String subject = "Your Car Is Ready for Collection";
        String body = "Hi " + clientUsername + ",\n\n" +
                "Your " + jobContext + " has been successfully completed.\n\n" +
                "You can now come and collect your car at your convenience.\n\n" +
                "Get directions using one of the options below:\n\n" +
                "Waze: " + wazeLink + "\n" +
                "Google Maps: " + googleLink + "\n\n" +
                "If you have any questions, feel free to contact us.\n\n" +
                "Thank you for choosing our service!";

        if (toEmail != null) {
            emailService.sendEmailNotification(toEmail, subject, body);
        }

        if (profile != null && profile.getPhoneNumber() != null && !profile.getPhoneNumber().isBlank()) {
            String smsBody = "MechConnect: Your " + jobContext + " is done. Collect at: " + collectionAddress + " | Waze: " + wazeLink;
            smsService.sendSms(profile.getPhoneNumber(), profile.getCountryCode(), smsBody);
        }
    }
    @Async
    public void notifyServiceProvider(String providerUsername, String requestLocation) {
        UserProfile profile = getClientProfile(providerUsername);

        if (profile == null) {
            Logger log = null;
            log.warn("No profile found for provider: {}", providerUsername);
            return;
        }

        String encodedAddress = URLEncoder.encode(requestLocation, StandardCharsets.UTF_8);
        String wazeLink = "https://waze.com/ul?q=" + encodedAddress + "&navigate=yes";
        String googleLink = "https://www.google.com/maps/dir/?api=1&destination=" + encodedAddress;

        String subject = "New Client Request - Directions";
        String body = String.format(
                "Hi %s,\n\nA client has requested your service at the following location:\n\n%s\n\n" +
                        "You can navigate using:\nWaze: %s\nGoogle Maps: %s\n\n" +
                        "If you have any questions, feel free to contact us.\n\nThank you for providing your service!",
                providerUsername, requestLocation, wazeLink, googleLink
        );

        if (profile.getEmail() != null && !profile.getEmail().isBlank()) {
            emailService.sendEmailNotification(profile.getEmail(), subject, body);
        }

        if (profile.getPhoneNumber() != null && !profile.getPhoneNumber().isBlank()) {
            String smsBody = String.format("MechConnect: New client at %s | Waze: %s", requestLocation, wazeLink);
            smsService.sendSms(profile.getPhoneNumber(), profile.getCountryCode(), smsBody);
        }
    }


}