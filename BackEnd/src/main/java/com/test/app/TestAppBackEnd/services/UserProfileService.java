package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.constants.Role;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.models.ApiResponse;
import com.test.app.TestAppBackEnd.models.CommunicationRequest;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserProfileService {

    private final UserProfileRepository repository;
    private final CommunicationService communicationService;

    public UserProfileService(UserProfileRepository repository, CommunicationService communicationService) {
        this.repository = repository;

        this.communicationService = communicationService;
    }

    // ================= HELPER METHODS =================
    public boolean isAdminByUsername(String username) {
        return repository.findByUsername(username)
                .map(profile -> profile.getRoles().contains(Role.ADMIN))
                .orElse(false);
    }

    // ================= CREATE =================
    public UserProfile createProfileForUser( UserProfile profile) {

        if (repository.findByUsername(profile.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        if (repository.existsByEmail(profile.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        profile.setUsername(profile.getUsername());
        profile.setCreatedAt(LocalDateTime.now());
        profile.setUpdatedAt(LocalDateTime.now());

        UserProfile savedProfile = repository.save(profile);

        // Send notification
        CommunicationRequest request = new CommunicationRequest();
        request.setTo(savedProfile.getEmail());
        request.setSubject("Welcome to TestApp");
        request.setBody(
                "Hi " + savedProfile.getFirstName() + ",\n\n" +
                        "Your profile has been successfully created.\n\n" +
                        "Thank you for joining our platform!"
        );
        request.setType(CommunicationRequest.CommunicationType.EMAIL);

        communicationService.send(request);

        return savedProfile;
    }
    // ================= READ =================
    public Optional<UserProfile> getProfileByUsername(String username) {
        return repository.findByUsername(username);
    }

    public List<UserProfile> getProfilesByRole(Role role) {
        return repository.findByRoles(role);
    }

    public Iterable<UserProfile> getAllProfiles() {
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


                    CommunicationRequest request = new CommunicationRequest();
                    request.setTo(savedProfile.getEmail()); // can also be phone number or device token
                    request.setSubject("Profile Update Notification"); // mainly for email
                    request.setBody("Hi " + savedProfile.getFirstName() + ",\n\n" +
                            "Your profile has been updated successfully.");
                    request.setType(CommunicationRequest.CommunicationType.EMAIL);

                    return savedProfile;
                });
    }

    // ================= DELETE =================
    public boolean deleteProfile(String username) {
        return repository.findByUsername(username)
                .map(profile -> {
                    repository.delete(profile);


                    CommunicationRequest request = new CommunicationRequest();
                    request.setTo(profile.getEmail()); // can also be phone number or device token
                    request.setSubject("Profile Deleted"); // mainly for email
                    request.setBody("Hi " + profile.getFirstName() + ",\n\n" +
                            "Your profile has been deleted from our system.");
                    request.setType(CommunicationRequest.CommunicationType.EMAIL);
                    request.setType(CommunicationRequest.CommunicationType.EMAIL);
                    return true;
                }).orElse(false);
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
