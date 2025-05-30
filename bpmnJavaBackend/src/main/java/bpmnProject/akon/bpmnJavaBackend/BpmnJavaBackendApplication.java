package bpmnProject.akon.bpmnJavaBackend;

import bpmnProject.akon.bpmnJavaBackend.Auth.AuthenticationService;
import bpmnProject.akon.bpmnJavaBackend.Auth.RegisterRequest;
import bpmnProject.akon.bpmnJavaBackend.User.Role;
import bpmnProject.akon.bpmnJavaBackend.User.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Set;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class BpmnJavaBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BpmnJavaBackendApplication.class, args);
	}

//	@Bean
//	public CommandLineRunner commandLineRunner(
/*			AuthenticationService authService,
			RoleRepository roleRepository
	) {
		return args -> {
			// Initialize roles if they don't exist
			initializeRoles(roleRepository);

			// Create admin user
			var admin = RegisterRequest.builder()
					.firstname("Admin")
					.lastname("User")
					.email("admin@mail.com")
					.password("password")
					.roleNames(Set.of(Role.ROLE_ADMIN))
					.build();
			System.out.println("Admin token: " + authService.register(admin).getAccessToken());

			// Create modeler user
			var modeler = RegisterRequest.builder()
					.firstname("Modeler")
					.lastname("User")
					.email("modeler@mail.com")
					.password("password")
					.roleNames(Set.of(Role.ROLE_MODELER))
					.build();
			System.out.println("Modeler token: " + authService.register(modeler).getAccessToken());

			// Create viewer user
			var viewer = RegisterRequest.builder()
					.firstname("Viewer")
					.lastname("User")
					.email("viewer@mail.com")
					.password("password")
					.roleNames(Set.of(Role.ROLE_VIEWER))
					.build();
			System.out.println("Viewer token: " + authService.register(viewer).getAccessToken());
		};
	}

	private void initializeRoles(RoleRepository roleRepository) {
		// Create ROLE_ADMIN if it doesn't exist
		if (!roleRepository.existsByName(Role.ROLE_ADMIN)) {
			Role adminRole = Role.builder()
					.name(Role.ROLE_ADMIN)
					.description("Administrator with full access")
					.build();
			roleRepository.save(adminRole);
		}

		// Create ROLE_MODELER if it doesn't exist
		if (!roleRepository.existsByName(Role.ROLE_MODELER)) {
			Role modelerRole = Role.builder()
					.name(Role.ROLE_MODELER)
					.description("Can create and edit diagrams")
					.build();
			roleRepository.save(modelerRole);
		}

		// Create ROLE_VIEWER if it doesn't exist
		if (!roleRepository.existsByName(Role.ROLE_VIEWER)) {
			Role viewerRole = Role.builder()
					.name(Role.ROLE_VIEWER)
					.description("Can only view diagrams")
					.build();
			roleRepository.save(viewerRole);
		}
	}*/
}