package com.urbanbasket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {
    private BigDecimal todaySales;
    private BigDecimal monthlySales;
    private long totalOrders;
    private long totalProducts;
    private long totalCustomers;
    private long lowStockCount;
    private BigDecimal totalPurchases;
    private BigDecimal totalExpenses;
    private BigDecimal grossProfit; // Total Sales - Total Purchases
    private BigDecimal netProfit;   // Gross Profit - Total Expenses

    @Builder.Default
    private List<ChartDataPoint> monthlySalesChart = new ArrayList<>();
    @Builder.Default
    private List<ChartDataPoint> categorySalesChart = new ArrayList<>();
    @Builder.Default
    private List<ChartDataPoint> expenseBreakdownChart = new ArrayList<>();
    @Builder.Default
    private List<ProductResponse> lowStockProducts = new ArrayList<>();
}
