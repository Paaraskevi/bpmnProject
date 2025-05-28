package com.jts.BpmnJava.config;

import com.jts.BpmnJava.dto.*;
import com.jts.BpmnJava.repo.LoginRepository;
import com.jts.BpmnJava.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final LoginRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthenticationResponse register(SignupRequest request) {
        // Check if user already exists
        Optional<User> existingUser = repository.findByUsername(request.getUsername());
        if (existingUser.isPresent()) {
            throw new RuntimeException("User already exists with username: " + request.getUsername());
        }

        // Create new user
        var user = new User();
        user.setName(request.getName());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setAddress(request.getAddress());
        user.setMobileNo(request.getMobileno());
        user.setRole(request.getRole());

        repository.save(user);

        // Generate tokens
        var jwtToken = jwtService.generateToken(user.getUsername());
        var refreshToken = jwtService.generateRefreshToken(user.getUsername());

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(), // Using email field as username
                        request.getPassword()
                )
        );

        var user = repository.findByUsername(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        var jwtToken = jwtService.generateToken(user.getUsername());
        var refreshToken = jwtService.generateRefreshToken(user.getUsername());

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthenticationResponse authenticateWithUsername(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        var user = repository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        var jwtToken = jwtService.generateToken(user.getUsername());
        var refreshToken = jwtService.generateRefreshToken(user.getUsername());

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthenticationResponse refreshToken(String refreshToken) {
        String username = jwtService.extractUsername(refreshToken);

        if (username != null) {
            var user = repository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (jwtService.validateRefreshToken(refreshToken, user)) {
                var accessToken = jwtService.generateToken(user.getUsername());
                var newRefreshToken = jwtService.generateRefreshToken(user.getUsername());

                return AuthenticationResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(newRefreshToken)
                        .build();
            }
        }

        throw new RuntimeException("Invalid refresh token");
    }
}