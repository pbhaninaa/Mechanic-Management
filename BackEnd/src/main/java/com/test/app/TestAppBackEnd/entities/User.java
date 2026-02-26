package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "users")  // matches your DB table name
public class User {

    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;


    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
    }

    // Default constructor
    public User() {}
    // All-args constructor
    public User(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // Getters & Setters
    public String getId() { return id; }

    public void setId(String id) { this.id = id; }

    public String getUsername() { return username; }

    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }

    public void setPassword(String password) { this.password = password; }

}
