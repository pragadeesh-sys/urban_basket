package com.urbanbasket.service;

import com.urbanbasket.dto.SupplierLoginRequest;
import com.urbanbasket.dto.SupplierRequest;
import com.urbanbasket.dto.SupplierResponse;
import com.urbanbasket.entity.Role;
import com.urbanbasket.entity.Supplier;
import com.urbanbasket.entity.User;
import com.urbanbasket.exception.BadRequestException;
import com.urbanbasket.exception.ResourceNotFoundException;
import com.urbanbasket.repository.PurchaseRepository;
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
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final PurchaseRepository purchaseRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<SupplierResponse> getAllSuppliers() {
        return supplierRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SupplierResponse createSupplier(SupplierRequest request) {
        Supplier supplier = Supplier.builder()
                .name(request.getName().trim())
                .contactPerson(request.getContactPerson())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        supplier = supplierRepository.save(supplier);
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                throw new BadRequestException("An email is required to create a supplier login.");
            }
            attachLogin(supplier, request.getLoginName(), request.getEmail(), request.getPassword());
        }
        return mapToResponse(supplier);
    }

    @Transactional
    public SupplierResponse createLogin(Long id, SupplierLoginRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
        if (supplier.getUser() != null) {
            throw new BadRequestException("This supplier already has a login.");
        }
        attachLogin(supplier, request.getFullName(), request.getEmail(), request.getPassword());
        return mapToResponse(supplier);
    }

    private void attachLogin(Supplier supplier, String fullName, String email, String password) {
        String normalized = email.toLowerCase().trim();
        if (userRepository.existsByEmail(normalized)) {
            throw new BadRequestException("An account with this email already exists: " + normalized);
        }
        User user = userRepository.save(User.builder()
                .fullName((fullName == null || fullName.isBlank()) ? supplier.getName() : fullName.trim())
                .email(normalized)
                .password(passwordEncoder.encode(password))
                .phone(supplier.getPhone())
                .role(Role.SUPPLIER)
                .active(true)
                .build());
        supplier.setUser(user);
        supplierRepository.save(supplier);
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, SupplierRequest request) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));

        supplier.setName(request.getName().trim());
        supplier.setContactPerson(request.getContactPerson());
        supplier.setEmail(request.getEmail());
        supplier.setPhone(request.getPhone());
        supplier.setAddress(request.getAddress());
        if (request.getActive() != null) {
            supplier.setActive(request.getActive());
        }

        supplier = supplierRepository.save(supplier);
        return mapToResponse(supplier);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found with id: " + id));
        if (purchaseRepository.countBySupplierId(id) > 0) {
            supplier.setActive(false);
            supplierRepository.save(supplier);
            return;
        }
        supplierRepository.delete(supplier);
    }

    public SupplierResponse mapToResponse(Supplier supplier) {
        return SupplierResponse.builder()
                .id(supplier.getId())
                .name(supplier.getName())
                .contactPerson(supplier.getContactPerson())
                .email(supplier.getEmail())
                .phone(supplier.getPhone())
                .address(supplier.getAddress())
                .active(supplier.isActive())
                .hasLogin(supplier.getUser() != null)
                .loginEmail(supplier.getUser() == null ? null : supplier.getUser().getEmail())
                .createdAt(supplier.getCreatedAt())
                .build();
    }
}
