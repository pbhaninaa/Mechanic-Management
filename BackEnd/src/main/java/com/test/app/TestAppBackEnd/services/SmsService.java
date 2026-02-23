package com.test.app.TestAppBackEnd.services;

import org.springframework.stereotype.Service;

@Service
public class SmsService {
    public void sendSms(String phoneNumber, String message) {
        // Integrate with Twilio, Africa's Talking, or any SMS gateway
        System.out.println("SMS to " + phoneNumber + ": " + message);
    }
}