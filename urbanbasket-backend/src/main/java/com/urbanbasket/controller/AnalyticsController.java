package com.urbanbasket.controller;

import com.urbanbasket.dto.ChartDataPoint;
import com.urbanbasket.dto.DashboardSummaryResponse;
import com.urbanbasket.dto.FinancialReportResponse;
import com.urbanbasket.dto.TopProductResponse;
import com.urbanbasket.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics & Reports", description = "Dashboard analytics, financial reporting, profit & loss")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get aggregated supermarket dashboard summary with live database totals & charts")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary() {
        return ResponseEntity.ok(analyticsService.getDashboardSummary());
    }

    @GetMapping("/sales")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Sales trend for daily, weekly, or monthly periods")
    public ResponseEntity<List<ChartDataPoint>> getSalesChart(@RequestParam(defaultValue = "WEEKLY") String period) {
        return ResponseEntity.ok(analyticsService.getSalesChart(period));
    }

    @GetMapping("/top-products")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Top selling products by revenue")
    public ResponseEntity<List<TopProductResponse>> getTopProducts() {
        return ResponseEntity.ok(analyticsService.getTopProducts());
    }

    @GetMapping("/financial")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Financial report for a calendar month")
    public ResponseEntity<FinancialReportResponse> getMonthlyFinancialReport(
            @RequestParam int month,
            @RequestParam int year
    ) {
        return ResponseEntity.ok(analyticsService.getFinancialReport(month, year));
    }

    @GetMapping("/financial-report")
    @PreAuthorize("hasAnyRole('ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Get financial report filtered by date range")
    public ResponseEntity<FinancialReportResponse> getFinancialReport(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        return ResponseEntity.ok(analyticsService.getFinancialReport(startDate, endDate));
    }
}
