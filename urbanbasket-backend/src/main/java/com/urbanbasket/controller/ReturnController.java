package com.urbanbasket.controller;

import com.urbanbasket.dto.CreateReturnRequest;
import com.urbanbasket.dto.ReturnResponse;
import com.urbanbasket.service.ReturnService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/returns")
@RequiredArgsConstructor
@Tag(name = "Returns", description = "Customer return requests and staff review")
public class ReturnController {

    private final ReturnService returnService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Request a return for a delivered order")
    public ResponseEntity<ReturnResponse> requestReturn(@AuthenticationPrincipal UserDetails userDetails,
                                                        @Valid @RequestBody CreateReturnRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(returnService.requestReturn(userDetails.getUsername(), request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "List the current customer's return requests")
    public ResponseEntity<List<ReturnResponse>> getMyReturns(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(returnService.getMyReturns(userDetails.getUsername()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'ACCOUNTANT')")
    @Operation(summary = "List every return request")
    public ResponseEntity<List<ReturnResponse>> getAllReturns() {
        return ResponseEntity.ok(returnService.getAllReturns());
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Approve a return and restock the order")
    public ResponseEntity<ReturnResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(returnService.approve(id));
    }

    @PatchMapping("/{id}/refund")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Mark an approved return as refunded")
    public ResponseEntity<ReturnResponse> refund(@PathVariable Long id) {
        return ResponseEntity.ok(returnService.refund(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Reject a return request")
    public ResponseEntity<ReturnResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(returnService.reject(id));
    }
}
