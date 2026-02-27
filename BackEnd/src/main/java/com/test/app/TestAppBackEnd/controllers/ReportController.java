package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.models.ApiResponse;
import com.test.app.TestAppBackEnd.models.ReportRequest;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import com.test.app.TestAppBackEnd.services.ReportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    private final ReportService reportService;
    private final UserProfileRepository userProfileRepository;

    public ReportController(ReportService reportService, UserProfileRepository userProfileRepository) {
        this.reportService = reportService;
        this.userProfileRepository = userProfileRepository;
    }

    private String currentUsername(Authentication auth) {
        return auth != null ? auth.getName() : null;
    }

    /** Current user's profile id (for service provider = mechanicId / carWashId). */
    private String currentUserProfileId(Authentication auth) {
        String username = currentUsername(auth);
        if (username == null) return null;
        return userProfileRepository.findByUsername(username).map(p -> p.getId()).orElse(null);
    }

    private boolean isCurrentUserProvider(String mechanicId, String carWashId, Authentication auth) {
        String profileId = currentUserProfileId(auth);
        if (profileId == null) return false;
        if (mechanicId != null && !mechanicId.isBlank() && mechanicId.equals(profileId)) return true;
        if (carWashId != null && !carWashId.isBlank() && carWashId.equals(profileId)) return true;
        return false;
    }

    // ---------- Car Wash Report ----------

    @GetMapping("/carwash/export")
    public ResponseEntity<byte[]> exportCarWashReport(
            @RequestParam String username,
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication auth) {
        String current = currentUsername(auth);
        if (current == null || (!current.equals(username) && !isAdmin(auth))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        byte[] csv = reportService.getCarWashReportCsv(username, startDate, endDate);
        String fileName = "car-wash-history-" + startDate + "-to-" + endDate + ".csv";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", fileName);
        return ResponseEntity.ok().headers(headers).body(csv);
    }

    @PostMapping("/carwash/email")
    public ResponseEntity<ApiResponse<Void>> emailCarWashReport(@RequestBody ReportRequest request, Authentication auth) {
        String current = currentUsername(auth);
        if (current == null || (request.getUsername() != null && !current.equals(request.getUsername()) && !isAdmin(auth))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>("Not allowed", HttpStatus.FORBIDDEN.value(), null));
        }
        String username = request.getUsername() != null ? request.getUsername() : current;
        if (request.getStartDate() == null || request.getEndDate() == null) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>("startDate and endDate are required", HttpStatus.BAD_REQUEST.value(), null));
        }
        reportService.sendCarWashReportToEmail(username, request.getStartDate(), request.getEndDate(), request.getEmail());
        return ResponseEntity.ok(new ApiResponse<>("Report will be sent to your email shortly.", HttpStatus.OK.value(), null));
    }

    // ---------- Mechanic Requests Report ----------

    @GetMapping("/mechanic-requests/export")
    public ResponseEntity<byte[]> exportMechanicRequestsReport(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String mechanicId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication auth) {
        String current = currentUsername(auth);
        if (current == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        boolean byMechanic = mechanicId != null && !mechanicId.isBlank();
        if (byMechanic && !mechanicId.equals(current) && !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        if (!byMechanic && (username == null || username.isBlank())) username = current;
        if (!byMechanic && !username.equals(current) && !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        byte[] csv = byMechanic
                ? reportService.getMechanicRequestsReportCsvByMechanic(mechanicId, startDate, endDate)
                : reportService.getMechanicRequestsReportCsvByUser(username, startDate, endDate);
        String fileName = "mechanic-requests-history-" + startDate + "-to-" + endDate + ".csv";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", fileName);
        return ResponseEntity.ok().headers(headers).body(csv);
    }

    @PostMapping("/mechanic-requests/email")
    public ResponseEntity<ApiResponse<Void>> emailMechanicRequestsReport(@RequestBody ReportRequest request, Authentication auth) {
        String current = currentUsername(auth);
        if (current == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Unauthorized", HttpStatus.UNAUTHORIZED.value(), null));
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>("startDate and endDate are required", HttpStatus.BAD_REQUEST.value(), null));
        }
        String username = request.getUsername() != null ? request.getUsername() : current;
        String mechanicId = request.getMechanicId();
        boolean byMechanic = mechanicId != null && !mechanicId.isBlank();
        if (byMechanic && !mechanicId.equals(current) && !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>("Not allowed", HttpStatus.FORBIDDEN.value(), null));
        }
        if (!byMechanic && !username.equals(current) && !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>("Not allowed", HttpStatus.FORBIDDEN.value(), null));
        }
        reportService.sendMechanicRequestsReportToEmail(username, mechanicId, request.getStartDate(), request.getEndDate(), request.getEmail());
        return ResponseEntity.ok(new ApiResponse<>("Report will be sent to your email shortly.", HttpStatus.OK.value(), null));
    }

    // ---------- Earnings Report (service provider only) ----------

    @GetMapping("/earnings/export")
    public ResponseEntity<byte[]> exportEarningsReport(
            @RequestParam(required = false) String mechanicId,
            @RequestParam(required = false) String carWashId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication auth) {
        if (currentUsername(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (!isCurrentUserProvider(mechanicId, carWashId, auth) && !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        byte[] csv = reportService.getEarningsReportCsv(mechanicId, carWashId, startDate, endDate);
        String fileName = "earnings-" + startDate + "-to-" + endDate + ".csv";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", fileName);
        return ResponseEntity.ok().headers(headers).body(csv);
    }

    @PostMapping("/earnings/email")
    public ResponseEntity<ApiResponse<Void>> emailEarningsReport(@RequestBody ReportRequest request, Authentication auth) {
        if (currentUsername(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse<>("Unauthorized", HttpStatus.UNAUTHORIZED.value(), null));
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            return ResponseEntity.badRequest().body(new ApiResponse<>("startDate and endDate are required", HttpStatus.BAD_REQUEST.value(), null));
        }
        if (!isCurrentUserProvider(request.getMechanicId(), request.getCarWashId(), auth) && !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse<>("Not allowed", HttpStatus.FORBIDDEN.value(), null));
        }
        reportService.sendEarningsReportToEmail(request.getMechanicId(), request.getCarWashId(), request.getStartDate(), request.getEndDate(), request.getEmail());
        return ResponseEntity.ok(new ApiResponse<>("Report will be sent to your email shortly.", HttpStatus.OK.value(), null));
    }

    // ---------- Completed Jobs Report (service provider only) ----------

    @GetMapping("/completed-jobs/export")
    public ResponseEntity<byte[]> exportCompletedJobsReport(
            @RequestParam(required = false) String mechanicId,
            @RequestParam(required = false) String carWashId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication auth) {
        if (currentUsername(auth) == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        if (!isCurrentUserProvider(mechanicId, carWashId, auth) && !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        byte[] csv = reportService.getCompletedJobsReportCsv(mechanicId, carWashId, startDate, endDate);
        String fileName = "completed-jobs-" + startDate + "-to-" + endDate + ".csv";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", fileName);
        return ResponseEntity.ok().headers(headers).body(csv);
    }

    @PostMapping("/completed-jobs/email")
    public ResponseEntity<ApiResponse<Void>> emailCompletedJobsReport(@RequestBody ReportRequest request, Authentication auth) {
        if (currentUsername(auth) == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse<>("Unauthorized", HttpStatus.UNAUTHORIZED.value(), null));
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            return ResponseEntity.badRequest().body(new ApiResponse<>("startDate and endDate are required", HttpStatus.BAD_REQUEST.value(), null));
        }
        if (!isCurrentUserProvider(request.getMechanicId(), request.getCarWashId(), auth) && !isAdmin(auth)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiResponse<>("Not allowed", HttpStatus.FORBIDDEN.value(), null));
        }
        reportService.sendCompletedJobsReportToEmail(request.getMechanicId(), request.getCarWashId(), request.getStartDate(), request.getEndDate(), request.getEmail());
        return ResponseEntity.ok(new ApiResponse<>("Report will be sent to your email shortly.", HttpStatus.OK.value(), null));
    }

    private boolean isAdmin(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()) || "ADMIN".equals(a.getAuthority()));
    }
}
