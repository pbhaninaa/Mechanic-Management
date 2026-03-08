package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.MechanicRequest;
import com.test.app.TestAppBackEnd.entities.ProviderServiceOffering;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import com.test.app.TestAppBackEnd.repositories.MechanicRequestRepository;
import com.test.app.TestAppBackEnd.repositories.ProviderServiceOfferingRepository;
import com.test.app.TestAppBackEnd.repositories.UserProfileRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MechanicRequestService {

    private final MechanicRequestRepository repository;
    private final UserProfileRepository userProfileRepository;
    private final EmailService emailService;
    private final ClientNotificationService notificationService;
    private final ProviderServiceOfferingRepository providerServiceOfferingRepository;

    public MechanicRequestService(MechanicRequestRepository repository,
                                 UserProfileRepository userProfileRepository,
                                 EmailService emailService,
                                 ClientNotificationService notificationService,
                                 ProviderServiceOfferingRepository providerServiceOfferingRepository) {
        this.repository = repository;
        this.userProfileRepository = userProfileRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.providerServiceOfferingRepository = providerServiceOfferingRepository;
    }

    private void enrichWithPhoneNumber(MechanicRequest request) {
        if (request.getUsername() != null) {
            String phone = userProfileRepository.findByUsername(request.getUsername())
                    .map(UserProfile::getPhoneNumber)
                    .orElse(null);
            request.setPhoneNumber(phone != null && !phone.isBlank() ? phone : null);
        }
    }

    /** Batch-fetch profiles by usernames (one query) and set phone numbers on requests. Avoids N+1. */
    private List<MechanicRequest> enrichWithPhoneNumbers(List<MechanicRequest> requests) {
        if (requests == null || requests.isEmpty()) return requests;
        Set<String> usernames = requests.stream()
                .map(MechanicRequest::getUsername)
                .filter(u -> u != null && !u.isBlank())
                .collect(Collectors.toSet());
        if (usernames.isEmpty()) return requests;
        List<UserProfile> profiles = userProfileRepository.findByUsernameIn(usernames);
        Map<String, String> usernameToPhone = profiles.stream()
                .filter(p -> p.getPhoneNumber() != null && !p.getPhoneNumber().isBlank())
                .collect(Collectors.toMap(UserProfile::getUsername, UserProfile::getPhoneNumber, (a, b) -> a));
        for (MechanicRequest r : requests) {
            if (r.getUsername() != null) {
                String phone = usernameToPhone.get(r.getUsername());
                r.setPhoneNumber(phone);
            }
        }
        return requests;
    }

    /** Resolve client email from username for notifications */
    private String getClientEmail(String username) {
        if (username == null || username.isBlank()) return null;
        return userProfileRepository.findByUsername(username)
                .map(p -> p.getEmail())
                .filter(e -> e != null && !e.isBlank())
                .orElse(username.contains("@") ? username : null);
    }

    // ================= CREATE =================
    public MechanicRequest create(MechanicRequest request) {
        return repository.save(request);
    }

    /** Default max rows for list endpoints so tables load quickly. */
    private static final int DEFAULT_PAGE_SIZE = 50;

    // ================= READ =================
    public List<MechanicRequest> getAll() {
        List<MechanicRequest> all = repository.findAll(PageRequest.of(0, DEFAULT_PAGE_SIZE)).getContent();
        return enrichWithPhoneNumbers(all);
    }

    public List<MechanicRequest> getAll(String search) {
        List<MechanicRequest> list = (search != null && !search.isBlank())
                ? repository.findAllWithSearch(search.trim(), PageRequest.of(0, DEFAULT_PAGE_SIZE)).getContent()
                : repository.findAll(PageRequest.of(0, DEFAULT_PAGE_SIZE)).getContent();
        return enrichWithPhoneNumbers(list);
    }

    public Optional<MechanicRequest> getById(String id) {
        return repository.findById(id).map(r -> {
            enrichWithPhoneNumber(r);
            return r;
        });
    }

    public List<MechanicRequest> getByUsername(String username) {
        return enrichWithPhoneNumbers(repository.findByUsername(username));
    }

    public List<MechanicRequest> getByUsername(String username, String search) {
        List<MechanicRequest> list = (search != null && !search.isBlank())
                ? repository.findByUsernameWithSearch(username, search.trim())
                : repository.findByUsername(username);
        return enrichWithPhoneNumbers(list);
    }

    public List<MechanicRequest> getByMechanicId(String mechanicId) {
        return enrichWithPhoneNumbers(repository.findByMechanicId(mechanicId));
    }

    public List<MechanicRequest> getByMechanicId(String mechanicId, String search) {
        List<MechanicRequest> list = (search != null && !search.isBlank())
                ? repository.findByMechanicIdWithSearch(mechanicId, search.trim())
                : repository.findByMechanicId(mechanicId);
        return enrichWithPhoneNumbers(list);
    }

    public List<MechanicRequest> getByUsernameAndDateRange(String username, LocalDate startDate, LocalDate endDate) {
        return enrichWithPhoneNumbers(repository.findByUsernameAndDateBetweenOrderByDateDesc(username, startDate, endDate));
    }

    public List<MechanicRequest> getByMechanicIdAndDateRange(String mechanicId, LocalDate startDate, LocalDate endDate) {
        return enrichWithPhoneNumbers(repository.findByMechanicIdAndDateBetweenOrderByDateDesc(mechanicId, startDate, endDate));
    }

    /** Completed jobs only for a mechanic within date range */
    public List<MechanicRequest> getCompletedJobsByMechanicIdAndDateRange(String mechanicId, LocalDate startDate, LocalDate endDate) {
        return enrichWithPhoneNumbers(repository.findByMechanicIdAndStatusAndDateBetweenOrderByDateDesc(mechanicId, "completed", startDate, endDate));
    }

    // ================= SPECIAL QUERIES =================
    public List<MechanicRequest> getAvailableJobsForMechanics() {
        return enrichWithPhoneNumbers(repository.findByStatusAndMechanicIdIsNull("pending"));
    }

    /**
     * Ensures the mechanic offers all requested services (parsed from description) for the given car brand.
     * @throws IllegalStateException if any requested service is not offered by the mechanic for that car
     */
    private void validateRequestServicesOfferedByMechanic(String mechanicId, String carType, String description) {
        if (description == null || description.isBlank()) return;
        List<String> requestedServices = Arrays.stream(description.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();
        if (requestedServices.isEmpty()) return;
        List<ProviderServiceOffering> offerings = providerServiceOfferingRepository.findByProviderId(mechanicId);
        List<ProviderServiceOffering> forCar = offerings.stream()
                .filter(o -> offeringMatchesCarBrand(o.getCarBrand(), carType))
                .toList();
        Set<String> offeredNames = forCar.stream()
                .map(ProviderServiceOffering::getServiceName)
                .filter(n -> n != null && !n.isBlank())
                .collect(Collectors.toSet());
        for (String requested : requestedServices) {
            if (!offeredNames.contains(requested)) {
                throw new IllegalStateException(
                        "Cannot accept this job: you do not offer the service \"" + requested + "\" for this car brand. Only accept jobs for services you offer.");
            }
        }
    }

    private boolean offeringMatchesCarBrand(String offeringCarBrand, String requestCarType) {
        if (requestCarType == null || requestCarType.isBlank()) return true;
        if (offeringCarBrand == null || offeringCarBrand.isBlank()) return true;
        return offeringCarBrand.trim().equalsIgnoreCase(requestCarType.trim());
    }

    /** Max concurrent paid/in-progress jobs = provider's numberOfEmployees (default 1 if not set). */
    private int getMaxPaidJobsForMechanic(String mechanicProfileId) {
        return userProfileRepository.findById(mechanicProfileId)
                .map(UserProfile::getNumberOfEmployees)
                .filter(n -> n != null && n >= 1)
                .map(Long::intValue)
                .orElse(1);
    }

    public Optional<MechanicRequest> acceptJob(String requestId, String mechanicId) {
        Optional<MechanicRequest> opt = repository.findById(requestId);
        if (opt.isEmpty()) return Optional.empty();
        MechanicRequest req = opt.get();
        if (req.getMechanicId() != null) {
            throw new IllegalStateException("Job is already assigned to another mechanic");
        }
        if (!"pending".equals(req.getStatus())) {
            throw new IllegalStateException("Only pending jobs can be accepted");
        }
        int maxAllowed = getMaxPaidJobsForMechanic(mechanicId);
        long paidIncompleteCount = repository.countPaidIncompleteByMechanicId(mechanicId);
        if (paidIncompleteCount >= maxAllowed) {
            throw new IllegalStateException("You cannot accept more jobs, Complete some before accepting new ones.");
        }
        validateRequestServicesOfferedByMechanic(mechanicId, req.getCarType(), req.getDescription());
        req.setMechanicId(mechanicId);
        req.setStatus("assigned");
        MechanicRequest saved = repository.save(req);
        notifyClientRequestAccepted(saved);
        return Optional.of(saved);
    }

    public Optional<MechanicRequest> completeJob(String requestId, String mechanicId, String loggedInUsername) {
        Optional<MechanicRequest> opt = repository.findById(requestId);
        if (opt.isEmpty()) return Optional.empty();
        MechanicRequest req = opt.get();
        if (!mechanicId.equals(req.getMechanicId())) {
            throw new IllegalStateException("Only the assigned mechanic can complete this job");
        }
        req.setStatus("completed");
        MechanicRequest saved = repository.save(req);
        notifyClientServiceCompleted(saved, loggedInUsername);
        return Optional.of(saved);
    }

    private String toJobDescription(MechanicRequest request) {
        if (request.getDescription() != null && !request.getDescription().isBlank()) return request.getDescription();
         return "mechanic service";
    }

    private void notifyClientRequestAccepted(MechanicRequest request) {
        notificationService.notifyRequestAccepted(
                request.getUsername(), "https://172.20.10.11:3000/history", "Mechanic Request", toJobDescription(request));
    }

    private void notifyClientServiceCompleted(MechanicRequest request, String loggedInUsername) {
        notificationService.notifyServiceCompleted(
                request.getUsername(), loggedInUsername, "mechanic service", toJobDescription(request));
    }

    // ================= UPDATE =================
    public Optional<MechanicRequest> update(MechanicRequest updated, String loggedInUsername) {
        if (updated == null || updated.getId() == null) {
            throw new IllegalArgumentException("Job id is required for update");
        }
        Optional<MechanicRequest> requests = repository.findById(updated.getId());
        if (requests.isEmpty()) return Optional.empty();

        MechanicRequest existing = requests.get();

        // Enforce max paid/in-progress jobs (by numberOfEmployees) when mechanic is being assigned (via update)
        String newMechanicId = updated.getMechanicId();
        if (newMechanicId != null && !newMechanicId.isBlank()
                && ("assigned".equalsIgnoreCase(updated.getStatus()) || "accepted".equalsIgnoreCase(updated.getStatus()))
                && (existing.getMechanicId() == null || existing.getMechanicId().isBlank())) {
            int maxAllowed = getMaxPaidJobsForMechanic(newMechanicId);
            long paidIncompleteCount = repository.countPaidIncompleteByMechanicId(newMechanicId);
            if (paidIncompleteCount >= maxAllowed) {
                throw new IllegalStateException("Cannot assign, Complete some before accepting new ones.");
            }
        }

        // Update all fields (coords not persisted; location string is used)
        existing.setDescription(updated.getDescription());
        existing.setLocation(updated.getLocation());
        existing.setDate(updated.getDate());
        existing.setStatus(updated.getStatus());
        existing.setUsername(updated.getUsername());
        existing.setMechanicId(updated.getMechanicId());
         if (updated.getServicePrice() != null) existing.setServicePrice(updated.getServicePrice());

        MechanicRequest saved = repository.save(existing);

        // Send actionable notifications when status changes

            String newStatus = existing.getStatus();
            if ("accepted".equalsIgnoreCase(newStatus) || "assigned".equalsIgnoreCase(newStatus)) {
                if(requests.get().isCallOutService())
                  notificationService.notifyServiceProvider(loggedInUsername,requests.get().getLocation());

                notifyClientRequestAccepted(existing);
            } else if ("completed".equalsIgnoreCase(newStatus)) {

                notifyClientServiceCompleted(existing, loggedInUsername);
            } else {
                String jobDesc = toJobDescription(existing);
                String subject = "Mechanic Request Status Updated";
                String body = "Hi " + existing.getUsername() + ",\n\n" +
                        "Your " + jobDesc + " request status has been changed to: " +
                        newStatus + ".\n\nThank you!";
                String to = getClientEmail(existing.getUsername());
                if (to != null) {
                    emailService.sendEmailNotification(to, subject, body);
                }
            }


        return Optional.of(saved);
    }

    // ================= DELETE =================
    public boolean deleteById(String id) {
        if (!repository.existsById(id)) return false;
        repository.deleteById(id);
        return true;
    }

    public boolean deleteByUsername(String username) {
        List<MechanicRequest> requests = repository.findByUsername(username);
        if (requests.isEmpty()) return false;

        repository.deleteByUsername(username);
        return true;
    }


}
