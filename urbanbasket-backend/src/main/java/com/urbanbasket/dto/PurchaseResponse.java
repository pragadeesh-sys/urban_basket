package com.urbanbasket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseResponse {
    private Long id;
    private String purchaseNumber;
    private Long supplierId;
    private String supplierName;
    private LocalDateTime purchaseDate;
    private BigDecimal totalAmount;
    private String notes;
    @Builder.Default
    private String status = "RECEIVED";
    @Builder.Default
    private List<PurchaseItemResponse> items = new ArrayList<>();
}
