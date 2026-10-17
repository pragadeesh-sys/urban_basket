package com.urbanbasket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseResponse {
    private Long id;
    private String title;
    private String category;
    private BigDecimal amount;
    private LocalDate expenseDate;
    private String description;
    private String recordedByName;
    private LocalDateTime createdAt;
}
