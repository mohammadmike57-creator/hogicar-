
package com.hogicar.service;

import com.hogicar.dto.LocationSuggestion;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
public class LocationService {

    private static final List<LocationSuggestion> LOCATIONS = new ArrayList<>();
    private static final List<LocationSuggestion> DEFAULT_LOCATIONS = new ArrayList<>();

    static {
        // Populate the in-memory list of locations
        LOCATIONS.add(new LocationSuggestion("DXB", "Dubai International Airport (DXB), Dubai, AE", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("DWC", "Al Maktoum International Airport (DWC), Dubai, AE", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("AUH", "Abu Dhabi International Airport (AUH), Abu Dhabi, AE", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("SHJ", "Sharjah International Airport (SHJ), Sharjah, AE", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("DOH", "Hamad International Airport (DOH), Doha, QA", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("RUH", "King Khalid International Airport (RUH), Riyadh, SA", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("JED", "King Abdulaziz International Airport (JED), Jeddah, SA", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("KWI", "Kuwait International Airport (KWI), Kuwait City, KW", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("MCT", "Muscat International Airport (MCT), Muscat, OM", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("BAH", "Bahrain International Airport (BAH), Manama, BH", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("LHR", "London Heathrow Airport (LHR), London, GB", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("JFK", "John F. Kennedy International Airport (JFK), New York, US", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("LAX", "Los Angeles International Airport (LAX), Los Angeles, US", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("CDG", "Charles de Gaulle Airport (CDG), Paris, FR", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("AMS", "Amsterdam Airport Schiphol (AMS), Amsterdam, NL", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("FRA", "Frankfurt Airport (FRA), Frankfurt, DE", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("IST", "Istanbul Airport (IST), Istanbul, TR", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("SYD", "Sydney Kingsford Smith Airport (SYD), Sydney, AU", "AIRPORT"));
        LOCATIONS.add(new LocationSuggestion("YYZ", "Toronto Pearson International Airport (YYZ), Toronto, CA", "AIRPORT"));

        // Populate default list
        DEFAULT_LOCATIONS.addAll(LOCATIONS.stream().filter(l -> List.of("DXB", "DWC", "AUH", "SHJ", "DOH", "RUH", "JED", "KWI", "MCT", "BAH").contains(l.value())).toList());
    }

    public List<LocationSuggestion> searchLocations(String query) {
        // Return default list if query is blank or null
        if (query == null || query.isBlank()) {
            return DEFAULT_LOCATIONS;
        }

        final String lowerCaseQuery = query.toLowerCase();

        // Filter where query matches label or value (contains)
        Stream<LocationSuggestion> filteredStream = LOCATIONS.stream()
                .filter(location -> location.label().toLowerCase().contains(lowerCaseQuery) ||
                                     location.value().toLowerCase().contains(lowerCaseQuery));

        // Sort results: exact value match first, then label startsWith, then label contains
        List<LocationSuggestion> sortedList = filteredStream.sorted(
                Comparator.comparing((LocationSuggestion loc) -> loc.value().equalsIgnoreCase(lowerCaseQuery)).reversed()
                          .thenComparing(loc -> loc.label().toLowerCase().startsWith(lowerCaseQuery)).reversed()
        ).toList();


        // Limit to max 10 results
        return sortedList.stream().limit(10).toList();
    }
}
