
package com.hogicar.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Data
@NoArgsConstructor
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String bookingRef;

    private Long supplierId;
    private String supplierName;
    private String pickupCode;
    private String dropoffCode;
    private String pickupDate;
    private String dropoffDate;
    private String currency;
    private BigDecimal netPrice;
    private Double commissionPercent;

    private String firstName;
    private String lastName;
    private String email;
    private String phone;

    // Calculated fields
    private BigDecimal finalPrice;
    private BigDecimal payNow; // This is the commissionAmount
    private BigDecimal payAtDesk;

    private String status;
}
