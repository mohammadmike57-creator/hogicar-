
package com.hogicar.controller;

import com.hogicar.dto.LocationSuggestion;
import com.hogicar.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    public ResponseEntity<List<LocationSuggestion>> getLocations(@RequestParam(name = "query", required = false) String query) {
        List<LocationSuggestion> suggestions = locationService.searchLocations(query);
        return ResponseEntity.ok(suggestions);
    }
}
