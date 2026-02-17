
package com.hogicar.model.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum CarCategory {
    @JsonProperty("Economy")
    ECONOMY,
    @JsonProperty("Compact")
    COMPACT,
    @JsonProperty("SUV")
    SUV,
    @JsonProperty("Luxury")
    LUXURY,
    @JsonProperty("Van")
    VAN,
    @JsonProperty("Mini")
    MINI,
    @JsonProperty("Midsize")
    MIDSIZE,
    @JsonProperty("Full-size")
    FULLSIZE,
    @JsonProperty("People Carrier")
    PEOPLE_CARRIER
}
