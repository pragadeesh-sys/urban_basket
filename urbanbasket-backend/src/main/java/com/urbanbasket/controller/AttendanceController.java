package com.urbanbasket.controller;

import com.urbanbasket.dto.AttendanceRequest;
import com.urbanbasket.dto.AttendanceResponse;
import com.urbanbasket.service.AttendanceService;
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

@RestController
@RequiredArgsConstructor
@Tag(name = "Attendance Management", description = "Attendance tracking and view-only reporting")
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/api/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'ACCOUNTANT')")
    @Operation(summary = "Get attendance records (View-only for Staff and Accountant, Full for Admin)")
    public ResponseEntity<Page<AttendanceResponse>> getAttendance(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ResponseEntity.ok(attendanceService.getAttendanceList(userDetails.getUsername(), page, size));
    }

    @PostMapping("/api/admin/attendance")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Record attendance for an employee (Admin only)")
    public ResponseEntity<AttendanceResponse> recordAttendance(@Valid @RequestBody AttendanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.recordAttendance(request));
    }

    @PutMapping("/api/admin/attendance/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update employee attendance record (Admin only)")
    public ResponseEntity<AttendanceResponse> updateAttendance(@PathVariable Long id,
                                                               @Valid @RequestBody AttendanceRequest request) {
        return ResponseEntity.ok(attendanceService.updateAttendance(id, request));
    }

    @DeleteMapping("/api/admin/attendance/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete attendance record (Admin only)")
    public ResponseEntity<Void> deleteAttendance(@PathVariable Long id) {
        attendanceService.deleteAttendance(id);
        return ResponseEntity.noContent().build();
    }
}
