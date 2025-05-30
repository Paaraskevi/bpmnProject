package bpmnProject.akon.bpmnJavaBackend.User;

import bpmnProject.akon.bpmnJavaBackend.Token.Token;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.*;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "_user")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String firstname;
    private String lastname;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    @ManyToMany(fetch = FetchType.EAGER, cascade = {CascadeType.MERGE, CascadeType.PERSIST})
    @JoinTable(
            name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"),
            foreignKey = @ForeignKey(name = "FK_user_roles"),
            inverseForeignKey = @ForeignKey(name = "FK_roles_user"))
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Token> tokens = new ArrayList<>();

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return new ArrayList<>(roles).stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList());
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    // Helper methods
    public boolean hasRole(String roleName) {
        return roles != null && roles.stream().anyMatch(role -> role.getName().equals(roleName));
    }

    public boolean isAdmin() {
        return hasRole(Role.ROLE_ADMIN);
    }

    public boolean isModeler() {
        return hasRole(Role.ROLE_MODELER);
    }

    public boolean isViewer() {
        return hasRole(Role.ROLE_VIEWER);
    }

    // Custom setters to handle collection initialization
    public void setRoles(Set<Role> roles) {
        if (this.roles == null) {
            this.roles = new HashSet<>();
        }
        this.roles.clear();
        if (roles != null) {
            this.roles.addAll(roles);
        }
    }

    public void setTokens(List<Token> tokens) {
        if (this.tokens == null) {
            this.tokens = new ArrayList<>();
        }
        this.tokens.clear();
        if (tokens != null) {
            this.tokens.addAll(tokens);
        }
    }

    // Safe getter methods
    public Set<Role> getRoles() {
        if (this.roles == null) {
            this.roles = new HashSet<>();
        }
        return this.roles;
    }

    public List<Token> getTokens() {
        if (this.tokens == null) {
            this.tokens = new ArrayList<>();
        }
        return this.tokens;
    }
}