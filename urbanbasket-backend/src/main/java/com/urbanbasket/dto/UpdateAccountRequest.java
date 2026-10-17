package com.urbanbasket.dto;

import com.urbanbasket.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateAccountRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email is required")
    private String email;

    @Size(max = 20, message = "Phone must be 20 characters or fewer")
    private String phone;

    @Size(max = 100)
    private String password;

    @NotNull(message = "Role is required")
    private Role role;
}
