package com.test.app.TestAppBackEnd.services;


import com.test.app.TestAppBackEnd.entities.JobApplication;
import com.test.app.TestAppBackEnd.repositories.JobApplicationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class JobApplicationService {

    @Autowired
    private JobApplicationRepository repository;

    public List<JobApplication> getAllApplications() {
        return repository.findAll();
    }

    public Optional<JobApplication> getApplicationById(Long id) {
        return repository.findById(id);
    }

    public JobApplication createApplication(JobApplication application) {
        application.setStatus("PENDING");
        return repository.save(application);
    }

    public JobApplication updateApplication(JobApplication application) {
        return repository.save(application);
    }

    public void deleteApplication(Long id) {
        repository.deleteById(id);
    }
}
