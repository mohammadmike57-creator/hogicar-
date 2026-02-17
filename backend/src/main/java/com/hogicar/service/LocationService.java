package com.hogicar.service;

import com.amadeus.Amadeus;
import com.amadeus.Params;
import com.amadeus.exceptions.ResponseException;
import com.amadeus.resources.Location;
import com.hogicar.dto.LocationSuggestion;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;

@Service
public class LocationService {

    private static final Logger logger = LoggerFactory.getLogger(LocationService.class);

    // Static list is kept for default/fallback behavior
    private static final List<LocationSuggestion> DEFAULT_LOCATIONS = List.of(
            new LocationSuggestion("DXB", "Dubai International Airport (DXB), Dubai, AE", "AIRPORT"),
            new LocationSuggestion("AUH", "Abu Dhabi International Airport (AUH), Abu Dhabi, AE", "AIRPORT"),
            new LocationSuggestion("LHR", "London Heathrow Airport (LHR), London, GB", "AIRPORT"),
            new LocationSuggestion("JFK", "John F. Kennedy International Airport (JFK), New York, US", "AIRPORT"),
            new LocationSuggestion("CDG", "Charles de Gaulle Airport (CDG), Paris, FR", "AIRPORT")
    );

    @Value("${amadeus.client.id:}")
    private String amadeusClientId;

    @Value("${amadeus.client.secret:}")
    private String amadeusClientSecret;

    private Amadeus amadeus;

    @PostConstruct
    public void init() {
        if (amadeusClientId.isEmpty() || amadeusClientSecret.isEmpty()) {
            logger.warn("Amadeus API credentials are not configured. Location service will use mock data.");
            return;
        }
        try {
            this.amadeus = Amadeus
                .builder(amadeusClientId, amadeusClientSecret)
                .build();
            logger.info("Amadeus client initialized successfully.");
        } catch (Exception e) {
            logger.error("Failed to initialize Amadeus client. Falling back to mock data.", e);
            this.amadeus = null; // Ensure client is null on failure
        }
    }

    public List<LocationSuggestion> searchLocations(String query) {
        // Fallback conditions: Amadeus client not initialized, or query is too short
        if (amadeus == null || query == null || query.trim().length() < 2) {
            return DEFAULT_LOCATIONS;
        }

        try {
            // Call Amadeus Airport & City Search API
            Location[] locations = amadeus.referenceData.locations.get(Params
                .with("keyword", query)
                .and("subType", "AIRPORT,CITY"));

            if (locations == null) {
                return DEFAULT_LOCATIONS;
            }

            // Map the Amadeus SDK response to our LocationSuggestion DTO
            return Arrays.stream(locations)
                .filter(loc -> loc.getIataCode() != null && loc.getAddress() != null) // Ensure essential data is present
                .map(loc -> new LocationSuggestion(
                    loc.getIataCode(),
                    String.format("%s, %s (%s)", loc.getName(), loc.getAddress().getCountryCode(), loc.getIataCode()),
                    loc.getSubType() // "AIRPORT" or "CITY"
                ))
                .limit(10) // Limit to 10 results
                .toList();

        } catch (ResponseException e) {
            logger.error("Amadeus API request failed with status code {}. Returning default locations.", e.getStatusCode(), e);
            return DEFAULT_LOCATIONS; // Safety fallback on API error
        }
    }
}