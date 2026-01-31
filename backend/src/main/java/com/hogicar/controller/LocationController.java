package com.hogicar.controller;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/locations")
@CrossOrigin(origins = "*")
public class LocationController {

    private static Map<String, String> loc(String name, String country, String code) {
      Map<String, String> m = new HashMap<>();
      m.put("name", name);
      m.put("country", country);
      m.put("code", code);
      m.put("label", name + ", " + country + " (" + code + ")");
      m.put("value", code);
      return m;
    }

    private static String norm(String s) {
      if (s == null) return "";
      // lowercases and removes punctuation/spaces so "du." matches "Dubai"
      return s.toLowerCase().replaceAll("[^a-z0-9]", "");
    }

    private static final List<Map<String, String>> LOCATIONS = Arrays.asList(
      loc("Amman", "Jordan", "AMM"),
      loc("Aqaba", "Jordan", "AQJ"),
      loc("Dubai", "UAE", "DXB"),
      loc("Dubai World Central", "UAE", "DWC"),
      loc("Abu Dhabi", "UAE", "AUH"),
      loc("Sharjah", "UAE", "SHJ"),
      loc("Doha", "Qatar", "DOH"),
      loc("Riyadh", "Saudi Arabia", "RUH"),
      loc("Jeddah", "Saudi Arabia", "JED"),
      loc("Dammam", "Saudi Arabia", "DMM"),
      loc("Kuwait City", "Kuwait", "KWI"),
      loc("Manama", "Bahrain", "BAH"),
      loc("Muscat", "Oman", "MCT"),
      loc("Cairo", "Egypt", "CAI"),
      loc("Alexandria", "Egypt", "HBE"),
      loc("Beirut", "Lebanon", "BEY"),
      loc("Istanbul", "Turkey", "IST"),
      loc("Ankara", "Turkey", "ESB"),
      loc("Athens", "Greece", "ATH"),
      loc("Rome", "Italy", "FCO"),
      loc("Milan", "Italy", "MXP"),
      loc("Paris", "France", "CDG"),
      loc("London Heathrow", "United Kingdom", "LHR"),
      loc("Manchester", "United Kingdom", "MAN"),
      loc("Frankfurt", "Germany", "FRA"),
      loc("Munich", "Germany", "MUC"),
      loc("Amsterdam", "Netherlands", "AMS"),
      loc("Madrid", "Spain", "MAD"),
      loc("Barcelona", "Spain", "BCN"),
      loc("Vienna", "Austria", "VIE"),
      loc("Zurich", "Switzerland", "ZRH"),
      loc("New York JFK", "USA", "JFK"),
      loc("Los Angeles", "USA", "LAX")
    );

    @GetMapping
    public List<Map<String, String>> getLocations(
      @RequestParam(value = "query", required = false) String query
    ) {
      if (query == null || query.trim().isEmpty()) {
        return LOCATIONS;
      }

      String q = norm(query);

      return LOCATIONS.stream()
        .filter(l ->
          norm(l.get("name")).contains(q) ||
          norm(l.get("country")).contains(q) ||
          norm(l.get("code")).contains(q) ||
          norm(l.get("label")).contains(q) ||
          norm(l.get("value")).contains(q)
        )
        .limit(20)
        .collect(Collectors.toList());
    }
}