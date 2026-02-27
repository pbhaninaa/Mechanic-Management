package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "provider_service_offering")
public class ProviderServiceOffering {

    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    @Column(nullable = false)
    private String providerUsername;

    /** "mechanic" or "carwash" */
    @Column(nullable = false, length = 20)
    private String providerType;

    @Column(nullable = false)
    private String serviceName;

    @Column(nullable = false)
    private Double price;

    public ProviderServiceOffering() {}

    public ProviderServiceOffering(String providerUsername, String providerType, String serviceName, Double price) {
        this.providerUsername = providerUsername;
        this.providerType = providerType;
        this.serviceName = serviceName;
        this.price = price;
    }

    @PrePersist
    public void prePersist() {
        if (id == null) id = UUID.randomUUID().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProviderUsername() { return providerUsername; }
    public void setProviderUsername(String providerUsername) { this.providerUsername = providerUsername; }
    public String getProviderType() { return providerType; }
    public void setProviderType(String providerType) { this.providerType = providerType; }
    public String getServiceName() { return serviceName; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
}
