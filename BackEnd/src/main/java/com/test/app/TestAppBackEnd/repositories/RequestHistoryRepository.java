package com.test.app.TestAppBackEnd.repositories;

import com.test.app.TestAppBackEnd.entities.RequestHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequestHistoryRepository extends JpaRepository<RequestHistory, Long> {
    List<RequestHistory> findByUsername(String username);  // 👈 query by username
}
