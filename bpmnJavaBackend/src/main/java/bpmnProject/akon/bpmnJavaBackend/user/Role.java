package bpmnProject.akon.bpmnJavaBackend.User;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "roles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = "users") // Exclude users from equals/hashCode to prevent circular references
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String name;

    private String description;

    @JsonIgnore
    @ManyToMany(mappedBy = "roles", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<User> users = new HashSet<>();

    // Constructor for role name only
    public Role(String name) {
        this.name = name;
        this.users = new HashSet<>();
    }

    // Predefined role constants
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_MODELER = "MODELER";
    public static final String ROLE_VIEWER = "VIEWER";

    // Custom setter to handle collection initialization
    public void setUsers(Set<User> users) {
        if (this.users == null) {
            this.users = new HashSet<>();
        }
        this.users.clear();
        if (users != null) {
            this.users.addAll(users);
        }
    }

    // Safe getter method
    public Set<User> getUsers() {
        if (this.users == null) {
            this.users = new HashSet<>();
        }
        return this.users;
    }
}