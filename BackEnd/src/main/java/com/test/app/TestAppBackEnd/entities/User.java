package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class User {

    // ================== PRIMARY KEY ==================
    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    // ================== USER INFO ==================
    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;

    public User(String username, String encode) {
        this.username = username;
        this.password = encode;
    }

    // ================== AUTO GENERATE ID ==================
    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}