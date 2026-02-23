package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.models.CommunicationRequest;
import com.test.app.TestAppBackEnd.services.CommunicationService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class CommunicationController {

    private final CommunicationService communicationService;

    public CommunicationController(CommunicationService communicationService) {
        this.communicationService = communicationService;
    }

    @PostMapping("/send-message")
    public String sendMessage(@RequestBody CommunicationRequest request) {
        communicationService.send(request);
        return "Message sent via " + request.getType();
    }
}