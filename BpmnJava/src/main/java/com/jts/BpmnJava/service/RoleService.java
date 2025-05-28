package com.jts.BpmnJava.service;

import com.jts.BpmnJava.repo.RoleRepository;
import com.jts.BpmnJava.user.Role;
import com.jts.BpmnJava.user.RoleName;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoleService {

    @Autowired
    private RoleRepository roleRepository;

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public Optional<Role> findByName(RoleName name) {
        return roleRepository.findByName(name);
    }

    public Role getRoleByName(RoleName name) {
        return roleRepository.findByName(name)
                .orElseThrow(() -> new RuntimeException("Role not found: " + name));
    }

    public Role createRole(RoleName name) {
        if (roleRepository.existsByName(name)) {
            throw new RuntimeException("Role already exists: " + name);
        }

        Role role = new Role(name);
        return roleRepository.save(role);
    }

    public void initializeDefaultRoles() {
        for (RoleName roleName : RoleName.values()) {
            if (!roleRepository.existsByName(roleName)) {
                createRole(roleName);
            }
        }
    }
}