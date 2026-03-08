package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.MechanicRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface MechanicRequestRepository extends JpaRepository<MechanicRequest, String> {
    List<MechanicRequest> findByUsername(String username);
    List<MechanicRequest> findByMechanicId(String mechanicId);

    @Query("SELECT m FROM MechanicRequest m WHERE m.username = :username AND (:q IS NULL OR :q = '' OR " +
            "LOWER(COALESCE(m.description, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(m.location, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(m.status) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(m.username, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(m.carPlate, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(m.carType, '')) LIKE LOWER(CONCAT('%', :q, '%'))) " +
            "ORDER BY m.date DESC")
    List<MechanicRequest> findByUsernameWithSearch(@Param("username") String username, @Param("q") String q);

    @Query("SELECT m FROM MechanicRequest m WHERE m.mechanicId = :mechanicId AND (:q IS NULL OR :q = '' OR " +
            "LOWER(COALESCE(m.description, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(m.location, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(m.status) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(m.username, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(m.carPlate, '')) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY m.date DESC")
    List<MechanicRequest> findByMechanicIdWithSearch(@Param("mechanicId") String mechanicId, @Param("q") String q);

    @Query(value = "SELECT m FROM MechanicRequest m WHERE (:q IS NULL OR :q = '' OR " +
            "LOWER(COALESCE(m.description, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(m.location, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(m.status) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(m.username, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(m.carPlate, '')) LIKE LOWER(CONCAT('%', :q, '%'))) ORDER BY m.date DESC",
            countQuery = "SELECT COUNT(m) FROM MechanicRequest m WHERE (:q IS NULL OR :q = '' OR " +
            "LOWER(COALESCE(m.description, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(m.location, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(m.status) LIKE LOWER(CONCAT('%', :q, '%')) OR LOWER(COALESCE(m.username, '')) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
            "LOWER(COALESCE(m.carPlate, '')) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<MechanicRequest> findAllWithSearch(@Param("q") String q, Pageable pageable);

    /** Requests for a user within date range */
    List<MechanicRequest> findByUsernameAndDateBetweenOrderByDateDesc(String username, LocalDate startDate, LocalDate endDate);

    /** Requests for a mechanic within date range */
    List<MechanicRequest> findByMechanicIdAndDateBetweenOrderByDateDesc(String mechanicId, LocalDate startDate, LocalDate endDate);

    /** Completed jobs for a mechanic within date range */
    List<MechanicRequest> findByMechanicIdAndStatusAndDateBetweenOrderByDateDesc(String mechanicId, String status, LocalDate startDate, LocalDate endDate);

    List<MechanicRequest> findByStatusAndMechanicIdIsNull(String status);
    void deleteByUsername(String username);

    @Query("SELECT COUNT(m) FROM MechanicRequest m WHERE m.mechanicId = :mechanicId AND m.status NOT IN ('completed', 'cancelled')")
    long countIncompleteByMechanicId(@Param("mechanicId") String mechanicId);

    /** Count paid or in-progress jobs (not completed) - used to limit new accepts when 5 paid jobs pending */
    @Query("SELECT COUNT(m) FROM MechanicRequest m WHERE m.mechanicId = :mechanicId " +
            "AND (LOWER(m.status) = 'paid' OR LOWER(m.status) = 'in progress')")
    long countPaidIncompleteByMechanicId(@Param("mechanicId") String mechanicId);
}
