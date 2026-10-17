package com.urbanbasket.controller;

import com.urbanbasket.dto.CreateAccountRequest;
import com.urbanbasket.dto.UpdateAccountRequest;
import com.urbanbasket.dto.UpdateStatusRequest;
import com.urbanbasket.dto.UserDto;
import com.urbanbasket.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Management", description = "Admin endpoints for managing Staff, Accountants, Customers, and Accounts")
public class AdminController {

    private final AccountService accountService;

    @PostMapping("/accounts")
    @Operation(summary = "Create a new STAFF or ACCOUNTANT employee account")
    public ResponseEntity<UserDto> createAccount(@Valid @RequestBody CreateAccountRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accountService.createAccount(request));
    }

    @GetMapping("/staff")
    @Operation(summary = "List all staff members")
    public ResponseEntity<List<UserDto>> getStaffMembers() {
        return ResponseEntity.ok(accountService.getStaffMembers());
    }

    @GetMapping("/accountants")
    @Operation(summary = "List all accountants")
    public ResponseEntity<List<UserDto>> getAccountants() {
        return ResponseEntity.ok(accountService.getAccountants());
    }

    @GetMapping("/customers")
    @Operation(summary = "List all registered customers")
    public ResponseEntity<List<UserDto>> getCustomers() {
        return ResponseEntity.ok(accountService.getCustomers());
    }

    @GetMapping("/employees")
    @Operation(summary = "List all supermarket employees for attendance tracking")
    public ResponseEntity<List<UserDto>> getEmployees() {
        return ResponseEntity.ok(accountService.getAllEmployees());
    }

    @GetMapping("/accounts")
    @Operation(summary = "List all user accounts")
    public ResponseEntity<List<UserDto>> getAllAccounts() {
        return ResponseEntity.ok(accountService.getAllUsers());
    }

    @PutMapping("/accounts/{id}")
    @Operation(summary = "Update a staff, accountant, or customer account")
    public ResponseEntity<UserDto> updateAccount(@PathVariable Long id,
                                                 @Valid @RequestBody UpdateAccountRequest request) {
        return ResponseEntity.ok(accountService.updateAccount(id, request));
    }

    @PatchMapping("/accounts/{id}/status")
    @Operation(summary = "Activate or deactivate an employee or customer account")
    public ResponseEntity<UserDto> updateAccountStatus(@PathVariable Long id,
                                                       @Valid @RequestBody UpdateStatusRequest request) {
        return ResponseEntity.ok(accountService.updateAccountStatus(id, request));
    }

    @DeleteMapping("/accounts/{id}")
    @Operation(summary = "Delete a user account")
    public ResponseEntity<Void> deleteAccount(@PathVariable Long id) {
        accountService.deleteAccount(id);
        return ResponseEntity.noContent().build();
    }
}
