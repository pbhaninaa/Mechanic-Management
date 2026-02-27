package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.ProviderServiceOffering;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProviderServiceOfferingRepository extends JpaRepository<ProviderServiceOffering, String> {
    List<ProviderServiceOffering> findByProviderUsernameAndProviderTypeOrderByServiceNameAsc(String providerUsername, String providerType);

    /** All offerings for a provider type (for client catalog) */
    List<ProviderServiceOffering> findByProviderTypeOrderByServiceNameAsc(String providerType);
}
