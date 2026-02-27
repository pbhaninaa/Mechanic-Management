package com.test.app.TestAppBackEnd.entities;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "request_mechanic")
@Data
public class MechanicRequest {

    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String location;
    @Column(nullable = true, name = "MechanicId", length = 36)
    private String mechanicId;

    private Double latitude;
    private Double longitude;

    private String carType;
    private String carPlate;
    private String vinNumber;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private String status = "pending"; // pending, assigned, in_progress, completed, cancelled

    private Double servicePrice; // Pre-defined price for the selected service(s)

    @Transient
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private String phoneNumber; // Populated from UserProfile for display in tables

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
    }

    // ===== Getters & Setters =====
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
public String getCarType() { return carType; }
    public void setCarType(String carType) { this.carType = carType; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
public String getCarPlate() { return carPlate; }
    public void setCarPlate(String carPlate) { this.carPlate = carPlate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getMechanicId() { return mechanicId; }
    public void setMechanicId(String mechanicId) { this.mechanicId = mechanicId; }

public String getVinNumber() { return vinNumber; }
    public void setVinNumber(String vinNumber) { this.vinNumber = vinNumber; }
    public Double getServicePrice() { return servicePrice; }
    public void setServicePrice(Double servicePrice) { this.servicePrice = servicePrice; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
}
