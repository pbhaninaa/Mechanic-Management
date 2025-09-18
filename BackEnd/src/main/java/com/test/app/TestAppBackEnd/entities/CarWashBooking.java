package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
public class CarWashBooking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String clientUsername;
    private String carWashId; // initially null, set when a carwash takes the request
    private String carPlate;
    private String carType;
    private String carDescription;
    private String location;
    private String date; // yyyy-MM-dd
    private String status; // e.g., "pending", "accepted", "completed"
    private Double servicePrice;

    @ElementCollection
    private List<String> serviceTypes;

    private LocalDateTime createdAt;

    // Constructors
    public CarWashBooking() {
        this.createdAt = LocalDateTime.now();
        this.status = "pending";
    }

    public CarWashBooking(String clientUsername, String carPlate, String carType, String carDescription,
                          List<String> serviceTypes, Double servicePrice, String date, String location) {
        this.clientUsername = clientUsername;
        this.carPlate = carPlate;
        this.carType = carType;
        this.carDescription = carDescription;
        this.serviceTypes = serviceTypes;
        this.servicePrice = servicePrice;
        this.date = date;
        this.location = location;
        this.status = "pending";
        this.createdAt = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() { return id; }
    public String getClientUsername() { return clientUsername; }
    public void setClientUsername(String clientUsername) { this.clientUsername = clientUsername; }
    public String getCarWashId() { return carWashId; }
    public void setCarWashId(String carWashId) { this.carWashId = carWashId; }
    public String getCarPlate() { return carPlate; }
    public void setCarPlate(String carPlate) { this.carPlate = carPlate; }
    public String getCarType() { return carType; }
    public void setCarType(String carType) { this.carType = carType; }
    public String getCarDescription() { return carDescription; }
    public void setCarDescription(String carDescription) { this.carDescription = carDescription; }
    public List<String> getServiceTypes() { return serviceTypes; }
    public void setServiceTypes(List<String> serviceTypes) { this.serviceTypes = serviceTypes; }
    public Double getServicePrice() { return servicePrice; }
    public void setServicePrice(Double servicePrice) { this.servicePrice = servicePrice; }
    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
