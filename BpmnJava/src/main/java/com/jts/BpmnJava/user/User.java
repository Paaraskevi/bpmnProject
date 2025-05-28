package com.jts.BpmnJava.user;

import jakarta.persistence.*;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

@Data
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User implements UserDetails {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String username;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(nullable = false)
	private String password;

	@Column(name = "first_name")
	private String firstName;

	@Column(name = "last_name")
	private String lastName;

	@Column(name = "is_enabled")
	private boolean enabled = true;

	@Column(name = "is_account_non_expired")
	private boolean accountNonExpired = true;

	@Column(name = "is_account_non_locked")
	private boolean accountNonLocked = true;

	@Column(name = "is_credentials_non_expired")
	private boolean credentialsNonExpired = true;

	@Column(name = "address")
	private String address;

	@Column(name = "mobile_no")
	private String mobileNo;

	@ManyToMany(fetch = FetchType.EAGER, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
	@JoinTable(
			name = "user_roles",
			joinColumns = @JoinColumn(name = "user_id"),
			inverseJoinColumns = @JoinColumn(name = "role_id")
	)
	private Set<Role> roles = new HashSet<>();

	public User(String username, String email,String password) {
		this.username = username;
		this.email = email;
		this.password = password;

	}

	// UserDetails interface methods
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return roles.stream()
				.map(role -> new SimpleGrantedAuthority(role.getName().name()))
				.collect(Collectors.toList());
	}

	@Override
	public boolean isAccountNonExpired() {
		return accountNonExpired;
	}

	@Override
	public boolean isAccountNonLocked() {
		return accountNonLocked;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return credentialsNonExpired;
	}

	@Override
	public boolean isEnabled() {
		return enabled;
	}

	// Helper methods for role management
	public boolean hasRole(RoleName roleName) {
		return roles.stream()
				.anyMatch(role -> role.getName().equals(roleName));
	}

	public void addRole(Role role) {
		this.roles.add(role);
		role.getUsers().add(this);
	}

	public void removeRole(Role role) {
		this.roles.remove(role);
		role.getUsers().remove(this);
	}

	public boolean isAdmin() {
		return hasRole(RoleName.ROLE_ADMIN);
	}

	public boolean isModeler() {
		return hasRole(RoleName.ROLE_MODELER);
	}

	public boolean isViewer() {
		return hasRole(RoleName.ROLE_VIEWER);
	}

	public boolean canEdit() {
		return isAdmin() || isModeler();
	}

	public boolean canView() {
		return isAdmin() || isModeler() || isViewer();
	}

	public String getFullName() {
		return (firstName != null ? firstName : "") +
				(lastName != null ? " " + lastName : "");
	}

	@Override
	public boolean equals(Object o) {
		if (this == o) return true;
		if (o == null || getClass() != o.getClass()) return false;
		User user = (User) o;
		return username.equals(user.username);
	}

	@Override
	public int hashCode() {
		return username.hashCode();
	}

	@Override
	public String toString() {
		return "User{" +
				"id=" + id +
				", username='" + username + '\'' +
				", email='" + email + '\'' +
				", roles=" + roles.stream().map(r -> r.getName().name()).collect(Collectors.toList()) +
				'}';
	}
}