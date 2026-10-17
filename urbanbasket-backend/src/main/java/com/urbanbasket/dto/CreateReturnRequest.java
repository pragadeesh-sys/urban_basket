package com.urbanbasket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateReturnRequest {

    @NotNull(message = "Order is required")
    private Long orderId;

    @NotBlank(message = "A reason is required")
    @Size(max = 500, message = "Reason must be 500 characters or fewer")
    private String reason;
}
