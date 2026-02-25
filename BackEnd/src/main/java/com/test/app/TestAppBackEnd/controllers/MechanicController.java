package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.entities.MechanicRequest;
import com.test.app.TestAppBackEnd.services.MechanicRequestService;
import com.test.app.TestAppBackEnd.models.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
@RestController
@RequestMapping("/api/request-mechanic")
public class MechanicController {

    private final MechanicRequestService service;

    public MechanicController(MechanicRequestService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MechanicRequest>> create(@RequestBody MechanicRequest request) {
        MechanicRequest saved = service.create(request);
        return ResponseEntity.ok(new ApiResponse<>("Mechanic request submitted", 200, saved));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<Optional<MechanicRequest>>> update(@RequestBody MechanicRequest request) {
        Optional<MechanicRequest> toUpdate = service.update(request);
        return ResponseEntity.ok(new ApiResponse<>("Mechanic request updated", 200, toUpdate));
    }
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getAll() {
        List<MechanicRequest> requests = service.getAll();
        return ResponseEntity.ok(new ApiResponse<>("Fetched all mechanic requests", 200, requests));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MechanicRequest>> getById(@PathVariable Long id) {
        Optional<MechanicRequest> request = service.getById(id);
        return request.map(r ->
                        ResponseEntity.ok(new ApiResponse<>("Fetched mechanic request", 200, r)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/user/username/{username}")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getByUsername(@PathVariable String username) {
        List<MechanicRequest> requests = service.getByUsername(username);
        return ResponseEntity.ok(new ApiResponse<>("Fetched mechanic requests", 200, requests));
    }

    @DeleteMapping("/user/username/{username}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String username) {
        boolean deleted = service.deleteByUsername(username);
        if (deleted) {
            return ResponseEntity.ok(new ApiResponse<>("Mechanic request deleted", 200, null));
        }
        return ResponseEntity.notFound().build();
    }
}
