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
                .body(new ApiResponse<>("Mechanic request submitted successfully", HttpStatus.CREATED.value(), saved));
    }

    /** Update an existing mechanic request */
    @PutMapping
    public ResponseEntity<ApiResponse<MechanicRequest>> updateMechanicRequest(@RequestBody MechanicRequest request, Authentication auth) {
        String loggedInUsername = auth != null ? auth.getName() : null;
        return service.update(request, loggedInUsername)
                .map(r -> ResponseEntity.ok(new ApiResponse<>("Mechanic request updated successfully", HttpStatus.OK.value(), r)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("Mechanic request not found", HttpStatus.NOT_FOUND.value(), null)));
    }

    /** Get all mechanic requests - admin/overview */
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getAllMechanicRequests() {
        List<MechanicRequest> requests = service.getAll();
        return ResponseEntity.ok(new ApiResponse<>("Fetched all mechanic requests successfully", HttpStatus.OK.value(), requests));
    }

    /** Get available (unassigned, pending) jobs for mechanics to accept */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getAvailableJobsForMechanics() {
        List<MechanicRequest> requests = service.getAvailableJobsForMechanics();
        return ResponseEntity.ok(new ApiResponse<>("Fetched available jobs successfully", HttpStatus.OK.value(), requests));
    }

    /** Get mechanic request by ID */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MechanicRequest>> getMechanicRequestById(@PathVariable String id) {
        return service.getById(id)
                .map(r -> ResponseEntity.ok(new ApiResponse<>("Fetched mechanic request successfully", HttpStatus.OK.value(), r)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("Mechanic request not found with id: " + id, HttpStatus.NOT_FOUND.value(), null)));
    }

    /** Get mechanic requests by customer username (customer's job history) */
    @GetMapping("/user/username/{username}")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getMechanicRequestsByCustomerUsername(@PathVariable String username) {
        List<MechanicRequest> requests = service.getByUsername(username);
        return ResponseEntity.ok(new ApiResponse<>("Fetched mechanic requests for customer successfully", HttpStatus.OK.value(), requests));
    }

    /** Get mechanic requests assigned to a specific mechanic */
    @GetMapping("/mechanic/{mechanicId}")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getMechanicRequestsByMechanicId(@PathVariable String mechanicId) {
        List<MechanicRequest> requests = service.getByMechanicId(mechanicId);
        return ResponseEntity.ok(new ApiResponse<>("Fetched mechanic requests for mechanic successfully", HttpStatus.OK.value(), requests));
    }

    /** Mechanic accepts an available job */
    @PostMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<MechanicRequest>> acceptJob(@PathVariable String id, @RequestBody Map<String, String> body, Authentication auth) {
        String mechanicId = body != null && body.containsKey("mechanicId") ? body.get("mechanicId") : null;
        if (mechanicId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("mechanicId is required", HttpStatus.BAD_REQUEST.value(), null));
        }
        try {
            return service.acceptJob(id, mechanicId)
                    .map(r -> ResponseEntity.ok(new ApiResponse<>("Job accepted successfully", HttpStatus.OK.value(), r)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(new ApiResponse<>("Job not found", HttpStatus.NOT_FOUND.value(), null)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse<>(e.getMessage(), HttpStatus.CONFLICT.value(), null));
        }
    }

    /** Mechanic marks a job as completed */
    @PostMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<MechanicRequest>> completeJob(@PathVariable String id, @RequestBody Map<String, String> body, Authentication auth) {
        String mechanicId = body != null && body.containsKey("mechanicId") ? body.get("mechanicId") : null;
        if (mechanicId == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>("mechanicId is required", HttpStatus.BAD_REQUEST.value(), null));
        }
        String loggedInUsername = auth != null ? auth.getName() : null;
        try {
            return service.completeJob(id, mechanicId, loggedInUsername)
                    .map(r -> ResponseEntity.<ApiResponse<MechanicRequest>>ok(new ApiResponse<>("Job completed successfully", HttpStatus.OK.value(), r)))
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(new ApiResponse<>("Job not found", HttpStatus.NOT_FOUND.value(), null)));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>(e.getMessage(), HttpStatus.FORBIDDEN.value(), null));
        }
    }

    /** Delete a single mechanic request by ID */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMechanicRequestById(@PathVariable String id) {
        boolean deleted = service.deleteById(id);
        if (deleted) {
            return ResponseEntity.ok(new ApiResponse<>("Mechanic request deleted successfully", HttpStatus.OK.value(), null));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>("Mechanic request not found", HttpStatus.NOT_FOUND.value(), null));
    }

    /** Delete all mechanic requests for a customer (by username) */
    @DeleteMapping("/user/username/{username}")
    public ResponseEntity<ApiResponse<Void>> deleteMechanicRequestsByUsername(@PathVariable String username) {
        boolean deleted = service.deleteByUsername(username);
        if (deleted) {
            return ResponseEntity.ok(new ApiResponse<>("Mechanic requests deleted successfully", HttpStatus.OK.value(), null));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>("No mechanic requests found for user", HttpStatus.NOT_FOUND.value(), null));
    }
}
