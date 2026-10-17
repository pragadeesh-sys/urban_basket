package com.urbanbasket.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class PurchaseRequest {

    @NotNull(message = "Supplier ID is required")
    private Long supplierId;

    private String notes;

    @NotEmpty(message = "At least one item must be included in the purchase")
    @Valid
    private List<PurchaseItemRequest> items;
}
