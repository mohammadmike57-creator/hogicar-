
package com.hogicar.model.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum Transmission {
    @JsonProperty("Manual")
    MANUAL,
    @JsonProperty("Automatic")
    AUTOMATIC
}
