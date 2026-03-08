package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.constants.Role;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.services.UserProfileService;
import com.test.app.TestAppBackEnd.models.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user-profile")
@CrossOrigin(origins = { "https://172.20.10.11:3000", "https://172.19.80.1:3000", "http://localhost:5173",
        "http://localhost:3000" })

public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    // ================= CREATE PROFILE =================
    @PostMapping
    public ResponseEntity<ApiResponse<UserProfile>> createProfile(
            @RequestBody UserProfile profile,
            Authentication authentication) {

        // Validation: MECHANIC and CARWASH require numberOfEmployees >= 1
        if (profile.getRoles() != null &&
                (profile.getRoles().contains(Role.MECHANIC) || profile.getRoles().contains(Role.CARWASH))) {
            if (profile.getNumberOfEmployees() == null || profile.getNumberOfEmployees() < 1) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse<>(
                                "Number of employees is required for CARWASH and MECHANIC providers and must be at least 1.",
                                HttpStatus.BAD_REQUEST.value(), null));
            }
        }

        try {
            UserProfile saved = userProfileService.createProfileForUser(profile);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(new ApiResponse<>("Profile created successfully", HttpStatus.CREATED.value(), saved));

        } catch (IllegalArgumentException ex) {
            // Validation errors (e.g. number of employees) -> 400; duplicate username/email -> 409
            boolean isValidationError = ex.getMessage() != null
                    && ex.getMessage().contains("Number of employees");
            HttpStatus status = isValidationError ? HttpStatus.BAD_REQUEST : HttpStatus.CONFLICT;
            return ResponseEntity.status(status)
                    .body(new ApiResponse<>(ex.getMessage(), status.value(), null));
        }
    }

    // ================= GET OWN PROFILE =================
    @GetMapping
    public ResponseEntity<ApiResponse<UserProfile>> getProfile(Authentication authentication) {

        String loggedInUsername = authentication.getName();
        System.out.println("[GET] Logged-in user: " + loggedInUsername);

        var response = userProfileService.getProfileByUsername(loggedInUsername)
                .map(profile -> ResponseEntity
                        .ok(new ApiResponse<>("Profile retrieved", HttpStatus.OK.value(), profile)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("Profile does not exist for this user", HttpStatus.NOT_FOUND.value(),
                                null)));

        System.out.println("[GET] Response ready for user: " + loggedInUsername);
        return response;
    }

    // Get user profiles by role
    @GetMapping("/role/{role}")
    public ResponseEntity<ApiResponse<Iterable<UserProfile>>> getProfilesByRole(
            @PathVariable String role,
            Authentication authentication) {

        String loggedInUsername = authentication.getName();
        System.out.println("[GET BY ROLE] Logged-in user: " + loggedInUsername);

        try {
            Role enumRole = Role.valueOf(role.toUpperCase()); // ensure case safety
            Iterable<UserProfile> profiles = userProfileService.getProfilesByRole(enumRole);

            if (profiles.iterator().hasNext()) {
                return ResponseEntity.ok(
                        new ApiResponse<>("Profiles retrieved successfully", HttpStatus.OK.value(), profiles));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("No profiles found for role: " + role, HttpStatus.NOT_FOUND.value(),
                                null));
            }

        } catch (IllegalArgumentException e) {
            // Role not valid in enum
            return ResponseEntity.badRequest()
                    .body(new ApiResponse<>("Invalid role: " + role, HttpStatus.BAD_REQUEST.value(), null));
        } catch (Exception e) {
            System.err.println("[ERROR] Failed to fetch profiles by role: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("An error occurred while fetching profiles",
                            HttpStatus.INTERNAL_SERVER_ERROR.value(), null));
        }
    }

    // ================= GET ALL PROFILES (ADMIN ONLY) =================
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<Iterable<UserProfile>>> getAllProfiles(
            Authentication authentication,
            @RequestParam(required = false) String search) {
        String loggedInUsername = authentication.getName();
        boolean isAdmin = userProfileService.isAdminByUsername(loggedInUsername);

        System.out.println("[GET ALL] Logged-in user: " + loggedInUsername + ", IsAdmin: " + isAdmin);

        Iterable<UserProfile> profiles = userProfileService.getAllProfiles(search);
        System.out.println("[GET ALL] Response ready with all profiles");
        return ResponseEntity.ok(new ApiResponse<>("All profiles retrieved", HttpStatus.OK.value(), profiles));
    }

    // ================= UPDATE OWN PROFILE =================
    @PutMapping
    public ResponseEntity<ApiResponse<UserProfile>> updateProfile(
            @RequestBody UserProfile updatedProfile,
            Authentication authentication) {

        String loggedInUsername = authentication.getName();
        boolean isAdmin = userProfileService.isAdminByUsername(loggedInUsername);

        System.out.println("[UPDATE] Logged-in user: " + loggedInUsername + ", IsAdmin: " + isAdmin);

        // Admin can update any profile; others can only update their own
        String targetUsername;
        if (isAdmin) {
            targetUsername = updatedProfile.getUsername();
            if (targetUsername == null || targetUsername.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse<>("Username is required when updating another user's profile",
                                HttpStatus.BAD_REQUEST.value(), null));
            }
        } else {
            // Non-admin: only own profile - use logged-in username, ignore body (avoids
            // case/mismatch bugs)
            targetUsername = loggedInUsername;
            updatedProfile.setUsername(loggedInUsername);
        }

        var response = userProfileService.updateProfile(
                targetUsername,
                updatedProfile,
                isAdmin)
                .map(profile -> ResponseEntity.ok(new ApiResponse<>("Profile updated", HttpStatus.OK.value(), profile)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(new ApiResponse<>("Profile does not exist for this user", HttpStatus.NOT_FOUND.value(),
                                null)));

        System.out.println("[UPDATE] Response ready for user: " + updatedProfile.getUsername());
        return response;
    }

    // ================= DELETE OWN PROFILE =================
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteProfile(
            @RequestBody UserProfile profile,
            Authentication authentication) {

        String loggedInUsername = authentication.getName();
        boolean isAdmin = userProfileService.isAdminByUsername(loggedInUsername);

        if (!loggedInUsername.equals(profile.getUsername()) && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>("Unauthorized to delete this profile", HttpStatus.FORBIDDEN.value(), null));
        }

        boolean deleted = userProfileService.deleteProfile(profile.getUsername());

        if (deleted) {
            return ResponseEntity.ok(new ApiResponse<>("Profile deleted successfully", HttpStatus.OK.value(), null));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>("Profile does not exist for this user", HttpStatus.NOT_FOUND.value(),
                            null));
        }
    }

}
