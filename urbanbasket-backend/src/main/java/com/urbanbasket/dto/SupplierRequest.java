package com.urbanbasket.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SupplierRequest {

    @NotBlank(message = "Supplier name is required")
    private String name;

    private String contactPerson;
    private String email;
    private String phone;
    private String address;
    private Boolean active;

    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String loginName;
}
