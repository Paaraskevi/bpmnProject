package bpmnProject.akon.bpmnJavaBackend.Auth;

import bpmnProject.akon.bpmnJavaBackend.Config.JwtService;
import bpmnProject.akon.bpmnJavaBackend.Token.Token;
import bpmnProject.akon.bpmnJavaBackend.Token.TokenRepository;
import bpmnProject.akon.bpmnJavaBackend.Token.TokenType;
import bpmnProject.akon.bpmnJavaBackend.User.RoleRepository;
import bpmnProject.akon.bpmnJavaBackend.User.User;
import bpmnProject.akon.bpmnJavaBackend.User.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthenticationService {
    private final UserRepository repository;
    private final RoleRepository roleRepository;
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthenticationResponse register(RegisterRequest request) {
            // Check if user already exists
            if (repository.findByEmail(request.getEmail()).isPresent()) {
                throw new RuntimeException("User with email " + request.getEmail() + " already exists");
            }

            // Check if username already exists (if you have this method)
        // Check if username already exists (only if username is not null)
        if (request.getUsername() != null && repository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username " + request.getUsername() + " already exists");
        }
//        // Get roles from role names
//        Set<Role> roles = new HashSet<>();
//        if (request.getRoleNames() != null && !request.getRoleNames().isEmpty()) {
//            // Create a copy of the role names to avoid concurrent modification
//            List<String> roleNamesList = new ArrayList<>(request.getRoleNames());
//            roles = roleNamesList.stream()
//                    .map(roleName -> roleRepository.findByName(roleName)
//                            .orElseThrow(() -> new RuntimeException("Role not found: " + roleName))) // This throws the error
//                    .collect(Collectors.toSet());
//        } else {
//            // Default role if none specified
//            Role viewerRole = roleRepository.findByName(Role.ROLE_VIEWER)
//                    .orElseThrow(() -> new RuntimeException("Default role not found"));
//            roles.add(viewerRole);
//        }

        var user = User.builder()
                .firstname(request.getFirstName())
                .lastname(request.getLastName())
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .tokens(new ArrayList<>())
                .build();

        var savedUser = repository.save(user);
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        saveUserToken(savedUser, jwtToken);

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .build();
    }

    public AuthenticationResponse authenticate(LoginRequest request) {
        System.out.println("Trying to authenticate user: " + request.getUsername());


      var auth =  authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );
        System.out.println("Login request username: [" + request.getUsername() + "]");

        var user = (User)auth.getPrincipal();
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        revokeAllUserTokens(user);
        saveUserToken(user, jwtToken);

        // Calculate expiresIn as seconds from now (not full timestamp)
        long expirationTime = jwtService.extractExpiration(jwtToken).getTime();
        long currentTime = System.currentTimeMillis();
        long expiresInSeconds = (expirationTime - currentTime) / 1000;

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .user(user)
                .expiresIn(expiresInSeconds)
                .build();
    }

    @Transactional
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        var refreshToken = jwtService.generateRefreshToken(user);
        revokeAllUserTokens(user);
        saveUserToken(user, jwtToken);

        // Calculate expiresIn as seconds from now
        long expirationTime = jwtService.extractExpiration(jwtToken).getTime();
        long currentTime = System.currentTimeMillis();
        long expiresInSeconds = (expirationTime - currentTime) / 1000;

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken)
                .user(user)
                .expiresIn(expiresInSeconds)
                .build();
    }
    private void saveUserToken(User user, String jwtToken) {
        var token = Token.builder()
                .user(user)
                .token(jwtToken)
                .tokenType(TokenType.BEARER)
                .expired(false)
                .revoked(false)
                .build();
        tokenRepository.save(token);
    }


    @Transactional
    private void revokeAllUserTokens(User user) {
        var validUserTokens = tokenRepository.findAllValidTokenByUser(user.getId());
        if (validUserTokens.isEmpty())
            return;

        // Create a copy of the list to avoid concurrent modification
        List<Token> tokensToUpdate = new ArrayList<>(validUserTokens);
        tokensToUpdate.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });
        tokenRepository.saveAll(tokensToUpdate);
    }

    @Transactional
    public void refreshToken(
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        final String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        final String refreshToken;
        final String userEmail;
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return;
        }
        refreshToken = authHeader.substring(7);
        userEmail = jwtService.extractUsername(refreshToken);
        if (userEmail != null) {
            var user = this.repository.findByEmail(userEmail)
                    .orElseThrow();
            if (jwtService.isTokenValid(refreshToken, user)) {
                var accessToken = jwtService.generateToken(user);
                revokeAllUserTokens(user);
                saveUserToken(user, accessToken);
                var authResponse = AuthenticationResponse.builder()
                        .accessToken(accessToken)
                        .refreshToken(refreshToken)
                        .build();
                new ObjectMapper().writeValue(response.getOutputStream(), authResponse);
            }
        }
    }
}