package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.ProviderServiceOffering;
import com.test.app.TestAppBackEnd.repositories.ProviderServiceOfferingRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ProviderServiceOfferingService {

    private final ProviderServiceOfferingRepository repository;

    public ProviderServiceOfferingService(ProviderServiceOfferingRepository repository) {
        this.repository = repository;
    }

    public List<ProviderServiceOffering> getMyOfferings(String username, String providerType) {
        return repository.findByProviderUsernameAndProviderTypeOrderByServiceNameAsc(username, providerType);
    }

    /** Catalog for clients: all offerings for a provider type (mechanic or carwash) */
    public List<ProviderServiceOffering> getCatalog(String providerType) {
        return repository.findByProviderTypeOrderByServiceNameAsc(providerType);
    }

    public ProviderServiceOffering create(String username, String providerType, ProviderServiceOffering offering) {
        offering.setId(null);
        offering.setProviderUsername(username);
        offering.setProviderType(providerType);
        return repository.save(offering);
    }

    public Optional<ProviderServiceOffering> update(String id, String username, ProviderServiceOffering updated) {
        return repository.findById(id)
                .filter(o -> username.equals(o.getProviderUsername()))
                .map(existing -> {
                    existing.setServiceName(updated.getServiceName());
                    existing.setPrice(updated.getPrice());
                    return repository.save(existing);
                });
    }

    public boolean delete(String id, String username) {
        return repository.findById(id)
                .filter(o -> username.equals(o.getProviderUsername()))
                .map(o -> {
                    repository.delete(o);
                    return true;
                })
                .orElse(false);
    }
}
