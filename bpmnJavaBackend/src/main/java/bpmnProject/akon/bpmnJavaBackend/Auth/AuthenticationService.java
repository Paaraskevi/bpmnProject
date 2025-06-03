package bpmnProject.akon.bpmnJavaBackend.Auth;

import bpmnProject.akon.bpmnJavaBackend.Config.JwtService;
import bpmnProject.akon.bpmnJavaBackend.Token.Token;
import bpmnProject.akon.bpmnJavaBackend.Token.TokenRepository;
import bpmnProject.akon.bpmnJavaBackend.Token.TokenType;
import bpmnProject.akon.bpmnJavaBackend.User.Role;
import bpmnProject.akon.bpmnJavaBackend.User.RoleRepository;
import bpmnProject.akon.bpmnJavaBackend.User.User;
import bpmnProject.akon.bpmnJavaBackend.User.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

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
        if (repository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User with email " + request.getEmail() + " already exists");
        }

        if (request.getUsername() != null && repository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username " + request.getUsername() + " already exists");
        }
//
//        Set<Role> roles = new HashSet<>();
//        if (request.getRoleNames() != null && !request.getRoleNames().isEmpty()) {
//            roles = request.getRoleNames().stream()
//                    .map(roleName -> roleRepository.findByName(roleName)
//                            .orElseThrow(() -> new RuntimeException("Role not found: " + roleName)))
//                    .collect(Collectors.toSet());
//        } else {
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
                //.roles(roles)
                .tokens(new ArrayList<>())
                .build();

        var savedUser = repository.save(user);
        var jwtToken = jwtService.generateToken(savedUser);
        saveUserToken(savedUser, jwtToken);

        long expirationTime = jwtService.extractExpiration(jwtToken).getTime();
        long currentTime = System.currentTimeMillis();
        long expiresInSeconds = (expirationTime - currentTime) / 1000;

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .user(savedUser)
                .tokenType("Bearer")
                .expiresIn(expiresInSeconds)
                .build();
    }

    @Transactional
    public AuthenticationResponse authenticate(LoginRequest request) {
        var auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        var user = (User) auth.getPrincipal();
        revokeAllUserTokens(user);
        var jwtToken = jwtService.generateToken(user);
        saveUserToken(user, jwtToken);

        long expirationTime = jwtService.extractExpiration(jwtToken).getTime();
        long currentTime = System.currentTimeMillis();
        long expiresInSeconds = (expirationTime - currentTime) / 1000;

        User userWithRoles = repository.findByUsername(user.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .user(userWithRoles)
                .tokenType("Bearer")
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
        if (validUserTokens.isEmpty()) return;

        validUserTokens.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });
        tokenRepository.saveAll(validUserTokens);
        tokenRepository.flush();
    }
}
