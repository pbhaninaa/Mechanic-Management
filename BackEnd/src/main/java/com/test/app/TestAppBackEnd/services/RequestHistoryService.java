package com.test.app.TestAppBackEnd.services;

import com.test.app.TestAppBackEnd.entities.RequestHistory;
import com.test.app.TestAppBackEnd.repositories.RequestHistoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RequestHistoryService {

    private final RequestHistoryRepository requestHistoryRepository;

    public RequestHistoryService(RequestHistoryRepository requestHistoryRepository) {
        this.requestHistoryRepository = requestHistoryRepository;
    }

    public List<RequestHistory> getAll() {
        return requestHistoryRepository.findAll();
    }

    public Optional<RequestHistory> getById(Long id) {
        return requestHistoryRepository.findById(id);
    }

    public List<RequestHistory> getByUsername(String username) {
        return requestHistoryRepository.findByUsername(username);
    }

    public RequestHistory save(RequestHistory requestHistory) {
        return requestHistoryRepository.save(requestHistory);
    }

    public void delete(Long id) {
        requestHistoryRepository.deleteById(id);
    }
}
