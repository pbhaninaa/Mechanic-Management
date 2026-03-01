package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.AdditionalFee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AdditionalFeeRepository extends JpaRepository<AdditionalFee, String> {
    Optional<AdditionalFee> findByFeeKey(String feeKey);
}
