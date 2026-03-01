package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.entities.AdditionalFee;
import com.test.app.TestAppBackEnd.models.ApiResponse;
import com.test.app.TestAppBackEnd.services.AdditionalFeeService;
import com.test.app.TestAppBackEnd.services.UserProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/additional-fees")
public class AdditionalFeeController {

    private final AdditionalFeeService additionalFeeService;
    private final UserProfileService userProfileService;

    public AdditionalFeeController(AdditionalFeeService additionalFeeService, UserProfileService userProfileService) {
        this.additionalFeeService = additionalFeeService;
        this.userProfileService = userProfileService;
    }

    /** Anyone authenticated can read additional fees (used on booking/request forms). */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AdditionalFee>>> getAll(Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Unauthorized", HttpStatus.UNAUTHORIZED.value(), null));
        }
        List<AdditionalFee> list = additionalFeeService.findAll();
        return ResponseEntity.ok(new ApiResponse<>("OK", HttpStatus.OK.value(), list));
    }

    /** Admin only: create a new additional fee. */
    @PostMapping
    public ResponseEntity<ApiResponse<AdditionalFee>> create(@RequestBody AdditionalFee fee, Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Unauthorized", HttpStatus.UNAUTHORIZED.value(), null));
        }
        if (!userProfileService.isAdminByUsername(auth.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>("Admin access required", HttpStatus.FORBIDDEN.value(), null));
        }
        try {
            AdditionalFee saved = additionalFeeService.create(fee);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>("Additional fee created", HttpStatus.CREATED.value(), saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new ApiResponse<>(e.getMessage(), HttpStatus.BAD_REQUEST.value(), null));
        }
    }

    /** Admin only: update an additional fee. */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdditionalFee>> update(
            @PathVariable String id,
            @RequestBody AdditionalFee fee,
            Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Unauthorized", HttpStatus.UNAUTHORIZED.value(), null));
        }
        if (!userProfileService.isAdminByUsername(auth.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>("Admin access required", HttpStatus.FORBIDDEN.value(), null));
        }
        return additionalFeeService.update(id, fee)
                .map(updated -> ResponseEntity.ok(new ApiResponse<>("Updated", HttpStatus.OK.value(), updated)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("Additional fee not found", HttpStatus.NOT_FOUND.value(), null)));
    }

    /** Admin only: delete an additional fee. */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id, Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Unauthorized", HttpStatus.UNAUTHORIZED.value(), null));
        }
        if (!userProfileService.isAdminByUsername(auth.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>("Admin access required", HttpStatus.FORBIDDEN.value(), null));
        }
        if (additionalFeeService.delete(id)) {
            return ResponseEntity.ok(new ApiResponse<>("Deleted", HttpStatus.OK.value(), null));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>("Additional fee not found", HttpStatus.NOT_FOUND.value(), null));
    }
}
