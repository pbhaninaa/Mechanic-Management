package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.CarWashBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CarWashBookingRepository extends JpaRepository<CarWashBooking, String> {
    List<CarWashBooking> findByClientUsername(String clientUsername);
    List<CarWashBooking> findByCarWashId(String carWashId);

    @Query("SELECT COUNT(b) FROM CarWashBooking b WHERE b.carWashId = :carWashId AND b.status NOT IN ('completed', 'cancelled')")
    long countIncompleteByCarWashId(@Param("carWashId") String carWashId);
}
