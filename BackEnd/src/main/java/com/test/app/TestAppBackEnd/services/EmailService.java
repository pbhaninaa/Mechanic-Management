package com.test.app.TestAppBackEnd.services;


import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    /**
     * From address - must match authenticated SMTP account (e.g. Gmail) or be a verified alias.
     * Defaults to spring.mail.username if not set.
     */
    @Value("${app.mail.from:${spring.mail.username}}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendEmail(String to, String from, String subject, String body) throws MessagingException {
        sendEmail(to, from, subject, body, false);
    }

    public void sendEmail(String to, String from, String subject, String body, boolean html) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false);

        helper.setTo(to);
        helper.setFrom(from);
        helper.setSubject(subject);
        helper.setText(body, html);

        mailSender.send(message);
    }

    @Async
    public void sendEmailNotification(String toEmail, String subject, String body) {
        sendEmailNotification(toEmail, subject, body, false);
    }

    @Async
    public void sendEmailNotification(String toEmail, String subject, String body, boolean html) {
        try {
            sendEmail(toEmail, fromAddress, subject, body, html);
            log.info("Email sent successfully to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

}
