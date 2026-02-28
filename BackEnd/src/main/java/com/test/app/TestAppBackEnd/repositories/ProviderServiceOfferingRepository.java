package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.ProviderServiceOffering;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProviderServiceOfferingRepository extends JpaRepository<ProviderServiceOffering, String> {
    List<ProviderServiceOffering> findByProviderUsernameAndProviderTypeOrderByServiceNameAsc(String providerUsername, String providerType);
List<ProviderServiceOffering> findByProviderId(String providerId);
    /** All offerings for a provider type (for client catalog) */
    List<ProviderServiceOffering> findByProviderTypeOrderByServiceNameAsc(String providerType);

@Query(value = """
    SELECT *
    FROM provider_service_offering p
    WHERE p.offering_type = :offeringType
    AND ST_Distance_Sphere(
            point(p.longitude, p.latitude),
    point(:lng, :lat)
) <= :radiusMeters
    ORDER BY p.service_name ASC
""", nativeQuery = true)
List<ProviderServiceOffering> findNearbyByOfferingType(
        @Param("offeringType") String offeringType,
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("radiusMeters") double radiusMeters
);
}
