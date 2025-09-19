package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.MechanicRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MechanicRequestRepository extends JpaRepository<MechanicRequest, Long> {
    List<MechanicRequest> findByUsername(String username);
    List<MechanicRequest> findByMechanicId(Long mechanicId);
    void deleteByUsername(String username);
}
