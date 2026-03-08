package com.test.app.TestAppBackEnd.entities;

import com.test.app.TestAppBackEnd.constants.Role;
import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "user_profiles")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfile {

    // ================== PRIMARY KEY ==================
    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    // ================== USER INFO ==================
    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false, unique = true)
    private String email;
    /** Required for CARWASH/MECHANIC; limits how many paid/in-progress requests the provider can have. */
    @Column(nullable = true)
    private Long numberOfEmployees;
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String countryCode;

    private String latitude;
    private String longitude;
    private String address;

    // ================== ROLES ==================
    @ElementCollection(targetClass = Role.class, fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role", nullable = false)
    @Enumerated(EnumType.STRING)
    private Set<Role> roles = new HashSet<>();

    @JsonSetter("roles")
    public void setRolesFromJson(Object rolesJson) {
        if (rolesJson instanceof String) {
            this.roles = new HashSet<>();
            this.roles.add(Role.valueOf((String) rolesJson));
        } else if (rolesJson instanceof Collection<?> col) {
            this.roles = col.stream()
                    .map(o -> Role.valueOf(o.toString()))
                    .collect(Collectors.toCollection(HashSet::new));
        }
    }

    // ================== ACCOUNT STATUS ==================
    private boolean enabled = true;
    private boolean accountNonExpired = true;
    private boolean accountNonLocked = true;
    private boolean credentialsNonExpired = true;

    // ================== TIMESTAMPS ==================
    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // ================== AUTO GENERATE ID ==================
    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}