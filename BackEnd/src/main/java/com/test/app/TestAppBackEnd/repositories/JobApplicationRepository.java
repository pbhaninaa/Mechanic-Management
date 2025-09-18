package com.test.app.TestAppBackEnd.repositories;


import com.test.app.TestAppBackEnd.entities.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {
    // Custom query example
    // List<JobApplication> findByStatus(String status);
}
