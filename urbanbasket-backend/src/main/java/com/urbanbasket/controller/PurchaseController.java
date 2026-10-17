package com.urbanbasket.controller;

import com.urbanbasket.dto.PurchaseRequest;
import com.urbanbasket.dto.PurchaseResponse;
import com.urbanbasket.service.PurchaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/purchases")
@RequiredArgsConstructor
@Tag(name = "Purchases", description = "Low-stock purchase requests and supplier delivery")
public class PurchaseController {

    private final PurchaseService purchaseService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'ACCOUNTANT')")
    @Operation(summary = "Get paginated purchase orders")
    public ResponseEntity<Page<PurchaseResponse>> getPurchases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(purchaseService.getPurchases(page, size));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "List purchase requests sent to the signed-in supplier")
    public ResponseEntity<List<PurchaseResponse>> getMyRequests(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(purchaseService.getMyRequests(userDetails.getUsername()));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    @Operation(summary = "Request stock from a supplier for low-stock products")
    public ResponseEntity<PurchaseResponse> createPurchase(@AuthenticationPrincipal UserDetails userDetails,
                                                           @Valid @RequestBody PurchaseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(purchaseService.createPurchase(request, userDetails.getUsername()));
    }

    @PostMapping("/{id}/deliver")
    @PreAuthorize("hasRole('SUPPLIER')")
    @Operation(summary = "Deliver a purchase request and add the stock")
    public ResponseEntity<PurchaseResponse> deliver(@PathVariable Long id,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(purchaseService.deliver(id, userDetails.getUsername()));
    }
}
