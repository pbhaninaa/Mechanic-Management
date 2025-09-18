package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.entities.JobApplication;
import com.test.app.TestAppBackEnd.services.JobApplicationService;
import com.test.app.TestAppBackEnd.ApiResponse;
import com.test.app.TestAppBackEnd.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job-applications")
@CrossOrigin(origins = "http://localhost:5173")
public class JobApplicationController {

    @Autowired
    private JobApplicationService service;

    @Autowired
    private JwtUtil jwtUtil;

    // ===== Helper methods for JWT =====
    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    private boolean isTokenValid(HttpServletRequest request) {
        String token = extractToken(request);
        return token != null && jwtUtil.isTokenValid(token);
    }

    // ================= GET ALL =================
    @GetMapping
    public ResponseEntity<ApiResponse<List<JobApplication>>> getAllApplications(HttpServletRequest request) {
        boolean tokenValid = isTokenValid(request);
        List<JobApplication> apps = service.getAllApplications();
        return ResponseEntity.ok(new ApiResponse<>("All job applications retrieved", 200, apps, tokenValid));
    }

    // ================= GET BY ID =================
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobApplication>> getApplication(@PathVariable Long id, HttpServletRequest request) {
        boolean tokenValid = isTokenValid(request);
        return service.getApplicationById(id)
                .map(app -> ResponseEntity.ok(new ApiResponse<>("Job application found", 200, app, tokenValid)))
                .orElse(ResponseEntity.status(404)
                        .body(new ApiResponse<>("Job application not found", 404, null, tokenValid)));
    }

    // ================= CREATE =================
    @PostMapping
    public ResponseEntity<ApiResponse<JobApplication>> createApplication(@RequestBody JobApplication application,
                                                                         HttpServletRequest request) {
        boolean tokenValid = isTokenValid(request);
        JobApplication created = service.createApplication(application);
        return ResponseEntity.status(201)
                .body(new ApiResponse<>("Job application created", 201, created, tokenValid));
    }

    // ================= UPDATE =================
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<JobApplication>> updateApplication(@PathVariable Long id,
                                                                         @RequestBody JobApplication application,
                                                                         HttpServletRequest request) {
        boolean tokenValid = isTokenValid(request);
        return service.getApplicationById(id)
                .map(existing -> {
                    application.setId(id);
                    JobApplication updated = service.updateApplication(application);
                    return ResponseEntity.ok(new ApiResponse<>("Job application updated", 200, updated, tokenValid));
                })
                .orElse(ResponseEntity.status(404)
                        .body(new ApiResponse<>("Job application not found", 404, null, tokenValid)));
    }

    // ================= DELETE =================
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteApplication(@PathVariable Long id, HttpServletRequest request) {
        boolean tokenValid = isTokenValid(request);
        service.deleteApplication(id);
        return ResponseEntity.ok(new ApiResponse<>("Job application deleted", 200, null, tokenValid));
    }
}
