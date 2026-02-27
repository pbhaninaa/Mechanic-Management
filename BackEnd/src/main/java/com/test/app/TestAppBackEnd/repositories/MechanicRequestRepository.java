package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.MechanicRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MechanicRequestRepository extends JpaRepository<MechanicRequest, String> {
    List<MechanicRequest> findByUsername(String username);
    List<MechanicRequest> findByMechanicId(String mechanicId);
    List<MechanicRequest> findByStatusAndMechanicIdIsNull(String status);
    void deleteByUsername(String username);

    @Query("SELECT COUNT(m) FROM MechanicRequest m WHERE m.mechanicId = :mechanicId AND m.status NOT IN ('completed', 'cancelled')")
    long countIncompleteByMechanicId(@Param("mechanicId") String mechanicId);

    /** Count paid or in-progress jobs (not completed) - used to limit new accepts when 5 paid jobs pending */
    @Query("SELECT COUNT(m) FROM MechanicRequest m WHERE m.mechanicId = :mechanicId " +
            "AND (LOWER(m.status) = 'paid' OR LOWER(m.status) = 'in progress')")
    long countPaidIncompleteByMechanicId(@Param("mechanicId") String mechanicId);
}
