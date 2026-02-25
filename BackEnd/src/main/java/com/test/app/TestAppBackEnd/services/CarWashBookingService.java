package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.CarWashBooking;
import com.test.app.TestAppBackEnd.repositories.CarWashBookingRepository;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CarWashBookingService {

    private final CarWashBookingRepository repository;
    private final EmailService emailService;
    private final UserProfileRepository userProfileRepository;
    private final ClientNotificationService notificationService;

    public CarWashBookingService(CarWashBookingRepository repository,
                                 EmailService emailService,
                                 UserProfileRepository userProfileRepository,
                                 ClientNotificationService notificationService) {
        this.repository = repository;
        this.emailService = emailService;
        this.userProfileRepository = userProfileRepository;
        this.notificationService = notificationService;
    }

    private String getClientEmail(String username) {
        if (username == null || username.isBlank()) return null;
        return userProfileRepository.findByUsername(username)
                .map(p -> p.getEmail())
                .filter(e -> e != null && !e.isBlank())
                .orElse(username.contains("@") ? username : null);
    }

    // ================= CREATE =================
    public CarWashBooking createBooking(CarWashBooking booking) {
        return repository.save(booking);
    }

    // ================= READ =================
    public List<CarWashBooking> getAllBookings() {
        return repository.findAll();
    }

    public List<CarWashBooking> getBookingsByClient(String clientUsername) {
        return repository.findByClientUsername(clientUsername);
    }

    public Optional<CarWashBooking> getBookingById(Long id) {
        return repository.findById(id);
    }

    // ================= UPDATE =================
    public CarWashBooking updateBooking(Long id, CarWashBooking updatedBooking) {
        return repository.findById(id).map(booking -> {
            // Check if status is changing
            boolean statusChanged = !booking.getStatus().equals(updatedBooking.getStatus());

            // Update all booking fields
            booking.setCarPlate(updatedBooking.getCarPlate());
            booking.setCarType(updatedBooking.getCarType());
            booking.setCarDescription(updatedBooking.getCarDescription());
            booking.setServiceTypes(updatedBooking.getServiceTypes());
            booking.setServicePrice(updatedBooking.getServicePrice());
            booking.setDate(updatedBooking.getDate());
            booking.setLocation(updatedBooking.getLocation());
            booking.setStatus(updatedBooking.getStatus());
            booking.setCarWashId(updatedBooking.getCarWashId());

            CarWashBooking savedBooking = repository.save(booking);

            // Send actionable notifications when status changes
            if (statusChanged) {
                String newStatus = booking.getStatus();
                if ("accepted".equalsIgnoreCase(newStatus)) {
                    notificationService.notifyRequestAccepted(
                            booking.getClientUsername(), booking.getId(), "Car Wash Booking");
                } else if ("completed".equalsIgnoreCase(newStatus)) {
                    notificationService.notifyServiceCompleted(
                            booking.getClientUsername(), booking.getId(), "car wash service");
                } else {
                    String to = getClientEmail(booking.getClientUsername());
                    if (to != null) {
                        String subject = "Booking Status Updated";
                        String body = "Hi " + booking.getClientUsername() + ",\n\n" +
                                "Your booking (ID: " + booking.getId() + ") status has been changed to: " +
                                newStatus + ".\n\nThank you!";
                        emailService.sendEmailNotification(to, subject, body);
                    }
                }
            }

            return savedBooking;
        }).orElseThrow(() -> new RuntimeException("Booking not found with id " + id));
    }

    // ================= DELETE =================
    public void deleteBooking(Long id) {
        repository.deleteById(id);
    }
}
