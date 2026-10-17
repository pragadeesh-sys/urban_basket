package com.urbanbasket.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateStatusRequest {

    @NotNull(message = "Active status is required")
    private Boolean active;
}
