package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.CarWashBooking;
import com.test.app.TestAppBackEnd.entities.ProviderServiceOffering;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.repositories.CarWashBookingRepository;
import com.test.app.TestAppBackEnd.repositories.ProviderServiceOfferingRepository;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class CarWashBookingService {

    private final CarWashBookingRepository repository;
    private final EmailService emailService;
    private final UserProfileRepository userProfileRepository;
    private final ClientNotificationService notificationService;
    private final ProviderServiceOfferingRepository providerServiceOfferingRepository;

    public CarWashBookingService(CarWashBookingRepository repository,
                                 EmailService emailService,
                                 UserProfileRepository userProfileRepository,
                                 ClientNotificationService notificationService,
                                 ProviderServiceOfferingRepository providerServiceOfferingRepository) {
        this.repository = repository;
        this.emailService = emailService;
        this.userProfileRepository = userProfileRepository;
        this.notificationService = notificationService;
        this.providerServiceOfferingRepository = providerServiceOfferingRepository;
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

    /** Default max rows for list endpoints so tables load quickly. */
    private static final int DEFAULT_PAGE_SIZE = 50;

    // ================= READ =================
    public List<CarWashBooking> getAllBookings() {
        return repository.findAll(PageRequest.of(0, DEFAULT_PAGE_SIZE)).getContent();
    }

    public List<CarWashBooking> getAllBookings(String search) {
        if (search != null && !search.isBlank()) {
            return repository.findAllWithSearch(search.trim(), PageRequest.of(0, DEFAULT_PAGE_SIZE)).getContent();
        }
        return repository.findAll(PageRequest.of(0, DEFAULT_PAGE_SIZE)).getContent();
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

    /**
     * Ensures the provider offers all requested services for the given car type.
     * @throws IllegalStateException if any requested service is not offered by the provider for that car type
     */
    private void validateBookingServicesOfferedByProvider(String providerId, String carType, List<String> requestedServiceTypes) {
        if (requestedServiceTypes == null || requestedServiceTypes.isEmpty()) return;
        List<ProviderServiceOffering> offerings = providerServiceOfferingRepository.findByProviderId(providerId);
        List<ProviderServiceOffering> forCarType = offerings.stream()
                .filter(o -> offeringMatchesCarType(o.getSupportedCarTypes(), carType))
                .toList();
        Set<String> offeredNames = forCarType.stream()
                .map(ProviderServiceOffering::getServiceName)
                .filter(n -> n != null && !n.isBlank())
                .collect(Collectors.toSet());
        for (String requested : requestedServiceTypes) {
            if (requested == null || requested.isBlank()) continue;
            if (!offeredNames.contains(requested.trim())) {
                throw new IllegalStateException(
                        "Cannot accept this booking: you do not offer the service \"" + requested + "\" for this car type. Only accept bookings for services you offer.");
            }
        }
    }

    private boolean offeringMatchesCarType(String supportedCarTypes, String carType) {
        if (carType == null || carType.isBlank()) return true;
        if (supportedCarTypes == null || supportedCarTypes.isBlank()) return true;
        String[] parts = supportedCarTypes.split(",");
        for (String p : parts) {
            if (p != null && p.trim().equalsIgnoreCase(carType.trim())) return true;
        }
        return false;
    }

    /** Max concurrent paid/in-progress jobs = provider's numberOfEmployees (default 1 if not set). */
    private int getMaxPaidJobsForProvider(String providerProfileId) {
        return userProfileRepository.findById(providerProfileId)
                .map(UserProfile::getNumberOfEmployees)
                .filter(n -> n != null && n >= 1)
                .map(Long::intValue)
                .orElse(1);
    }

    // ================= UPDATE =================
    public CarWashBooking updateBooking(String id, CarWashBooking updatedBooking, String loggedInUsername) {
        return repository.findById(id).map(booking -> {
            // Block acceptance if provider already has paid/in-progress jobs >= numberOfEmployees (only when newly accepting)
            String newCarWashId = updatedBooking.getCarWashId();
            boolean isNewAcceptance = "accepted".equalsIgnoreCase(updatedBooking.getStatus())
                    && newCarWashId != null && !newCarWashId.isBlank()
                    && (booking.getCarWashId() == null || !booking.getCarWashId().equals(newCarWashId));
            if (isNewAcceptance) {
                int maxAllowed = getMaxPaidJobsForProvider(newCarWashId);
                long paidIncompleteCount = repository.countPaidIncompleteByCarWashId(newCarWashId);
                if (paidIncompleteCount >= maxAllowed) {
                    throw new IllegalStateException("Cannot accept more bookings, Complete some before accepting new ones.");
                }
                // Only allow acceptance if this provider offers all requested services for the booking's car type
                validateBookingServicesOfferedByProvider(newCarWashId, updatedBooking.getCarType(), updatedBooking.getServiceTypes());
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
                            booking.getClientUsername(), "https://mechanic-management-806bi8xrb-pbhanina-5058s-projects.vercel.app/my-washes", "Car Wash Booking", toJobDescription(booking));
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
