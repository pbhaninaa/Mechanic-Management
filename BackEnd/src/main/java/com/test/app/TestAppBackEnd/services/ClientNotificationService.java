package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

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

    @Async
    public void notifyRequestAccepted(String username, long jobId, String serviceType) {
        String to = getClientEmail(username);
        if (to == null) return;
        String subject = "Your " + serviceType + " Request Has Been Accepted";
        String body = "Hi " + username + ",\n\n" +
                "Good news! Your request (ID: " + jobId + ") has been accepted.\n\n" +
                "Please complete your payment to confirm the service. You can do this from your Request History in the app.\n\n" +
                "Thank you!";
        emailService.sendEmailNotification(to, subject, body);
    }

    @Async
    public void notifyServiceCompleted(String username, long jobId, String serviceType) {
        String to = getClientEmail(username);
        if (to == null) return;
        String subject = "Your Car Is Ready for Collection";
        String body = "Hi " + username + ",\n\n" +
                "Your " + serviceType + " (ID: " + jobId + ") has been completed.\n\n" +
                "You can now come and collect your car. Thank you for choosing our service!\n\n" +
                "Thank you!";
        emailService.sendEmailNotification(to, subject, body);
    }
}
