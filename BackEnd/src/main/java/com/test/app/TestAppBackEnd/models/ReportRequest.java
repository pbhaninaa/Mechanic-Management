package com.test.app.TestAppBackEnd.models;

/**
 * Request body for exporting or emailing a history report for a date range.
 */
public class ReportRequest {
    private String username;   // client/customer username
    private String mechanicId; // optional; for mechanic earnings/completed jobs
    private String carWashId;  // optional; for car wash earnings/completed jobs
    private String startDate;  // yyyy-MM-dd
    private String endDate;    // yyyy-MM-dd
    private String email;      // optional; if not set, resolved from user profile

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getMechanicId() { return mechanicId; }
    public void setMechanicId(String mechanicId) { this.mechanicId = mechanicId; }

    public String getCarWashId() { return carWashId; }
    public void setCarWashId(String carWashId) { this.carWashId = carWashId; }

    public String getStartDate() { return startDate; }
    public void setStartDate(String startDate) { this.startDate = startDate; }

    public String getEndDate() { return endDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
