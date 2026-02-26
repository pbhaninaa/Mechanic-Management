package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class ClientNotificationService {

    private final EmailService emailService;
    private final UserProfileRepository userProfileRepository;

    public ClientNotificationService(EmailService emailService,
                                     UserProfileRepository userProfileRepository) {
        this.emailService = emailService;
        this.userProfileRepository = userProfileRepository;
    }

    private String getClientEmail(String username) {
        if (username == null || username.isBlank()) return null;
        return userProfileRepository.findByUsername(username)
                .map(p -> p.getEmail())
                .filter(e -> e != null && !e.isBlank())
                .orElse(username.contains("@") ? username : null);
    }

    private static final String BUSINESS_ADDRESS = "123 Main Street, Cape Town, South Africa";

    @Async
    public void notifyRequestAccepted(String username, String paymentLink , String serviceType) {
        String to = getClientEmail(username);
        if (to == null) return;

        String subject = "Your " + serviceType + " Request Has Been Accepted";

        String body = "Hi " + username + ",\n\n" +
                "Good news! Your " + serviceType + " request has been accepted.\n\n" +
                "To confirm your booking, please complete your payment using the link below:\n\n" +
                paymentLink + "\n\n" +
                "You can also access payment from your Request History in the app.\n\n" +
                "Thank you for choosing our service!";

        emailService.sendEmailNotification(to, subject, body);
    }

    @Async
    public void notifyServiceCompleted(String clientUsername, String loggedInUsername, String serviceType) {
        String to = getClientEmail(clientUsername);
        if (to == null) return;

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

        // Waze link
        String wazeLink = "https://waze.com/ul?q=" + encodedAddress + "&navigate=yes";

        // Google Maps fallback link
        String googleLink = "https://www.google.com/maps/dir/?api=1&destination=" + encodedAddress;

        // HTML email version with clickable buttons (more user-friendly)
        String subject = "Your Car Is Ready for Collection";

        String body = "Hi " + clientUsername + ",\n\n" +
                "Your " + serviceType + " has been successfully completed.\n\n" +
                "You can now come and collect your car at your convenience.\n\n" +
                "Get directions using one of the options below:\n\n" +
                "Waze: " + wazeLink + "\n" +
                "Google Maps: " + googleLink + "\n\n" +
                "If you have any questions, feel free to contact us.\n\n" +
                "Thank you for choosing our service!";

        emailService.sendEmailNotification(to, subject, body);
    }
}