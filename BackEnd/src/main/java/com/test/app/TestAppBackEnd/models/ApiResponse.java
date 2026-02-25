package com.test.app.TestAppBackEnd.models;

/**
 * Standard API response wrapper for all endpoints.
 * Includes success flag for frontend compatibility.
 */
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private int statusCode;
    private T data;

    public ApiResponse() {}

    public ApiResponse(String message, int statusCode, T data) {
        this.success = statusCode >= 200 && statusCode < 300;
        this.message = message;
        this.statusCode = statusCode;
        this.data = data;
    }

    // ===== Getters & Setters =====
    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

}
