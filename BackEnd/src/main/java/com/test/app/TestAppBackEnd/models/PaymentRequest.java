package com.test.app.TestAppBackEnd.models;
public class PaymentRequest {
    private Double amount;
    private String clientUsername;
    private String jobId;
    private String mechanicId;
    private String carWashId;

    // Getters and setters
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getClientUsername() { return clientUsername; }
    public void setClientUsername(String clientUsername) { this.clientUsername = clientUsername; }

    public String getJobId() { return jobId; }
    public void setJobId(String jobId) { this.jobId = jobId; }

    public String getMechanicId() { return mechanicId; }
    public void setMechanicId(String mechanicId) { this.mechanicId = mechanicId; }

    public String getCarWashId() { return carWashId; }
    public void setCarWashId(String carWashId) { this.carWashId = carWashId; }
}
