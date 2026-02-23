package com.test.app.TestAppBackEnd.models;


public class CommunicationRequest {
    private String to;        // Email, phone number, or username
    private String subject;   // Optional, mainly for email
    private String body;      // Message body
    private CommunicationType type;

    public enum CommunicationType {
        EMAIL,
        SMS,
        WHATSAPP,
        PUSH_NOTIFICATION
    }

    // Getters and Setters
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public CommunicationType getType() { return type; }
    public void setType(CommunicationType type) { this.type = type; }
}