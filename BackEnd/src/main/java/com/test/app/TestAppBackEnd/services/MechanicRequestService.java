package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.MechanicRequest;
import com.test.app.TestAppBackEnd.repositories.MechanicRequestRepository;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

import java.util.List;
import java.util.Optional;

@Service
public class MechanicRequestService {

    private final MechanicRequestRepository repository;
    private final EmailService emailService;

    public MechanicRequestService(MechanicRequestRepository repository, EmailService emailService) {
        this.repository = repository;
        this.emailService = emailService;
    }

    // ================= CREATE =================
    public MechanicRequest create(MechanicRequest request) {
        return repository.save(request);
    }

    // ================= READ =================
    public List<MechanicRequest> getAll() {
        return repository.findAll();
    }

    public Optional<MechanicRequest> getById(Long id) {
        return repository.findById(id);
    }

    public List<MechanicRequest> getByUsername(String username) {
        return repository.findByUsername(username);
    }

    public List<MechanicRequest> getByMechanicId(Long mechanicId) {
        return repository.findByMechanicId(mechanicId);
    }

    // ================= UPDATE =================
    public Optional<MechanicRequest> update(MechanicRequest updated) {
        Optional<MechanicRequest> requests = repository.findById(updated.getId());
        if (requests.isEmpty()) return Optional.empty();

        MechanicRequest existing = requests.get();

        // Check if status changed
        boolean statusChanged = !existing.getStatus().equals(updated.getStatus());

        // Update all fields
        existing.setDescription(updated.getDescription());
        existing.setLocation(updated.getLocation());
        existing.setLatitude(updated.getLatitude());
        existing.setLongitude(updated.getLongitude());
        existing.setDate(updated.getDate());
        existing.setStatus(updated.getStatus());
        existing.setUsername(updated.getUsername());
        existing.setMechanicId(updated.getMechanicId());

        MechanicRequest saved = repository.save(existing);

        // Send email if status changed and actor is not the owner
        if (statusChanged ) {
            String subject = "Mechanic Request Status Updated";
            String body = "Hi " + existing.getUsername() + ",\n\n" +
                    "Your mechanic request (ID: " + existing.getId() + ") status has been changed to: " +
                    existing.getStatus() + ".\n\nThank you!";

            emailService.sendEmailNotification(existing.getUsername(), subject, body);
        }

        return Optional.of(saved);
    }

    // ================= DELETE =================
    public boolean deleteByUsername(String username) {
        List<MechanicRequest> requests = repository.findByUsername(username);
        if (requests.isEmpty()) return false;

        repository.deleteByUsername(username);
        return true;
    }


}
