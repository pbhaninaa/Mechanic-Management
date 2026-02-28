package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_reset_tokens")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PasswordResetToken {

    // ================== PRIMARY KEY ==================
    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    // User Info
    @Column(nullable = false)
    private String username;

    // Token Info
    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(nullable = false)
    private Instant expiry;

    public PasswordResetToken(String username, String token, Instant expiry) {
        this.username = username;
        this.token = token;
        this.expiry = expiry;

    }

    // ================== AUTO GENERATE ID ==================
    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
    }

    // ================== HELPER METHODS ==================
    public boolean isExpired() {
        return Instant.now().isAfter(expiry);
    }
}