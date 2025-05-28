package com.jts.BpmnJava.service;

import com.jts.BpmnJava.repo.RoleRepository;
import com.jts.BpmnJava.repo.UserRepository;
import com.jts.BpmnJava.user.Role;
import com.jts.BpmnJava.user.RoleName;
import com.jts.BpmnJava.user.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Transactional
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public User createUser(String username, String email, String password, Set<RoleName> roleNames) {
        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username is already taken!");
        }

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already in use!");
        }

        User user = new User(username, email, passwordEncoder.encode(password));

        // Assign roles
        for (RoleName roleName : roleNames) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            user.addRole(role);
        }

        return userRepository.save(user);
    }

    public User updateUser(Long userId, String firstName, String lastName, String email) {
        User user = getUserById(userId);

        if (email != null && !email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email is already in use!");
        }

        if (firstName != null) user.setFirstName(firstName);
        if (lastName != null) user.setLastName(lastName);
        if (email != null) user.setEmail(email);

        return userRepository.save(user);
    }

    public User updateUserRoles(Long userId, Set<RoleName> roleNames) {
        User user = getUserById(userId);

        // Clear existing roles
        user.getRoles().clear();

        // Add new roles
        for (RoleName roleName : roleNames) {
            Role role = roleRepository.findByName(roleName)
                    .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
            user.addRole(role);
        }

        return userRepository.save(user);
    }

    public User addRoleToUser(Long userId, RoleName roleName) {
        User user = getUserById(userId);
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        user.addRole(role);
        return userRepository.save(user);
    }

    public User removeRoleFromUser(Long userId, RoleName roleName) {
        User user = getUserById(userId);
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        user.removeRole(role);
        return userRepository.save(user);
    }

    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = getUserById(userId);

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect!");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public void resetPassword(Long userId, String newPassword) {
        User user = getUserById(userId);
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public User enableUser(Long userId) {
        User user = getUserById(userId);
        user.setEnabled(true);
        return userRepository.save(user);
    }

    public User disableUser(Long userId) {
        User user = getUserById(userId);
        user.setEnabled(false);
        return userRepository.save(user);
    }

    public void deleteUser(Long userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public List<User> getUsersByRole(RoleName roleName) {
        return userRepository.findUsersByRole(roleName);
    }

    public List<User> searchUsers(String searchTerm) {
        return userRepository.findUsersContaining(searchTerm);
    }

    public boolean hasPermissionToEdit(User user) {
        return user.canEdit();
    }

    public boolean hasPermissionToView(User user) {
        return user.canView();
    }

    public boolean hasPermissionToManageUsers(User user) {
        return user.isAdmin();
    }
}