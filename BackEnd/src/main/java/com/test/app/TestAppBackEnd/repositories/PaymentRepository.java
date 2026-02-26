package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, String> {
    List<Payment> findByClientUsername(String clientUsername);
    List<Payment> findByMechanicId(String mechanicId);
    List<Payment> findByCarWashId(String carWashId);

}
