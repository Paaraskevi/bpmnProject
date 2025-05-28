package com.jts.BpmnJava.user;

import lombok.Getter;

@Getter
public enum RoleName {
    ROLE_ADMIN("Admin"),
    ROLE_MODELER("Modeler"),
    ROLE_VIEWER("Viewer");

    private final String displayName;

    RoleName(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getAuthority() {
        return this.name();
    }

}
