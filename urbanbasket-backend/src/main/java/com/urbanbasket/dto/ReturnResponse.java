package com.urbanbasket.dto;

import com.urbanbasket.entity.ReturnStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class ReturnResponse {
    private Long id;
    private Long orderId;
    private String orderNumber;
    private String customerName;
    private String customerEmail;
    private BigDecimal totalAmount;
    private String reason;
    private ReturnStatus status;
    private LocalDateTime requestedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime refundedAt;
}
