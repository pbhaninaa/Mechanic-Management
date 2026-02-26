package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(nullable = false)
    private Instant expiry;

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
    }

    public PasswordResetToken() {}

    public PasswordResetToken(String username, String token, Instant expiry) {
        this.username = username;
        this.token = token;
        this.expiry = expiry;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public Instant getExpiry() { return expiry; }
    public void setExpiry(Instant expiry) { this.expiry = expiry; }

    public boolean isExpired() {
        return Instant.now().isAfter(expiry);
    }
}
