package com.urbanbasket.service;

import com.urbanbasket.dto.CreateAccountRequest;
import com.urbanbasket.dto.UpdateAccountRequest;
import com.urbanbasket.dto.UpdateStatusRequest;
import com.urbanbasket.dto.UserDto;
import com.urbanbasket.entity.Role;
import com.urbanbasket.entity.User;
import com.urbanbasket.exception.BadRequestException;
import com.urbanbasket.exception.ResourceNotFoundException;
import com.urbanbasket.repository.AttendanceRepository;
import com.urbanbasket.repository.CartRepository;
import com.urbanbasket.repository.ExpenseRepository;
import com.urbanbasket.repository.OrderRepository;
import com.urbanbasket.repository.SupplierRepository;
import com.urbanbasket.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final AttendanceRepository attendanceRepository;
    private final ExpenseRepository expenseRepository;
    private final SupplierRepository supplierRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Transactional
    public UserDto createAccount(CreateAccountRequest request) {
        if (request.getRole() == Role.ADMIN) {
            throw new BadRequestException("Creating additional ADMIN accounts through this endpoint is not permitted.");
        }
        if (request.getRole() != Role.STAFF && request.getRole() != Role.ACCOUNTANT) {
            throw new BadRequestException("Role must be STAFF or ACCOUNTANT.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email already exists: " + request.getEmail());
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(request.getRole())
                .active(true)
                .build();

        user = userRepository.save(user);
        return authService.mapToDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getStaffMembers() {
        return userRepository.findByRoleOrderByCreatedAtDesc(Role.STAFF).stream()
                .map(authService::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAccountants() {
        return userRepository.findByRoleOrderByCreatedAtDesc(Role.ACCOUNTANT).stream()
                .map(authService::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getCustomers() {
        return userRepository.findByRoleOrderByCreatedAtDesc(Role.CUSTOMER).stream()
                .map(authService::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllEmployees() {
        return userRepository.findByRoleInOrderByCreatedAtDesc(List.of(Role.STAFF, Role.ACCOUNTANT, Role.ADMIN)).stream()
                .map(authService::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto updateAccount(Long userId, UpdateAccountRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Administrator details are updated from My Profile.");
        }
        if (user.getRole() == Role.CUSTOMER) {
            if (request.getRole() != Role.CUSTOMER) {
                throw new BadRequestException("A customer account stays a customer.");
            }
        } else if (user.getRole() == Role.STAFF || user.getRole() == Role.ACCOUNTANT) {
            if (request.getRole() != Role.STAFF && request.getRole() != Role.ACCOUNTANT) {
                throw new BadRequestException("Role must be STAFF or ACCOUNTANT.");
            }
        } else if (user.getRole() == Role.SUPPLIER) {
            if (request.getRole() != Role.SUPPLIER) {
                throw new BadRequestException("A supplier account stays a supplier.");
            }
        } else {
            throw new BadRequestException("This account cannot be edited.");
        }

        String email = request.getEmail().toLowerCase().trim();
        if (!email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account with this email already exists: " + email);
        }

        String password = request.getPassword() == null ? "" : request.getPassword().trim();
        if (!password.isEmpty() && password.length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters.");
        }

        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPhone(blankToNull(request.getPhone()));
        user.setRole(request.getRole());
        if (!password.isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
        }
        User saved = userRepository.save(user);
        if (saved.getRole() == Role.SUPPLIER) {
            supplierRepository.findByUser(saved).ifPresent(supplier -> {
                supplier.setContactPerson(saved.getFullName());
                supplier.setPhone(saved.getPhone());
                supplierRepository.save(supplier);
            });
        }
        return authService.mapToDto(saved);
    }

    @Transactional
    public UserDto updateAccountStatus(Long userId, UpdateStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Cannot alter status of administrator accounts.");
        }

        user.setActive(request.getActive());
        user = userRepository.save(user);
        return authService.mapToDto(user);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(authService::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteAccount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Administrator accounts cannot be deleted.");
        }
        if (orderRepository.existsByUser(user)) {
            throw new BadRequestException("This account has order history. Deactivate it instead of deleting it.");
        }
        attendanceRepository.deleteByEmployee(user);
        cartRepository.findByUser(user).ifPresent(cartRepository::delete);
        expenseRepository.clearRecordedBy(user);
        userRepository.delete(user);
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
