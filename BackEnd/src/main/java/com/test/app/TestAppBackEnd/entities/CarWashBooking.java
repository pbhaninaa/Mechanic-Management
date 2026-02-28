package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "car_wash_booking")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class CarWashBooking {

    // ================== PRIMARY KEY ==================
    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    // ================== CLIENT INFO ==================
    @Column(nullable = false, name = "client_username")
    private String clientUsername;

    // ================== CAR WASH INFO ==================
    @Column(name = "car_wash_id")
    private String carWashId; // null until accepted

    // ================== VEHICLE INFO ==================
    @Column(nullable = false, name = "car_plate")
    private String carPlate;

    @Column(nullable = false, name = "car_type")
    private String carType;

    @Column(name = "car_description")
    private String carDescription;

    // ================== SERVICE DETAILS ==================
    @ElementCollection
    @CollectionTable(name = "car_wash_services", joinColumns = @JoinColumn(name = "booking_id"))
    @Column(name = "service_type")
    private List<String> serviceTypes;

    @Column(nullable = false, name = "service_price")
    private Double servicePrice;

    @Column(nullable = false, name = "Call Out Service")
    private boolean callOutService;

    // ================== BOOKING DETAILS ==================
    @Column(nullable = false)
    private LocalDate date;   // Better than String

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String status = "pending";

    @Column(nullable = false, name = "created_at")
    private LocalDateTime createdAt;

    // ================== AUTO FIELDS ==================
    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "pending";
        }
    }
}