
package com.hogicar.model.enums;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum FuelPolicy {
    @JsonProperty("Full to Full")
    FULL_TO_FULL,
    @JsonProperty("Same to Same")
    SAME_TO_SAME
}
