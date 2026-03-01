package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.CarWashBooking;
import com.test.app.TestAppBackEnd.repositories.CarWashBookingRepository;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import com.test.app.TestAppBackEnd.util.DateFormatUtil;
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

    private String toJobDescription(CarWashBooking booking) {
        StringBuilder sb = new StringBuilder();
        if (booking.getServiceTypes() != null && !booking.getServiceTypes().isEmpty()) {
            sb.append(String.join(", ", booking.getServiceTypes()));
        }
        if (booking.getCarDescription() != null && !booking.getCarDescription().isBlank()) {
            if (sb.length() > 0) sb.append(" - ");
            sb.append(booking.getCarDescription());
        }
        if (booking.getCarPlate() != null && !booking.getCarPlate().isBlank()) {
            if (sb.length() > 0) sb.append(" ");
            sb.append("(").append(booking.getCarPlate()).append(")");
        }
        return sb.length() > 0 ? sb.toString() : "car wash booking";
    }

    // ================= CREATE =================
    public CarWashBooking createBooking(CarWashBooking booking) {

        return repository.save(booking);
    }

    // ================= READ =================
    public List<CarWashBooking> getAllBookings() {
        return repository.findAll();
    }

    public List<CarWashBooking> getAllBookings(String search) {
        if (search != null && !search.isBlank()) {
            return repository.findAllWithSearch(search.trim());
        }
        return repository.findAll();
    }

    public List<CarWashBooking> getBookingsByClient(String clientUsername) {
        return repository.findByClientUsername(clientUsername);
    }

    public List<CarWashBooking> getBookingsByClient(String clientUsername, String search) {
        if (search != null && !search.isBlank()) {
            return repository.findByClientUsernameWithSearch(clientUsername, search.trim());
        }
        return repository.findByClientUsername(clientUsername);
    }

    public List<CarWashBooking> getBookingsByCarWashId(String carWashId) {
        return repository.findByCarWashId(carWashId);
    }

    public List<CarWashBooking> getBookingsByCarWashId(String carWashId, String search) {
        if (search != null && !search.isBlank()) {
            return repository.findByCarWashIdWithSearch(carWashId, search.trim());
        }
        return repository.findByCarWashId(carWashId);
    }

    public List<CarWashBooking> getBookingsByClientAndDateRange(String clientUsername, String startDate, String endDate) {
        return repository.findByClientUsernameAndDateBetween(clientUsername, startDate, endDate);
    }

    /** Completed bookings only for a car wash provider within date range */
    public List<CarWashBooking> getCompletedBookingsByCarWashIdAndDateRange(String carWashId, String startDate, String endDate) {
        return repository.findByCarWashIdAndStatusCompletedAndDateBetween(carWashId, startDate, endDate);
    }

    public Optional<CarWashBooking> getBookingById(String id) {
        return repository.findById(id);
    }

    private static final int MAX_INCOMPLETE_JOBS = 5;

    // ================= UPDATE =================
    public CarWashBooking updateBooking(String id, CarWashBooking updatedBooking, String loggedInUsername) {
        return repository.findById(id).map(booking -> {
            // Block acceptance if car wash already has 5 incomplete jobs (only when newly accepting, not when updating own booking)
            String newCarWashId = updatedBooking.getCarWashId();
            boolean isNewAcceptance = "accepted".equalsIgnoreCase(updatedBooking.getStatus())
                    && newCarWashId != null && !newCarWashId.isBlank()
                    && (booking.getCarWashId() == null || !booking.getCarWashId().equals(newCarWashId));
            if (isNewAcceptance) {
                long paidIncompleteCount = repository.countPaidIncompleteByCarWashId(newCarWashId);
                if (paidIncompleteCount >= MAX_INCOMPLETE_JOBS) {
                    throw new IllegalStateException("Cannot accept more bookings. This car wash has " + paidIncompleteCount + " paid jobs not yet completed. Complete some before accepting new ones (max " + MAX_INCOMPLETE_JOBS + ").");
                }
            }
            // Update all booking fields (date saved as yyyy-MM-dd for range search)
             booking.setDate(updatedBooking.getDate());
            booking.setCarPlate(updatedBooking.getCarPlate());
            booking.setCarType(updatedBooking.getCarType());
            booking.setCarDescription(updatedBooking.getCarDescription());
            booking.setServiceTypes(updatedBooking.getServiceTypes());
            booking.setServicePrice(updatedBooking.getServicePrice());
            booking.setLocation(updatedBooking.getLocation());
            booking.setStatus(updatedBooking.getStatus());
            booking.setCarWashId(updatedBooking.getCarWashId());

            CarWashBooking savedBooking = repository.save(booking);

            // Send actionable notifications when status changes

                String newStatus = booking.getStatus();
                if ("accepted".equalsIgnoreCase(newStatus)) {
                    if(booking.isCallOutService())
                    notificationService.notifyServiceProvider(loggedInUsername,booking.getLocation());

                    notificationService.notifyRequestAccepted(
                            booking.getClientUsername(), "https://172.20.10.11:3000/my-washes", "Car Wash Booking", toJobDescription(booking));
                } else if ("completed".equalsIgnoreCase(newStatus)) {
                    notificationService.notifyServiceCompleted(
                            booking.getClientUsername(), loggedInUsername, "car wash service", toJobDescription(booking));
                } else {
                    String jobDesc = toJobDescription(booking);
                    String to = getClientEmail(booking.getClientUsername());
                    if (to != null) {
                        String subject = "Booking Status Updated";
                        String body = "Hi " + booking.getClientUsername() + ",\n\n" +
                                "Your " + jobDesc + " booking status has been changed to: " +
                                newStatus + ".\n\nThank you!";
                        emailService.sendEmailNotification(to, subject, body);
                    }
                }
            return savedBooking;
        }).orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }

    // ================= DELETE =================
    public void deleteBooking(String id) {
        repository.deleteById(id);
    }
}
