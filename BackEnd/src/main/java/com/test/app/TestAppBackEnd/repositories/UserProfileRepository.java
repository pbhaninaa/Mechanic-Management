package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.constants.Role;
import com.test.app.TestAppBackEnd.entities.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, String> {

    Optional<UserProfile> findByUsername(String username);

    Optional<UserProfile> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    List<UserProfile> findByRoles(Role role);

    void deleteByUsername(String username);

    @Query("""
        SELECT u FROM UserProfile u
        WHERE (:q IS NULL OR :q = ''
           OR LOWER(u.username) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(u.firstName) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(u.lastName) LIKE LOWER(CONCAT('%', :q, '%'))
           OR LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :q, '%'))
        )
    """)
    List<UserProfile> findAllWithSearch(@Param("q") String q);
}