package com.jts.BpmnJava.repo;

import com.jts.BpmnJava.user.RoleName;
import com.jts.BpmnJava.user.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByName(RoleName name);

    boolean existsByName(RoleName name);

}