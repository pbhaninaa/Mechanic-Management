package com.test.app.TestAppBackEnd.entities;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "request_mechanic")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class MechanicRequest {

    // ================== PRIMARY KEY ==================
    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    // ================== CLIENT INFO ==================
    @Column(nullable = false, name = "Client Username")
    private String username;

    @Transient
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String phoneNumber; // Not stored in DB

    // ================== JOB DETAILS ==================
    @Column(nullable = false, name = "Job Description")
    private String description;

    @Column(nullable = false, name = "Job Location")
    private String location;

    @Column(nullable = false, name = "Call Out Service")
    private boolean callOutService;

    @Column(nullable = false, name = "Towing")
    private boolean towing;

    @Column(nullable = false, name = "Date")
    private LocalDate date;

    @Column(nullable = false)
    private String status = "pending";

    @Column(nullable = false, name = "Service Price")
    private Double servicePrice;

    // ================== VEHICLE INFO ==================
    @Column(nullable = false, name = "Car Type")
    private String carType;

    @Column(nullable = false, name = "Car Plate")
    private String carPlate;

    @Column(nullable = true, name = "VIN Number")
    private String vinNumber;

    // ================== MECHANIC INFO ==================
    @Column(nullable = true, name = "Service Provider Id")
    private String mechanicId;

    // ================== AUTO GENERATE ID ==================
    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }


}