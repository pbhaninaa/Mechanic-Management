package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "request_history")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class RequestHistory {

    // ================== PRIMARY KEY ==================
    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    // ================== USER INFO ==================
    @Column(nullable = false, name = "username")
    private String username;

    // ================== JOB DETAILS ==================
    @Column(nullable = false, name = "description")
    private String description;

    @Column(nullable = false, name = "location")
    private String location;

    @Column(nullable = false, name = "status")
    private String status; // e.g., "pending", "assigned", "completed", "cancelled"

    @Column(nullable = false, name = "date")
    private LocalDateTime date;

    // ================== AUTO FIELDS ==================
    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (date == null) {
            date = LocalDateTime.now();
        }
        if (status == null) {
            status = "pending";
        }
    }
}