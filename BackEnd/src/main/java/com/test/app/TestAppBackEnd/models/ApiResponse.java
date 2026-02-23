package com.test.app.TestAppBackEnd.models;

public class ApiResponse<T> {

    private String message;
    private int statusCode;
    private T data;

    public ApiResponse() {}

    public ApiResponse(
            String message,
            int statusCode,
            T data
    ) {
        this.message = message;
        this.statusCode = statusCode;
        this.data = data;
    }

    // ===== Getters & Setters =====
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
