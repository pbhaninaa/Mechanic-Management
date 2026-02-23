package com.test.app.TestAppBackEnd.services;

import org.springframework.stereotype.Service;

@Service
public class WhatsAppService {
    public void sendMessage(String to, String message) {
        // Integrate with Twilio WhatsApp API or WhatsApp Cloud API
        System.out.println("WhatsApp to " + to + ": " + message);
    }
}