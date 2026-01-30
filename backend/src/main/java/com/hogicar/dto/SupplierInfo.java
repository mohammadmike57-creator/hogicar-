
package com.hogicar.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SupplierInfo {
    private String name;
    private String logoUrl;
    private double rating;
}
