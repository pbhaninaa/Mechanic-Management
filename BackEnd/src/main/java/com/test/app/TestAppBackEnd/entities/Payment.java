package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double amount;
    private String clientUsername;
    private Long jobId;
    private Long mechanicId;
    private Long carWashId; // <--- Added
    private Double platformFee;
    private LocalDateTime paidAt;

    // Constructors
    public Payment() {}

    public Payment(Double amount, String clientUsername, Long jobId, Long mechanicId, Long carWashId, Double platformFee) {
        this.amount = amount;
        this.clientUsername = clientUsername;
        this.jobId = jobId;
        this.mechanicId = mechanicId;
        this.carWashId = carWashId; // <--- Set
        this.platformFee = platformFee;
        this.paidAt = LocalDateTime.now();
    }

    // Getters & Setters
    public Long getId() { return id; }

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }

    public String getClientUsername() { return clientUsername; }
    public void setClientUsername(String clientUsername) { this.clientUsername = clientUsername; }

    public Long getMechanicId() { return mechanicId; }
    public void setMechanicId(Long mechanicId) { this.mechanicId = mechanicId; }

    public Long getCarWashId() { return carWashId; } // <--- Getter
    public void setCarWashId(Long carWashId) { this.carWashId = carWashId; } // <--- Setter

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public Double getPlatformFee() { return platformFee; }
    public void setPlatformFee(Double platformFee) { this.platformFee = platformFee; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
