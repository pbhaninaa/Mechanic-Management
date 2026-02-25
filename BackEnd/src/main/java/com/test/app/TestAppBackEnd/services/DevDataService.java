package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.User;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Developer-only service to reset database. Keeps the logged-in user's account and profile.
 * Use with caution - for local/dev environments only.
 */
@Service
public class DevDataService {

    private final PaymentRepository paymentRepository;
    private final MechanicRequestRepository mechanicRequestRepository;
    private final CarWashBookingRepository carWashBookingRepository;
    private final RequestHistoryRepository requestHistoryRepository;
    private final UserProfileRepository userProfileRepository;
    private final UserRepository userRepository;

    public DevDataService(PaymentRepository paymentRepository,
                         MechanicRequestRepository mechanicRequestRepository,
                         CarWashBookingRepository carWashBookingRepository,
                         RequestHistoryRepository requestHistoryRepository,
                         UserProfileRepository userProfileRepository,
                         UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.mechanicRequestRepository = mechanicRequestRepository;
        this.carWashBookingRepository = carWashBookingRepository;
        this.requestHistoryRepository = requestHistoryRepository;
        this.userProfileRepository = userProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void resetDatabaseExceptCurrentUser(String currentUsername) {
        if (currentUsername == null || currentUsername.isBlank()) {
            throw new IllegalArgumentException("Current username is required");
        }

        // 1. Delete all transactional/business data
        paymentRepository.deleteAll();
        mechanicRequestRepository.deleteAll();
        carWashBookingRepository.deleteAll();
        requestHistoryRepository.deleteAll();

        // 2. Delete all UserProfiles except current user (case-insensitive match)
        List<UserProfile> profiles = userProfileRepository.findAll();
        for (UserProfile profile : profiles) {
            if (profile.getUsername() == null || !currentUsername.equalsIgnoreCase(profile.getUsername())) {
                userProfileRepository.delete(profile);
            }
        }

        // 3. Delete all Users except current user (case-insensitive match)
        List<User> users = userRepository.findAll();
        for (User user : users) {
            if (user.getUsername() == null || !currentUsername.equalsIgnoreCase(user.getUsername())) {
                userRepository.delete(user);
            }
        }
    }
}
