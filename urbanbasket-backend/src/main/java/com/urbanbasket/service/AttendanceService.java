package com.urbanbasket.service;

import com.urbanbasket.dto.AttendanceRequest;
import com.urbanbasket.dto.AttendanceResponse;
import com.urbanbasket.entity.Attendance;
import com.urbanbasket.entity.Role;
import com.urbanbasket.entity.User;
import com.urbanbasket.exception.BadRequestException;
import com.urbanbasket.exception.ResourceNotFoundException;
import com.urbanbasket.repository.AttendanceRepository;
import com.urbanbasket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<AttendanceResponse> getAttendanceList(String currentUserEmail, int page, int size) {
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + currentUserEmail));

        Pageable pageable = PageRequest.of(page, size);

        // Staff sees only their own attendance; Admin and Accountant see all staff/employees
        if (currentUser.getRole() == Role.STAFF) {
            return attendanceRepository.findByEmployeeOrderByAttendanceDateDesc(currentUser, pageable)
                    .map(this::mapToResponse);
        }

        return attendanceRepository.findAllByOrderByAttendanceDateDesc(pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public AttendanceResponse recordAttendance(AttendanceRequest request) {
        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + request.getEmployeeId()));

        if (attendanceRepository.existsByEmployeeAndAttendanceDate(employee, request.getAttendanceDate())) {
            throw new BadRequestException("An attendance record already exists for " + employee.getFullName() +
                    " on " + request.getAttendanceDate() + ". Use edit to modify.");
        }

        Attendance attendance = Attendance.builder()
                .employee(employee)
                .attendanceDate(request.getAttendanceDate())
                .checkIn(request.getCheckIn())
                .checkOut(request.getCheckOut())
                .status(request.getStatus())
                .remarks(request.getRemarks())
                .build();

        attendance = attendanceRepository.save(attendance);
        return mapToResponse(attendance);
    }

    @Transactional
    public AttendanceResponse updateAttendance(Long id, AttendanceRequest request) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found with id: " + id));

        User employee = userRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + request.getEmployeeId()));

        if (attendanceRepository.existsByEmployeeAndAttendanceDateAndIdNot(employee, request.getAttendanceDate(), id)) {
            throw new BadRequestException("Duplicate attendance record already exists for " + employee.getFullName() +
                    " on " + request.getAttendanceDate());
        }

        attendance.setEmployee(employee);
        attendance.setAttendanceDate(request.getAttendanceDate());
        attendance.setCheckIn(request.getCheckIn());
        attendance.setCheckOut(request.getCheckOut());
        attendance.setStatus(request.getStatus());
        attendance.setRemarks(request.getRemarks());

        attendance = attendanceRepository.save(attendance);
        return mapToResponse(attendance);
    }

    @Transactional
    public void deleteAttendance(Long id) {
        if (!attendanceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Attendance record not found with id: " + id);
        }
        attendanceRepository.deleteById(id);
    }

    public AttendanceResponse mapToResponse(Attendance attendance) {
        return AttendanceResponse.builder()
                .id(attendance.getId())
                .employeeId(attendance.getEmployee().getId())
                .employeeName(attendance.getEmployee().getFullName())
                .employeeEmail(attendance.getEmployee().getEmail())
                .employeeRole(attendance.getEmployee().getRole().name())
                .attendanceDate(attendance.getAttendanceDate())
                .checkIn(attendance.getCheckIn())
                .checkOut(attendance.getCheckOut())
                .status(attendance.getStatus())
                .remarks(attendance.getRemarks())
                .build();
    }
}
