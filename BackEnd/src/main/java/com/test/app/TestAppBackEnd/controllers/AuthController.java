package com.test.app.TestAppBackEnd.controllers;

import com.test.app.TestAppBackEnd.security.JwtUtil;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import com.test.app.TestAppBackEnd.repositories.UserRepository;
import com.test.app.TestAppBackEnd.models.LoginRequest;
import com.test.app.TestAppBackEnd.models.LoginResponse;
import com.test.app.TestAppBackEnd.models.LoginUserDto;
import com.test.app.TestAppBackEnd.entities.User;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.models.ApiResponse;

import com.test.app.TestAppBackEnd.services.DevDataService;
import com.test.app.TestAppBackEnd.services.UserProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final AuthenticationManager authenticationManager;
    private UserProfileService userProfileService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final DevDataService devDataService;

    public AuthController(UserRepository userRepository,
                          UserProfileRepository userProfileRepository,
                          AuthenticationManager authenticationManager, UserProfileService userProfileService,
                          JwtUtil jwtUtil,
                          PasswordEncoder passwordEncoder,
                          DevDataService devDataService) {
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.authenticationManager = authenticationManager;
        this.userProfileService = userProfileService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
        this.devDataService = devDataService;
    }

    // ===== Helper method to get JWT from Authorization header =====
    private String extractToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null; // no token found
    }

    private boolean isTokenValid(HttpServletRequest request) {
        String token = extractToken(request);
        return token != null && jwtUtil.isTokenValid(token);
    }

    // ================= LOGIN =================
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> authenticateUser(@RequestBody LoginRequest request) {
        try {
            // Support both username and email - resolve to username for authentication
            String loginIdentifier = request.getUsername();
            if ((loginIdentifier == null || loginIdentifier.isBlank()) && request.getEmail() != null && !request.getEmail().isBlank()) {
                loginIdentifier = userProfileRepository.findByEmail(request.getEmail())
                        .map(UserProfile::getUsername)
                        .orElseThrow(() -> new UsernameNotFoundException("No account found with email: " + request.getEmail()));
            }
            if (loginIdentifier == null || loginIdentifier.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new ApiResponse<>("Username or email is required", 400, null));
            }

            Authentication auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginIdentifier, request.getPassword())
            );

            List<String> roles = auth.getAuthorities().stream()
                    .map(grantedAuthority -> grantedAuthority.getAuthority())
                    .toList();

            String token = jwtUtil.generateToken(auth.getName(), roles);
            Optional<UserProfile> profileOpt = userProfileRepository.findByUsername(auth.getName());
            boolean hasProfile = profileOpt.isPresent();
            LoginUserDto userDto = profileOpt.map(LoginUserDto::fromUserProfile).orElse(null);

            LoginResponse loginResponse = new LoginResponse(token, token, hasProfile, userDto);

            return ResponseEntity.ok(
                    new ApiResponse<>("Login successful", 200, loginResponse)
            );

        } catch (BadCredentialsException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Invalid username or password", 401, null));

        } catch (UsernameNotFoundException e) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>("User not found", 404, null));

        } catch (DisabledException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("User account is disabled", 401, null));

        } catch (AuthenticationException e) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Authentication failed", 401, null));

        } catch (Exception e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Internal server error", 500, null));
        }
    }



    // ================= CREATE USER =================
    @PostMapping
    public ResponseEntity<ApiResponse<User>> createUser(@RequestBody User user, HttpServletRequest request) {
        boolean tokenValid = isTokenValid(request);

        Optional<User> existingUser = userRepository.findByUsername(user.getUsername());
        if (existingUser.isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ApiResponse<>("Username already exists", 409, null));
        }

        User savedUser = userRepository.save(
                new User(user.getUsername(), passwordEncoder.encode(user.getPassword()))
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>("User created successfully", 201, savedUser));
    }

    // ================= GET ALL USERS =================
    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers(HttpServletRequest request) {
        boolean tokenValid = isTokenValid(request);

        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(new ApiResponse<>("All users retrieved", 200, users));
    }

    // ================= GET USER BY USERNAME =================
    @GetMapping("/{username}")
    public ResponseEntity<ApiResponse<User>> getUser(@PathVariable String username, HttpServletRequest request) {
        boolean tokenValid = isTokenValid(request);

        Optional<User> user = userRepository.findByUsername(username);
        if (user.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>("User not found", 404, null));
        }
        return ResponseEntity.ok(new ApiResponse<>("User retrieved", 200, user.get()));
    }

    // ================= UPDATE USER =================
    @PutMapping("/{username}")
    public ResponseEntity<ApiResponse<User>> updateUser(@PathVariable String username,
                                                        @RequestBody User updatedUser,
                                                        HttpServletRequest request) {
        boolean tokenValid = isTokenValid(request);

        Optional<User> existingUser = userRepository.findByUsername(username);
        if (existingUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>("User not found", 404, null));
        }

        User user = existingUser.get();
        user.setUsername(updatedUser.getUsername());
        /*String newPassword = updatedUser.getPassword();
        if (newPassword != null
                && !newPassword.isBlank()
                && !newPassword.startsWith("$2")) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }
*/
        String newPassword = updatedUser.getPassword();
        if (newPassword != null
                && !newPassword.isBlank()
                && !newPassword.startsWith("$2")) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }


        User savedUser = userRepository.save(user);

        return ResponseEntity.ok(new ApiResponse<>("User updated successfully", 200, savedUser));
    }

    // ================= DELETE USER =================
    @DeleteMapping("/{username}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String username, HttpServletRequest request) {

        boolean tokenValid = isTokenValid(request);

        Optional<User> existingUser = userRepository.findByUsername(username);
        if (existingUser.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ApiResponse<>("User not found", 404, null));
        }
        userProfileRepository.deleteByUsername(username);
        userRepository.delete(existingUser.get());
        return ResponseEntity.ok(new ApiResponse<>("User deleted successfully", 200, null));
    }
    // ================= DEV: RESET DB (ADMIN ONLY) =================
    @DeleteMapping("/reset-db")
    public ResponseEntity<ApiResponse<String>> resetDatabase(Authentication auth) {
        if (auth == null || auth.getName() == null || auth.getName().isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse<>("Authentication required", 401, null));
        }
        if (!userProfileService.isAdminByUsername(auth.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>("Admin access required", 403, null));
        }
        String currentUsername = auth.getName();
        devDataService.resetDatabaseExceptCurrentUser(currentUsername);
        return ResponseEntity.ok(new ApiResponse<>(
                "Database reset successfully. Kept user: " + currentUsername,
                HttpStatus.OK.value(),
                currentUsername
        ));
    }

    // ================= DELETE ALL USERS =================
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<Void>> deleteAllUsers(
            Authentication authentication) {

        String username = authentication.getName();
        boolean isAdmin = userProfileService.isAdminByUsername(username);

        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse<>("Only admins can delete all users", 403, null));
        }

        try {
            userProfileRepository.deleteAll();

            userRepository.deleteAll();

            return ResponseEntity.status(HttpStatus.NO_CONTENT)
                    .body(new ApiResponse<>("All users deleted successfully", 204, null));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse<>("Failed to delete users", 500, null));
        }
    }

}
