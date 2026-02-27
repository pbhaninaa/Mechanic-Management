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

    @Query("SELECT b FROM CarWashBooking b WHERE b.clientUsername = :username AND (:q IS NULL OR :q = '' OR " +
            "LOWER(b.carPlate) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(b.location, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(b.status) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(b.date, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(b.carDescription, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(b.clientUsername, '')) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY b.date DESC")
    List<CarWashBooking> findByClientUsernameWithSearch(@Param("username") String username, @Param("q") String q);

    @Query("SELECT b FROM CarWashBooking b WHERE (:q IS NULL OR :q = '' OR " +
            "LOWER(COALESCE(b.carPlate, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(b.location, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(b.status) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(b.date, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(b.carDescription, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(b.clientUsername, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(b.carWashId, '')) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY b.createdAt DESC")
    List<CarWashBooking> findAllWithSearch(@Param("q") String q);

    @Query("SELECT b FROM CarWashBooking b WHERE b.carWashId = :carWashId AND (:q IS NULL OR :q = '' OR " +
            "LOWER(COALESCE(b.carPlate, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(b.location, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(b.status) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(b.date, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(b.clientUsername, '')) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY b.date DESC")
    List<CarWashBooking> findByCarWashIdWithSearch(@Param("carWashId") String carWashId, @Param("q") String q);

    /** Bookings for a client within date range (date stored as yyyy-MM-dd string) */
    @Query("SELECT b FROM CarWashBooking b WHERE b.clientUsername = :username AND b.date >= :startDate AND b.date <= :endDate ORDER BY b.date DESC")
    List<CarWashBooking> findByClientUsernameAndDateBetween(@Param("username") String username,
                                                            @Param("startDate") String startDate,
                                                            @Param("endDate") String endDate);

    /** Completed bookings for a car wash provider within date range */
    @Query("SELECT b FROM CarWashBooking b WHERE b.carWashId = :carWashId AND LOWER(b.status) = 'completed' AND b.date >= :startDate AND b.date <= :endDate ORDER BY b.date DESC")
    List<CarWashBooking> findByCarWashIdAndStatusCompletedAndDateBetween(@Param("carWashId") String carWashId,
                                                                        @Param("startDate") String startDate,
                                                                        @Param("endDate") String endDate);

    @Query("SELECT COUNT(b) FROM CarWashBooking b WHERE b.carWashId = :carWashId AND b.status NOT IN ('completed', 'cancelled')")
    long countIncompleteByCarWashId(@Param("carWashId") String carWashId);

    /** Count paid or in-progress bookings (not completed) - used to limit new accepts when 5 paid jobs pending */
    @Query("SELECT COUNT(b) FROM CarWashBooking b WHERE b.carWashId = :carWashId " +
            "AND (LOWER(b.status) = 'paid' OR LOWER(b.status) = 'in progress')")
    long countPaidIncompleteByCarWashId(@Param("carWashId") String carWashId);
}
