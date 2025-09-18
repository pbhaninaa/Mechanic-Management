package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.ApiResponse;
import com.test.app.TestAppBackEnd.entities.RequestHistory;
import com.test.app.TestAppBackEnd.entities.MechanicRequest;
import com.test.app.TestAppBackEnd.services.RequestHistoryService;
import com.test.app.TestAppBackEnd.services.MechanicRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/request-history")
public class RequestHistoryController {

    private final RequestHistoryService requestHistoryService;
    private final MechanicRequestService mechanicRequestService;

    public RequestHistoryController(RequestHistoryService requestHistoryService, MechanicRequestService mechanicRequestService) {
        this.requestHistoryService = requestHistoryService;
        this.mechanicRequestService = mechanicRequestService;
    }

    // Get all histories
    @GetMapping
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getAll() {
        List<MechanicRequest> histories = mechanicRequestService.getAll();
        return ResponseEntity.ok(
                new ApiResponse<>("Fetched all request histories", HttpStatus.OK.value(), histories, false)
        );
    }

    // Get by Username
    @GetMapping("/user/{username}")
    public ResponseEntity<ApiResponse<List<MechanicRequest>>> getByUsername(@PathVariable String username) {
        List<MechanicRequest> histories = mechanicRequestService.getByUsername(username);

        if (histories.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new ApiResponse<>("No request history found for user: " + username, HttpStatus.NOT_FOUND.value(), histories, false)
            );
        }

        return ResponseEntity.ok(
                new ApiResponse<>("Fetched request history for user: " + username, HttpStatus.OK.value(), histories, false)
        );
    }

    // Create
    @PostMapping
    public ResponseEntity<ApiResponse<RequestHistory>> create(@RequestBody RequestHistory requestHistory) {
        RequestHistory saved = requestHistoryService.save(requestHistory);
        return ResponseEntity.status(HttpStatus.CREATED).body(
                new ApiResponse<>("Request history created", HttpStatus.CREATED.value(), saved, false)
        );
    }

    // Update by Username
    @PutMapping("/user/{username}")
    public ResponseEntity<ApiResponse<RequestHistory>> update(@PathVariable String username, @RequestBody RequestHistory updatedRequest) {
        List<RequestHistory> existingHistories = requestHistoryService.getByUsername(username);

        if (existingHistories.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new ApiResponse<>("No request history found for user: " + username, HttpStatus.NOT_FOUND.value(), null, false)
            );
        }

        // For simplicity, update the first entry (or you can update all if needed)
        RequestHistory existing = existingHistories.get(0);
        existing.setDescription(updatedRequest.getDescription());
        existing.setLocation(updatedRequest.getLocation());
        existing.setDate(updatedRequest.getDate());
        existing.setStatus(updatedRequest.getStatus());

        RequestHistory saved = requestHistoryService.save(existing);

        return ResponseEntity.ok(
                new ApiResponse<>("Request history updated successfully for user: " + username, HttpStatus.OK.value(), saved, false)
        );
    }

    // Delete by Username
    @DeleteMapping("/user/{username}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String username) {
        List<RequestHistory> existingHistories = requestHistoryService.getByUsername(username);

        if (existingHistories.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    new ApiResponse<>("No request history found for user: " + username, HttpStatus.NOT_FOUND.value(), null, false)
            );
        }

        existingHistories.forEach(history -> requestHistoryService.delete(history.getId()));

        return ResponseEntity.ok(
                new ApiResponse<>("All request histories deleted for user: " + username, HttpStatus.OK.value(), null, false)
        );
    }
}
