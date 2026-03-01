package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.AdditionalFee;
import com.test.app.TestAppBackEnd.repositories.AdditionalFeeRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AdditionalFeeService {

    private final AdditionalFeeRepository repository;

    public AdditionalFeeService(AdditionalFeeRepository repository) {
        this.repository = repository;
    }

    /** Seed default fees if table is empty (e.g. first run or after reset). */
    @PostConstruct
    public void seedDefaultsIfEmpty() {
        if (repository.count() > 0) return;
        repository.save(new AdditionalFee(null, "callOut", 300.0, "Call-out service fee"));
        repository.save(new AdditionalFee(null, "towing", 1500.0, "Towing fee (replaces call-out when towing required)"));
    }

    public List<AdditionalFee> findAll() {
        return repository.findAll();
    }

    public Optional<AdditionalFee> findById(String id) {
        return repository.findById(id);
    }

    public Optional<AdditionalFee> findByFeeKey(String feeKey) {
        return repository.findByFeeKey(feeKey);
    }

    public AdditionalFee create(AdditionalFee fee) {
        if (fee.getFeeKey() == null || fee.getFeeKey().isBlank()) {
            throw new IllegalArgumentException("feeKey is required");
        }
        if (fee.getAmount() == null || fee.getAmount() < 0) {
            throw new IllegalArgumentException("amount must be >= 0");
        }
        fee.setId(null);
        return repository.save(fee);
    }

    public Optional<AdditionalFee> update(String id, AdditionalFee updates) {
        return repository.findById(id).map(existing -> {
            if (updates.getFeeKey() != null && !updates.getFeeKey().isBlank()) {
                existing.setFeeKey(updates.getFeeKey());
            }
            if (updates.getAmount() != null && updates.getAmount() >= 0) {
                existing.setAmount(updates.getAmount());
            }
            if (updates.getDescription() != null) {
                existing.setDescription(updates.getDescription());
            }
            return repository.save(existing);
        });
    }

    public boolean delete(String id) {
        if (!repository.existsById(id)) return false;
        repository.deleteById(id);
        return true;
    }
}
