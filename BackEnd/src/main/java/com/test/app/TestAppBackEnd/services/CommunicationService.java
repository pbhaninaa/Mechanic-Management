package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.models.CommunicationRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class CommunicationService {

    private final EmailService emailService;
    private final SmsService smsService; // We'll create this
    private final WhatsAppService whatsappService; // Optional

    public CommunicationService(EmailService emailService,
                                SmsService smsService,
                                WhatsAppService whatsappService) {
        this.emailService = emailService;
        this.smsService = smsService;
        this.whatsappService = whatsappService;
    }

    @Async
    public void send(CommunicationRequest request) {
        switch (request.getType()) {
            case EMAIL:
                try {
                    emailService.sendEmailNotification(request.getTo(), request.getSubject(), request.getBody());
                } catch (Exception e) {
                    System.out.println("Email failed: " + e.getMessage());
                }
                break;
            case SMS:
                smsService.sendSms(request.getTo(), request.getBody());
                break;
            case WHATSAPP:
                whatsappService.sendMessage(request.getTo(), request.getBody());
                break;

            default:
                throw new IllegalArgumentException("Unsupported communication type");
        }
    }
}