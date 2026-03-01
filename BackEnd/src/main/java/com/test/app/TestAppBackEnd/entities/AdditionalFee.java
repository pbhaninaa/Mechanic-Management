package com.test.app.TestAppBackEnd.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "additional_fees", uniqueConstraints = @UniqueConstraint(columnNames = "fee_key"))
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AdditionalFee {

    @Id
    @Column(length = 36, updatable = false, nullable = false)
    private String id;

    /** Unique key e.g. callOut, towing */
    @Column(name = "fee_key", nullable = false, unique = true, length = 50)
    private String feeKey;

    @Column(nullable = false)
    private Double amount;

    private String description;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }
}
