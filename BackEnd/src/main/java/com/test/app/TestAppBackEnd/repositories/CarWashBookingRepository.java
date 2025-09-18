package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.CarWashBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarWashBookingRepository extends JpaRepository<CarWashBooking, Long> {
    List<CarWashBooking> findByClientUsername(String clientUsername);
    List<CarWashBooking> findByCarWashId(String carWashId);
}
