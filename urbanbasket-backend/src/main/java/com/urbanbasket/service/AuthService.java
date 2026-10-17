package com.urbanbasket.service;

import com.urbanbasket.dto.AuthResponse;
import com.urbanbasket.dto.ForgotPasswordRequest;
import com.urbanbasket.dto.ForgotPasswordResponse;
import com.urbanbasket.dto.LoginRequest;
import com.urbanbasket.dto.RegisterRequest;
import com.urbanbasket.dto.ResetPasswordRequest;
import com.urbanbasket.dto.UpdateProfileRequest;
import com.urbanbasket.dto.UserDto;
import com.urbanbasket.entity.Cart;
import com.urbanbasket.entity.Role;
import com.urbanbasket.entity.User;
import com.urbanbasket.exception.BadRequestException;
import com.urbanbasket.repository.CartRepository;
import com.urbanbasket.repository.UserRepository;
import com.urbanbasket.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("An account with this email already exists: " + request.getEmail());
        }

        // Public registration MUST ONLY create CUSTOMER accounts
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(Role.CUSTOMER)
                .active(true)
                .build();

        user = userRepository.save(user);

        // Initialize shopping cart for new customer
        Cart cart = Cart.builder()
                .user(user)
                .build();
        cartRepository.save(cart);

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .user(mapToDto(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail().toLowerCase().trim(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new BadRequestException("Invalid credentials"));

        if (!user.isActive()) {
            throw new BadRequestException("Your account is deactivated. Please contact the administrator.");
        }

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .user(mapToDto(user))
                .build();
    }

    @Transactional
    public ForgotPasswordResponse requestPasswordReset(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found for this email."));

        if (!user.isActive()) {
            throw new BadRequestException("Your account is deactivated. Please contact the administrator.");
        }

        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        user.setResetOtp(otp);
        user.setResetOtpExpiresAt(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        return ForgotPasswordResponse.builder()
                .message("Your reset code is ready. It expires in 10 minutes.")
                .otp(otp)
                .build();
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found for this email."));

        if (user.getResetOtp() == null || user.getResetOtpExpiresAt() == null
                || user.getResetOtpExpiresAt().isBefore(LocalDateTime.now())
                || !user.getResetOtp().equals(request.getOtp())) {
            throw new BadRequestException("The code is incorrect or has expired.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetOtp(null);
        user.setResetOtpExpiresAt(null);
        userRepository.save(user);
    }

    @Transactional
    public AuthResponse updateProfile(String currentEmail, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(currentEmail)
                .orElseThrow(() -> new BadRequestException("User not found: " + currentEmail));
        if (user.getRole() != Role.ADMIN && user.getRole() != Role.CUSTOMER) {
            throw new BadRequestException("Update this account from Account Management.");
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
        user.setPhone(request.getPhone() == null || request.getPhone().isBlank() ? null : request.getPhone().trim());
        if (!password.isEmpty()) {
            user.setPassword(passwordEncoder.encode(password));
        }
        user = userRepository.save(user);

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token)
                .user(mapToDto(user))
                .build();
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found: " + email));
        return mapToDto(user);
    }

    public UserDto mapToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
