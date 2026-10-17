package com.urbanbasket.service;

import com.urbanbasket.dto.ChartDataPoint;
import com.urbanbasket.dto.DashboardSummaryResponse;
import com.urbanbasket.dto.FinancialReportResponse;
import com.urbanbasket.dto.ProductResponse;
import com.urbanbasket.dto.TopProductResponse;
import com.urbanbasket.entity.Role;
import com.urbanbasket.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PurchaseRepository purchaseRepository;
    private final ExpenseRepository expenseRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.atTime(LocalTime.MAX);

        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = today.atTime(LocalTime.MAX);

        BigDecimal todaySales = orderRepository.sumTotalSalesBetween(startOfToday, endOfToday);
        BigDecimal monthlySales = orderRepository.sumTotalSalesBetween(startOfMonth, endOfMonth);
        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.count();
        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);
        long lowStockCount = productRepository.countLowStockProducts();

        BigDecimal totalPurchases = purchaseRepository.sumTotalPurchasesBetween(startOfMonth, endOfMonth);
        BigDecimal totalExpenses = expenseRepository.sumExpensesBetween(today.withDayOfMonth(1), today);

        // Gross Profit = Sales - Purchases
        BigDecimal grossProfit = monthlySales.subtract(totalPurchases);
        // Net Profit = Gross Profit - Expenses
        BigDecimal netProfit = grossProfit.subtract(totalExpenses);

        List<ProductResponse> lowStockList = productService.getLowStockProducts();

        // Monthly sales chart (last 7 days or last 6 months)
        List<ChartDataPoint> monthlySalesChart = generateLastDaysSalesChart(7);

        // Category sales breakdown
        List<ChartDataPoint> categorySalesChart = generateCategorySalesChart();

        // Expense category breakdown
        List<ChartDataPoint> expenseBreakdownChart = generateExpenseCategoryChart(today.withDayOfMonth(1), today);

        return DashboardSummaryResponse.builder()
                .todaySales(todaySales != null ? todaySales : BigDecimal.ZERO)
                .monthlySales(monthlySales != null ? monthlySales : BigDecimal.ZERO)
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .totalCustomers(totalCustomers)
                .lowStockCount(lowStockCount)
                .totalPurchases(totalPurchases != null ? totalPurchases : BigDecimal.ZERO)
                .totalExpenses(totalExpenses != null ? totalExpenses : BigDecimal.ZERO)
                .grossProfit(grossProfit)
                .netProfit(netProfit)
                .monthlySalesChart(monthlySalesChart)
                .categorySalesChart(categorySalesChart)
                .expenseBreakdownChart(expenseBreakdownChart)
                .lowStockProducts(lowStockList)
                .build();
    }

    @Transactional(readOnly = true)
    public FinancialReportResponse getFinancialReport(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) {
            startDate = LocalDate.now().withDayOfMonth(1);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }

        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(LocalTime.MAX);

        BigDecimal totalRevenue = orderRepository.sumTotalSalesBetween(startDateTime, endDateTime);
        BigDecimal totalPurchases = purchaseRepository.sumTotalPurchasesBetween(startDateTime, endDateTime);
        BigDecimal totalExpenses = expenseRepository.sumExpensesBetween(startDate, endDate);
        long totalOrders = orderRepository.countOrdersBetween(startDateTime, endDateTime);

        BigDecimal grossProfit = totalRevenue.subtract(totalPurchases);
        BigDecimal netProfit = grossProfit.subtract(totalExpenses);

        List<ChartDataPoint> expenseBreakdown = generateExpenseCategoryChart(startDate, endDate);
        List<ChartDataPoint> categoryRevenue = generateCategorySalesChart();

        return FinancialReportResponse.builder()
                .startDate(startDate)
                .endDate(endDate)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalPurchases(totalPurchases != null ? totalPurchases : BigDecimal.ZERO)
                .totalExpenses(totalExpenses != null ? totalExpenses : BigDecimal.ZERO)
                .grossProfit(grossProfit)
                .netProfit(netProfit)
                .totalOrdersCount(totalOrders)
                .expenseBreakdown(expenseBreakdown)
                .categoryRevenueBreakdown(categoryRevenue)
                .build();
    }

    @Transactional(readOnly = true)
    public FinancialReportResponse getFinancialReport(int month, int year) {
        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return getFinancialReport(start, end);
    }

    @Transactional(readOnly = true)
    public List<ChartDataPoint> getSalesChart(String period) {
        String normalized = period == null ? "WEEKLY" : period.trim().toUpperCase();
        return switch (normalized) {
            case "DAILY" -> generateLastDaysSalesChart(7);
            case "MONTHLY" -> generateLastMonthsSalesChart(6);
            default -> generateLastWeeksSalesChart(8);
        };
    }

    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopProducts() {
        List<Object[]> rows = orderItemRepository.findTopSellingProducts();
        List<TopProductResponse> products = new ArrayList<>();
        if (rows == null) {
            return products;
        }
        int limit = Math.min(rows.size(), 8);
        for (int i = 0; i < limit; i++) {
            Object[] row = rows.get(i);
            products.add(TopProductResponse.builder()
                    .name(row[0] != null ? row[0].toString() : "Unknown")
                    .unitsSold(row[1] instanceof Number number ? number.longValue() : 0L)
                    .revenue(toBigDecimal(row[2]))
                    .build());
        }
        return products;
    }

    private List<ChartDataPoint> generateLastDaysSalesChart(int days) {
        List<ChartDataPoint> points = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);
            BigDecimal daySales = orderRepository.sumTotalSalesBetween(start, end);
            points.add(ChartDataPoint.builder()
                    .name(date.format(formatter))
                    .value(daySales != null ? daySales : BigDecimal.ZERO)
                    .build());
        }

        return points;
    }

    private List<ChartDataPoint> generateLastWeeksSalesChart(int weeks) {
        List<ChartDataPoint> points = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd");
        for (int i = weeks - 1; i >= 0; i--) {
            LocalDate end = today.minusWeeks(i);
            LocalDate start = end.minusDays(6);
            BigDecimal sales = orderRepository.sumTotalSalesBetween(start.atStartOfDay(), end.atTime(LocalTime.MAX));
            points.add(ChartDataPoint.builder()
                    .name(start.format(formatter))
                    .value(sales != null ? sales : BigDecimal.ZERO)
                    .build());
        }
        return points;
    }

    private List<ChartDataPoint> generateLastMonthsSalesChart(int months) {
        List<ChartDataPoint> points = new ArrayList<>();
        LocalDate today = LocalDate.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy");
        for (int i = months - 1; i >= 0; i--) {
            LocalDate month = today.minusMonths(i).withDayOfMonth(1);
            LocalDate end = month.withDayOfMonth(month.lengthOfMonth());
            BigDecimal sales = orderRepository.sumTotalSalesBetween(month.atStartOfDay(), end.atTime(LocalTime.MAX));
            points.add(ChartDataPoint.builder()
                    .name(month.format(formatter))
                    .value(sales != null ? sales : BigDecimal.ZERO)
                    .build());
        }
        return points;
    }

    private List<ChartDataPoint> generateCategorySalesChart() {
        List<Object[]> rawList = orderItemRepository.sumSalesByCategory();
        List<ChartDataPoint> points = new ArrayList<>();

        if (rawList != null) {
            for (Object[] row : rawList) {
                if (row[0] != null && row[1] != null) {
                    points.add(ChartDataPoint.builder()
                            .name(row[0].toString())
                            .value(toBigDecimal(row[1]))
                            .build());
                }
            }
        }

        return points;
    }

    private List<ChartDataPoint> generateExpenseCategoryChart(LocalDate start, LocalDate end) {
        List<Object[]> rawList = expenseRepository.sumExpensesByCategoryBetween(start, end);
        List<ChartDataPoint> points = new ArrayList<>();

        if (rawList != null) {
            for (Object[] row : rawList) {
                if (row[0] != null && row[1] != null) {
                    points.add(ChartDataPoint.builder()
                            .name(row[0].toString())
                            .value(toBigDecimal(row[1]))
                            .build());
                }
            }
        }

        return points;
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal decimal) {
            return decimal;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        return new BigDecimal(value.toString());
    }
}
