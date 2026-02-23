package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.models.EmailRequest;
import com.test.app.TestAppBackEnd.services.EmailService;
import jakarta.mail.MessagingException;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*") // allow frontend
public class CommunicationController {

    private final EmailService emailService;

    public CommunicationController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping("/send-email")
    public String sendEmail(@RequestBody EmailRequest request) throws MessagingException {
        emailService.sendEmail(
                request.getTo(),
                request.getFrom(),
                request.getSubject(),
                request.getBody()
        );
        return "Email sent successfully!";
    }
}
