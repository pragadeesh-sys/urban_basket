package com.urbanbasket.controller;

import com.urbanbasket.dto.AddToCartRequest;
import com.urbanbasket.dto.CartDto;
import com.urbanbasket.dto.UpdateCartItemRequest;
import com.urbanbasket.service.CartService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
@Tag(name = "Customer Cart", description = "Shopping cart endpoints for Customers")
public class CartController {

    private final CartService cartService;

    @GetMapping
    @Operation(summary = "Get current customer's shopping cart")
    public ResponseEntity<CartDto> getCart(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(cartService.getCustomerCart(userDetails.getUsername()));
    }

    @PostMapping("/items")
    @Operation(summary = "Add an item to customer's shopping cart")
    public ResponseEntity<CartDto> addItem(@AuthenticationPrincipal UserDetails userDetails,
                                           @Valid @RequestBody AddToCartRequest request) {
        return ResponseEntity.ok(cartService.addItemToCart(userDetails.getUsername(), request));
    }

    @PatchMapping("/items/{id}")
    @Operation(summary = "Update cart item quantity")
    public ResponseEntity<CartDto> updateQuantity(@AuthenticationPrincipal UserDetails userDetails,
                                                  @PathVariable Long id,
                                                  @Valid @RequestBody UpdateCartItemRequest request) {
        return ResponseEntity.ok(cartService.updateItemQuantity(userDetails.getUsername(), id, request));
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Remove an item from the cart")
    public ResponseEntity<CartDto> removeItem(@AuthenticationPrincipal UserDetails userDetails,
                                              @PathVariable Long id) {
        return ResponseEntity.ok(cartService.removeItem(userDetails.getUsername(), id));
    }
}
