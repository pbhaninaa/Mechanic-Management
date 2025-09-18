package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.entities.MechanicRequest;
import com.test.app.TestAppBackEnd.services.MechanicRequestService;
import com.test.app.TestAppBackEnd.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/request-mechanic")
public class RequestMechanicController {

    private final MechanicRequestService service;

    public RequestMechanicController(MechanicRequestService service) {
        this.service = service;
    }

    // Create new mechanic request
    @PostMapping
    public ResponseEntity<ApiResponse<MechanicRequest>> create(@RequestBody MechanicRequest request) {
        MechanicRequest saved = service.create(request);
        return ResponseEntity.ok(new ApiResponse<>("Mechanic request submitted", 200, saved, false));
    }
    // Update
    @PutMapping ResponseEntity<ApiResponse<Optional<MechanicRequest>>> update(@RequestBody MechanicRequest request) {
        Optional<MechanicRequest> toUpdate = service.updateByUsername(request);
        return ResponseEntity.ok(new ApiResponse<>("Mechanic request updated", 200, toUpdate, false));
    }

    // Get requests by username
    @GetMapping("/user/{username}")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getByUsername(@PathVariable String username) {
        List<MechanicRequest> requests = service.getByUsername(username);
        return ResponseEntity.ok(new ApiResponse<>("Fetched mechanic requests", 200, requests, false));
    }
    // ✅ Get request by ID
    @GetMapping("/user/{id}")
    public ResponseEntity<ApiResponse<MechanicRequest>> getById(@PathVariable Long id) {
        Optional<MechanicRequest> request = service.getById(id);
        return request.map(r ->
                        ResponseEntity.ok(new ApiResponse<>("Fetched mechanic request", 200, r, false)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Delete request by username
    @DeleteMapping("/user/{username}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String username) {
        boolean deleted = service.deleteByUsername(username);
        if (deleted) {
            return ResponseEntity.ok(new ApiResponse<>("Mechanic request deleted", 200, null, false));
        }
        return ResponseEntity.notFound().build();
    }
}
