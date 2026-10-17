package com.urbanbasket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String productSku;
    private String productCategory;
    private String productImageUrl;
    private BigDecimal unitPrice;
    private Integer quantity;
    private Integer availableStock;
    private BigDecimal subtotal;
}
