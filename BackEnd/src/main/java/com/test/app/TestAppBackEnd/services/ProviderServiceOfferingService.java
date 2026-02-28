package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.ProviderServiceOffering;
import com.test.app.TestAppBackEnd.entities.UserProfile;
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
    public List<ProviderServiceOffering> getNearbyByOfferingType(
            String offeringType,
            double latitude,
            double longitude,
            double radiusKm
    ) {

        double radiusMeters = radiusKm * 1000;

        return repository.findNearbyByOfferingType(
                offeringType,
                latitude,
                longitude,
                radiusMeters
        );
    }

    public ProviderServiceOffering create(UserProfile providerProfile, String providerType, ProviderServiceOffering offering) {
        String lat = providerProfile.getLatitude();
        String lng = providerProfile.getLongitude();
        if (lat == null || lat.isBlank() || lng == null || lng.isBlank()) {
            throw new IllegalArgumentException(
                "Please set your location in your profile before adding services. Update your profile with your address or location.");
        }
        offering.setId(null);
        offering.setProviderUsername(providerProfile.getUsername());
        offering.setLatitude(lat);
        offering.setLongitude(lng);
        offering.setProviderId(providerProfile.getId());
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
