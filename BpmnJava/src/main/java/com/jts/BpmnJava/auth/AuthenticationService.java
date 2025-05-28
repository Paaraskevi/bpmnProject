package com.jts.BpmnJava.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jts.BpmnJava.secuirity.JWTService;
import com.jts.BpmnJava.dto.*;
import com.jts.BpmnJava.repo.LoginRepository;
import com.jts.BpmnJava.token.Token;
import com.jts.BpmnJava.token.TokenRepository;
import com.jts.BpmnJava.token.TokenType;
import com.jts.BpmnJava.user.User;
import com.jts.BpmnJava.user.Role;
import com.jts.BpmnJava.user.RoleName;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final LoginRepository repository;
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Register a new user with validation and default role assignment
     */
    @Transactional
    public AuthenticationResponse register(RegisterRequest request) {
        log.info("Attempting to register user with username: {}", request.getUsername());

        // Validate input
        validateRegistrationRequest(request);

        // Check for existing username
        if (repository.findByUsername(request.getUsername()).isPresent()) {
            log.warn("Registration failed: Username already exists: {}", request.getUsername());
            throw new UserAlreadyExistsException("Username already exists: " + request.getUsername());
        }

        // Check for existing email
        if (repository.findByEmail(request.getEmail()).isPresent()) {
            log.warn("Registration failed: Email already exists: {}", request.getEmail());
            throw new UserAlreadyExistsException("Email already exists: " + request.getEmail());
        }

        User user = buildUser(request);
        User savedUser = repository.save(user);

        log.info("User registered successfully with ID: {}", savedUser.getId());

        return generateAuthenticationResponse(savedUser);
    }

    /**
     * Authenticate user with email and password
     */
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        log.info("Attempting authentication for email: {}", request.getEmail());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            log.warn("Authentication failed for email: {}", request.getEmail());
            throw new InvalidCredentialsException("Invalid email or password");
        }

        User user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UserNotFoundException("User not found with email: " + request.getEmail()));

        log.info("Authentication successful for user ID: {}", user.getId());
        return generateAuthenticationResponse(user);
    }

    /**
     * Authenticate user with username and password
     */
    public AuthenticationResponse authenticateWithUsername(LoginRequest request) {
        log.info("Attempting authentication for username: {}", request.getUsername());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
        } catch (BadCredentialsException e) {
            log.warn("Authentication failed for username: {}", request.getUsername());
            throw new InvalidCredentialsException("Invalid username or password");
        }

        User user = repository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UserNotFoundException("User not found with username: " + request.getUsername()));

        log.info("Authentication successful for user ID: {}", user.getId());
        return generateAuthenticationResponse(user);
    }

    /**
     * Refresh JWT token using refresh token
     */
    public void refreshToken(HttpServletRequest request, HttpServletResponse response) throws IOException {
        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("Invalid authorization header in refresh token request");
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid authorization header");
            return;
        }

        final String refreshToken = authHeader.substring(7);
        final String username;

        try {
            username = jwtService.extractUsername(refreshToken);
        } catch (Exception e) {
            log.warn("Failed to extract username from refresh token: {}", e.getMessage());
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid refresh token");
            return;
        }

        if (username == null) {
            log.warn("Unable to extract username from refresh token");
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Unable to extract username");
            return;
        }

        Optional<User> userOpt = repository.findByUsername(username);
        if (userOpt.isEmpty()) {
            log.warn("User not found during token refresh: {}", username);
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "User not found");
            return;
        }

        User user = userOpt.get();
        if (!jwtService.isTokenValid(refreshToken, user)) {
            log.warn("Invalid refresh token for user: {}", username);
            sendErrorResponse(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid refresh token");
            return;
        }

        String accessToken = jwtService.generateToken(user);
        revokeAllUserTokens(user);
        saveUserToken(user, accessToken);

        AuthenticationResponse authResponse = AuthenticationResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();

        log.info("Token refreshed successfully for user: {}", username);
        response.setContentType("application/json");
        new ObjectMapper().writeValue(response.getOutputStream(), authResponse);
    }

    /**
     * Validate registration request data
     */
    private void validateRegistrationRequest(RegisterRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            throw new ValidationException("Username is required");
        }
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new ValidationException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().length() < 8) {
            throw new ValidationException("Password must be at least 8 characters long");
        }
        // Add email format validation if needed
        if (!isValidEmail(request.getEmail())) {
            throw new ValidationException("Invalid email format");
        }
    }

    /**
     * Build user entity from registration request
     */
    private User buildUser(RegisterRequest request) {
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .username(request.getUsername().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .build();

        // Set roles
        Set<Role> roles = new HashSet<>();
        if (request.getRoleNames() != null && !request.getRoleNames().isEmpty()) {
            for (RoleName roleName : request.getRoleNames()) {
                Role role = new Role();
                role.setName(roleName);
                roles.add(role);
            }
        } else {
            Role defaultRole = new Role();
            defaultRole.setName(RoleName.ROLE_VIEWER);
            roles.add(defaultRole);
        }
        user.setRoles(roles);

        return user;
    }

    /**
     * Generate authentication response with tokens
     */
    @Transactional
    private AuthenticationResponse generateAuthenticationResponse(User user) {
        String jwtToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        revokeAllUserTokens(user);
        saveUserToken(user, jwtToken);

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    /**
     * Revoke all valid tokens for a user
     */
    @Transactional
    private void revokeAllUserTokens(User user) {
        var validUserTokens = tokenRepository.findAllValidTokenByUser(user.getId());
        if (validUserTokens.isEmpty()) {
            return;
        }

        validUserTokens.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });
        tokenRepository.saveAll(validUserTokens);

        log.debug("Revoked {} tokens for user ID: {}", validUserTokens.size(), user.getId());
    }

    /**
     * Save user token to database
     */
    private void saveUserToken(User user, String jwtToken) {
        Token token = Token.builder()
                .users(user)
                .token(jwtToken)
                .tokenType(String.valueOf(TokenType.BEARER))
                .expired(false)
                .revoked(false)
                .build();
        tokenRepository.save(token);
    }

    /**
     * Send error response as JSON
     */
    private void sendErrorResponse(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }

    /**
     * Basic email validation
     */
    private boolean isValidEmail(String email) {
        return email != null && email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }

    // Custom Exception Classes (should be in separate files)
    public static class UserAlreadyExistsException extends RuntimeException {
        public UserAlreadyExistsException(String message) {
            super(message);
        }
    }

    public static class UserNotFoundException extends RuntimeException {
        public UserNotFoundException(String message) {
            super(message);
        }
    }

    public static class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException(String message) {
            super(message);
        }
    }

    public static class ValidationException extends RuntimeException {
        public ValidationException(String message) {
            super(message);
        }
    }
}