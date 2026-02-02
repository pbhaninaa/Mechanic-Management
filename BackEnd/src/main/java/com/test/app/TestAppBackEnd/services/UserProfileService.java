package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.constants.Role;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserProfileService {

    private final UserProfileRepository repository;
    private final EmailService emailService;

    public UserProfileService(UserProfileRepository repository, EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    // ================= HELPER METHODS =================
    public boolean isAdminByUsername(String username) {
        return repository.findByUsername(username)
                .map(profile -> profile.getRoles().contains(Role.ADMIN))
                .orElse(false);
    }

    // ================= CREATE =================
    public Optional<UserProfile> createProfileForUser(String username, UserProfile profile) {
        if (repository.findByUsername(username).isPresent()) {
            return Optional.empty(); // Profile already exists
        }

        profile.setUsername(username);
        profile.setCreatedAt(LocalDateTime.now());
        profile.setUpdatedAt(LocalDateTime.now());

        UserProfile savedProfile = repository.save(profile);

        // Notify user by email
        sendEmailNotification(
                savedProfile.getEmail(),
                "Welcome to TestApp",
                "Hi " + savedProfile.getFirstName() + ",\n\n" +
                        "Your profile has been successfully created.\n\n" +
                        "Thank you for joining our platform!"
        );

        return Optional.of(savedProfile);
    }

    // ================= READ =================
    public Optional<UserProfile> getProfileByUsername(String username) {
        return repository.findByUsername(username);
    }

    public List<UserProfile> getProfilesByRole(Role role) {
        return repository.findByRoles(role);
    }

    public Iterable<UserProfile> getAllProfiles() {
        System.out.println("============================Fetching all profiles===============================");
        return repository.findAll();
    }

    // ================= UPDATE =================
    public Optional<UserProfile> updateProfile(String username, UserProfile updatedProfile, boolean isAdmin) {
        return repository.findByUsername(username)
                .map(existing -> {
                    boolean rolesChanged = isAdmin && !existing.getRoles().equals(updatedProfile.getRoles());

                    existing.setFirstName(updatedProfile.getFirstName());
                    existing.setLastName(updatedProfile.getLastName());
                    existing.setPhoneNumber(updatedProfile.getPhoneNumber());
                    existing.setAddress(updatedProfile.getAddress());
                    existing.setEmail(updatedProfile.getEmail());

                    if (isAdmin) {
                        existing.setRoles(updatedProfile.getRoles());
                    }

                    existing.setUpdatedAt(LocalDateTime.now());

                    UserProfile savedProfile = repository.save(existing);

                    // Notify user by email
                    String body = "Hi " + savedProfile.getFirstName() + ",\n\n" +
                            "Your profile has been updated successfully.";
                    if (rolesChanged) {
                        body += "\nYour roles have been changed to: " + savedProfile.getRoles();
                    }

                    sendEmailNotification(savedProfile.getEmail(), "Profile Update Notification", body);

                    return savedProfile;
                });
    }

    // ================= DELETE =================
    public boolean deleteProfile(String username) {
        return repository.findByUsername(username)
                .map(profile -> {
                    repository.delete(profile);

                    // Notify user by email
                    sendEmailNotification(
                            profile.getEmail(),
                            "Profile Deleted",
                            "Hi " + profile.getFirstName() + ",\n\n" +
                                    "Your profile has been deleted from our system."
                    );

                    return true;
                }).orElse(false);
    }

    // ================= EMAIL HELPER =================
    @Async
    public void sendEmailNotification(String to, String subject, String body) {
        try {
            emailService.sendEmail(
                    to,
                    "no-reply@testapp.com", // From address
                    subject,
                    body
            );
        } catch (Exception e) {
            System.out.println("Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    // ================= DEBUG =================
    public String toString(UserProfile profile) {
        return "============UserProfile{" +
                "username='" + profile.getUsername() + '\'' +
                ", firstName='" + profile.getFirstName() + '\'' +
                ", lastName='" + profile.getLastName() + '\'' +
                ", email='" + profile.getEmail() + '\'' +
                ", createdAt=" + profile.getCreatedAt() +
                ", roles=" + profile.getRoles() +
                "}==================";
    }
}
