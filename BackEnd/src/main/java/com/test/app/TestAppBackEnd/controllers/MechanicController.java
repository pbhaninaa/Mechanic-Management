package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.entities.MechanicRequest;
import com.test.app.TestAppBackEnd.services.MechanicRequestService;
import com.test.app.TestAppBackEnd.models.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/request-mechanic")
@CrossOrigin(origins = "*")
public class MechanicController {

    private final MechanicRequestService service;

    public MechanicController(MechanicRequestService service) {
        this.service = service;
    }

    /** Create a new mechanic request (job) - used by customers */
    @PostMapping
    public ResponseEntity<ApiResponse<MechanicRequest>> createMechanicRequest(@RequestBody MechanicRequest request) {
        MechanicRequest saved = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("Mechanic request submitted successfully", 201, saved));
    }

    /** Update an existing mechanic request */
    @PutMapping
    public ResponseEntity<ApiResponse<MechanicRequest>> updateMechanicRequest(@RequestBody MechanicRequest request, Authentication auth) {
        String loggedInUsername = auth != null ? auth.getName() : null;
        return service.update(request, loggedInUsername)
                .map(r -> ResponseEntity.ok(new ApiResponse<>("Mechanic request updated successfully", 200, r)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("Mechanic request not found", 404, null)));
    }

    /** Get all mechanic requests - admin/overview */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getAllMechanicRequests() {
        List<MechanicRequest> requests = service.getAll();
        return ResponseEntity.ok(new ApiResponse<>("Fetched all mechanic requests successfully", 200, requests));
    }

    /** Get available (unassigned, pending) jobs for mechanics to accept */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getAvailableJobsForMechanics() {
        List<MechanicRequest> requests = service.getAvailableJobsForMechanics();
        return ResponseEntity.ok(new ApiResponse<>("Fetched available jobs successfully", 200, requests));
    }

    /** Get mechanic request by ID */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MechanicRequest>> getMechanicRequestById(@PathVariable Long id) {
        return service.getById(id)
                .map(r -> ResponseEntity.ok(new ApiResponse<>("Fetched mechanic request successfully", 200, r)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("Mechanic request not found with id: " + id, 404, null)));
    }

    /** Get mechanic requests by customer username (customer's job history) */
    @GetMapping("/user/username/{username}")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getMechanicRequestsByCustomerUsername(@PathVariable String username) {
        List<MechanicRequest> requests = service.getByUsername(username);
        return ResponseEntity.ok(new ApiResponse<>("Fetched mechanic requests for customer successfully", 200, requests));
    }

    /** Get mechanic requests assigned to a specific mechanic */
    @GetMapping("/mechanic/{mechanicId}")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getMechanicRequestsByMechanicId(@PathVariable Long mechanicId) {
        List<MechanicRequest> requests = service.getByMechanicId(mechanicId);
        return ResponseEntity.ok(new ApiResponse<>("Fetched mechanic requests for mechanic successfully", 200, requests));
    }

    /** Mechanic accepts an available job */
    @PostMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<MechanicRequest>> acceptJob(@PathVariable Long id, @RequestBody Map<String, Long> body, Authentication auth) {
        Long mechanicId = body != null && body.containsKey("mechanicId") ? body.get("mechanicId") : null;
        if (mechanicId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("mechanicId is required", 400, null));
        }
        try {
            return service.acceptJob(id, mechanicId)
                    .map(r -> ResponseEntity.ok(new ApiResponse<>("Job accepted successfully", 200, r)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(new ApiResponse<>("Job not found", 404, null)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse<>(e.getMessage(), 409, null));
        }
    }

    /** Mechanic marks a job as completed */
    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<MechanicRequest>> completeJob(@PathVariable Long id, @RequestBody Map<String, Long> body, Authentication auth) {
        Long mechanicId = body != null && body.containsKey("mechanicId") ? body.get("mechanicId") : null;
        if (mechanicId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("mechanicId is required", 400, null));
        }
        String loggedInUsername = auth != null ? auth.getName() : null;
        try {
            return service.completeJob(id, mechanicId, loggedInUsername)
                    .map(r -> ResponseEntity.ok(new ApiResponse<>("Job completed successfully", 200, r)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(new ApiResponse<>("Job not found", 404, null)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(e.getMessage(), 403, null));
        }
    }

    /** Delete a single mechanic request by ID */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMechanicRequestById(@PathVariable Long id) {
        boolean deleted = service.deleteById(id);
        if (deleted) {
            return ResponseEntity.ok(new ApiResponse<>("Mechanic request deleted successfully", 200, null));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>("Mechanic request not found", 404, null));
    }

    /** Delete all mechanic requests for a customer (by username) */
    @DeleteMapping("/user/username/{username}")
    public ResponseEntity<ApiResponse<Void>> deleteMechanicRequestsByUsername(@PathVariable String username) {
        boolean deleted = service.deleteByUsername(username);
        if (deleted) {
            return ResponseEntity.ok(new ApiResponse<>("Mechanic requests deleted successfully", 200, null));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>("No mechanic requests found for user", 404, null));
    }
}
