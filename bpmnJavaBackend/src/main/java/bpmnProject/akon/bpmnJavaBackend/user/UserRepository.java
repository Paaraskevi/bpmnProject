package bpmnProject.akon.bpmnJavaBackend.User;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    @EntityGraph(attributePaths = {"roles"})
    Optional<User> findByUsername(String username);
}