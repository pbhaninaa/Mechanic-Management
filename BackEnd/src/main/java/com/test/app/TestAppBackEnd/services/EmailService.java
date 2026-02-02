package com.test.app.TestAppBackEnd.services;


import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(String to, String from, String subject, String body) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false);

        helper.setTo(to);
        helper.setFrom(from);
        helper.setSubject(subject);
        helper.setText(body, false);

        mailSender.send(message);
    }
    // ================= EMAIL HELPER =================
    @Async
    public void sendEmailNotification(String toUsernameOrEmail, String subject, String body) {
        try {
            // Assuming username is the email; adapt if you store emails separately
           sendEmail(
                    toUsernameOrEmail,
                    "no-reply@testapp.com",
                    subject,
                    body
            );
        } catch (Exception e) {
            System.out.println("Failed to send email to " + toUsernameOrEmail + ": " + e.getMessage());
        }
    }

}
