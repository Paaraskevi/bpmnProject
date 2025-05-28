package com.jts.BpmnJava.dto;

import com.jts.BpmnJava.user.Permission;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.jts.BpmnJava.user.Permission.*;

@Getter
@RequiredArgsConstructor
public enum Role {
    USER(Collections.emptySet()),
    ADMIN(Set.of(
            ADMIN_READ,
            ADMIN_UPDATE,
            ADMIN_DELETE,
            ADMIN_CREATE,
            MANAGEMENT_READ,
            MANAGEMENT_UPDATE,
            MANAGEMENT_DELETE,
            MANAGEMENT_CREATE
    )),
    MANAGER(Set.of(
            MANAGEMENT_READ,
            MANAGEMENT_UPDATE,
            MANAGEMENT_DELETE,
            MANAGEMENT_CREATE
    ));

    private final Set<Permission> permission;
    public List<SimpleGrantedAuthority>getAuthorities(){
       var authorities =  getPermission().stream().map(permission1 -> new SimpleGrantedAuthority(permission1.name()))
                .collect(Collectors.toList());
       authorities.add(new SimpleGrantedAuthority("ROLE_"+this.name()));
       return authorities;
    }

}
