package com.jts.BpmnJava.user;

import lombok.Getter;


public enum Permission {

    ADMIN_READ("admin:read"),
    ADMIN_UPDATE("admin:update"),
    ADMIN_CREATE("admin:create"),
    ADMIN_DELETE("admin:delete"),

    MANAGEMENT_READ("management:read"),
    MANAGEMENT_UPDATE("management:update"),
    MANAGEMENT_CREATE("management:create"),
    MANAGEMENT_DELETE("management:delete");

    @Getter
    private final String permission;

    Permission(String permission) {
        this.permission = permission;
    }
}
