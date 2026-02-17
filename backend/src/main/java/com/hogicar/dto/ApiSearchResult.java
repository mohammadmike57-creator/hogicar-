
package com.hogicar.dto;

import com.hogicar.model.enums.CarCategory;
import com.hogicar.model.enums.FuelPolicy;
import com.hogicar.model.enums.Transmission;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiSearchResult {
    private String id;
    private String brand;
    private String model;
    private CarCategory category;
    private double netPrice;
    private Double finalPrice; // Optional
    private String currency;
    private boolean available;
    private String image;
    private int passengers;
    private int bags;
    private int doors;
    private Transmission transmission;
    private boolean airCon;
    private FuelPolicy fuelPolicy;
    private boolean unlimitedMileage;
    private SupplierInfo supplier;
    private String locationDetail;
    private String sippCode;
}
