package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.MechanicRequest;
import com.test.app.TestAppBackEnd.repositories.MechanicRequestRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MechanicRequestService {

    private final MechanicRequestRepository repository;

    public MechanicRequestService(MechanicRequestRepository repository) {
        this.repository = repository;
    }

    // Create new request
    public MechanicRequest create(MechanicRequest request) {
        return repository.save(request);
    }

    // Get all requests (optional, for admin)
    public List<MechanicRequest> getAll() {
        return repository.findAll();
    }
    // Get By I'd
    public Optional<MechanicRequest> getById(Long id) {
        return repository.findById(id);
    }

    // Get requests by username
    public List<MechanicRequest> getByUsername(String username) {
        return repository.findByUsername(username);
    }

    // Update request by username (optional)
    public Optional<MechanicRequest> updateByUsername(MechanicRequest updated) {
        Optional<MechanicRequest> requests = repository.findById(updated.getId());
        if (requests.isEmpty()) return Optional.empty();

        MechanicRequest existing = requests.get();
        existing.setDescription(updated.getDescription());
        existing.setLocation(updated.getLocation());
        existing.setLatitude(updated.getLatitude());
        existing.setLongitude(updated.getLongitude());
        existing.setDate(updated.getDate());
        existing.setStatus(updated.getStatus());
        existing.setUsername(updated.getUsername());
        existing.setMechanicId(updated.getMechanicId());

        return Optional.of(repository.save(existing));
    }

    // Delete request by username
    public boolean deleteByUsername(String username) {
        List<MechanicRequest> requests = repository.findByUsername(username);
        if (requests.isEmpty()) return false;

        repository.deleteByUsername(username);
        return true;
    }
}
