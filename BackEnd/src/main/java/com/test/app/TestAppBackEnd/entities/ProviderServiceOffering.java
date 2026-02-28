package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "provider_service_offering")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProviderServiceOffering {

    // ================== PRIMARY KEY ==================
    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    // ================== PROVIDER INFO ==================
    @Column(nullable = false, name = "provider_username")
    private String providerUsername;

    /** "mechanic" or "carwash" */
    @Column(nullable = false, length = 20, name = "provider_type")
    private String providerType;

    @Column(nullable = false, name = "provider_id")
    private String providerId;

    // ================== SERVICE INFO ==================
    @Column(nullable = false, name = "service_name")
    private String serviceName;

    @Column(nullable = false)
    private Double price;

    // ================== LOCATION INFO ==================
    @Column(nullable = false)
    private String latitude;

    @Column(nullable = false)
    private String longitude;

    // ================== AUTO GENERATE ID ==================
    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}