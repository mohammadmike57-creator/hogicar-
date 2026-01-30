
package com.hogicar.controller;

import com.hogicar.dto.ApiSearchResult;
import com.hogicar.dto.SupplierInfo;
import com.hogicar.model.enums.CarCategory;
import com.hogicar.model.enums.FuelPolicy;
import com.hogicar.model.enums.Transmission;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cars")
@CrossOrigin(origins = "*")
public class CarController {

    @GetMapping
    public ResponseEntity<List<ApiSearchResult>> getCars() {
        // This is a mock implementation to ensure the endpoint works.
        // In a real application, this data would come from a service layer.
        List<ApiSearchResult> cars = List.of(
            new ApiSearchResult(
                "c1", "Toyota", "Corolla", CarCategory.COMPACT, 45.0, 55.0, "USD", true,
                "https://images.unsplash.com/photo-1590362891991-f776e747a588?q=80&w=2069&auto=format&fit=crop",
                5, 2, 4, Transmission.AUTOMATIC, true, FuelPolicy.FULL_TO_FULL, true,
                new SupplierInfo("Alamo", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Alamo_Rent_A_Car_logo.svg/2560px-Alamo_Rent_A_Car_logo.svg.png", 4.8),
                "In Terminal - Main Arrivals Hall", "CDAR"
            ),
            new ApiSearchResult(
                "c2", "Ford", "Mustang Convertible", CarCategory.LUXURY, 80.0, 95.0, "USD", true,
                "https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?q=80&w=2070&auto=format&fit=crop",
                4, 2, 2, Transmission.AUTOMATIC, true, FuelPolicy.FULL_TO_FULL, false,
                new SupplierInfo("Hertz", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Hertz_logo.svg/2560px-Hertz_logo.svg.png", 4.5),
                "Meet & Greet Service", "STAR"
            ),
             new ApiSearchResult(
                "c3", "Jeep", "Wrangler", CarCategory.SUV, 75.0, null, "USD", true,
                "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
                5, 3, 4, Transmission.AUTOMATIC, true, FuelPolicy.FULL_TO_FULL, true,
                new SupplierInfo("Alamo", "https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Alamo_Rent_A_Car_logo.svg/2560px-Alamo_Rent_A_Car_logo.svg.png", 4.8),
                "Shuttle Bus to Depot", "SFAR"
            ),
             new ApiSearchResult(
                "c4", "Fiat", "500", CarCategory.MINI, 30.0, 35.0, "USD", true,
                "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop",
                4, 1, 2, Transmission.MANUAL, true, FuelPolicy.SAME_TO_SAME, false,
                new SupplierInfo("Europcar", "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Europcar_Logo.svg/2560px-Europcar_Logo.svg.png", 4.4),
                "In Terminal - Counter in T2", "MBMR"
            )
        );
        return ResponseEntity.ok(cars);
    }
}
