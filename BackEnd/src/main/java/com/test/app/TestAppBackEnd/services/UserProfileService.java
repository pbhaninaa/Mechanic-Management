package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.constants.Role;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UserProfileService {

    private final UserProfileRepository repository;

    public UserProfileService(UserProfileRepository repository) {
        this.repository = repository;
    }

    // ================= HELPER METHODS =================

    public boolean isAdminByUsername(String username) {
        return repository.findByUsername(username)
                .map(profile -> profile.getRoles().contains(Role.ADMIN))
                .orElse(false);
    }


    // ================= CREATE =================
    public Optional<UserProfile> createProfileForUser(String username, UserProfile profile) {
        System.out.println(toString(profile));
        if (repository.findByUsername(username).isPresent()) {
            return Optional.empty(); // Profile already exists
        }

        profile.setUsername(username);
        profile.setCreatedAt(LocalDateTime.now());
        profile.setUpdatedAt(LocalDateTime.now());

        return Optional.of(repository.save(profile));
    }
    public String toString(UserProfile profile) {
        return "============UserProfile{" +
                "username='" + profile.getUsername() + '\'' +
                ", firstName='" + profile.getFirstName() + '\'' +
                ", lastName='" + profile.getLastName() + '\'' +
                ", email='" + profile.getEmail() + '\'' +
                ", createdAt=" + profile.getCreatedAt() +'\'' +
                ", roles=" + profile.getRoles() +
                "}==================";
    }
    // ================= READ =================
    public Optional<UserProfile> getProfileByUsername(String username) {

        return repository.findByUsername(username);
    }

    public Iterable<UserProfile> getAllProfiles() {
        System.out.println("============================Fetching all profiles===============================");
        return repository.findAll();
    }

    // ================= UPDATE =================
    public Optional<UserProfile> updateProfile(String username, UserProfile updatedProfile) {


        return repository.findByUsername(username)
                .map(existing -> {
                    existing.setFirstName(updatedProfile.getFirstName());
                    existing.setLastName(updatedProfile.getLastName());
                    existing.setPhoneNumber(updatedProfile.getPhoneNumber());
                    existing.setAddress(updatedProfile.getAddress());
                    existing.setEmail(updatedProfile.getEmail());
                    existing.setRoles(updatedProfile.getRoles());
                    existing.setUpdatedAt(LocalDateTime.now());
                    return repository.save(existing);
                });
    }

    // ================= DELETE =================
    public boolean deleteProfile(String username) {


        return repository.findByUsername(username)
                .map(profile -> {
                    repository.delete(profile);
                    return true;
                }).orElse(false);
    }
}
