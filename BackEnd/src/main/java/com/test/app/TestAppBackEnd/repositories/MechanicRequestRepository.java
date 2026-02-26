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
}
