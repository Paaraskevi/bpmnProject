package com.jts.BpmnJava.secuirity;

import com.jts.BpmnJava.config.UserInfoUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.authentication.logout.LogoutHandler;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfiguration {

	private final JwtAuthFilter authFilter;
	private final UserInfoUserDetailsService userDetailsService;
	private final LogoutHandler logoutHandler;

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
				.cors(Customizer.withDefaults())
				.csrf(AbstractHttpConfigurer::disable)
				.authorizeHttpRequests(req -> req
						// Public endpoints
						.requestMatchers("/api/doLogin", "/api/doRegister",
								"/api/v1/auth/**", "/api/auth/**").permitAll()

						// User endpoints
						.requestMatchers("/api/v1/users/**").authenticated()

						// Dashboard - accessible by all authenticated users
						.requestMatchers("/api/dashboard").hasAnyRole("USER", "ADMIN", "MANAGER")

						// Admin endpoints
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						.requestMatchers("/api/v1/admin/**").hasRole("ADMIN")

						// Management endpoints
						.requestMatchers("/api/management/**").hasAnyRole("ADMIN", "MANAGER")
						.requestMatchers("/api/v1/management/**").hasAnyRole("ADMIN", "MANAGER")

						// User-specific endpoints
						.requestMatchers("/api/user/**").hasAnyRole("USER", "ADMIN", "MANAGER")

						// All other requests require authentication
						.anyRequest().authenticated())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authenticationProvider(authenticationProvider())
				.addFilterBefore(authFilter, UsernamePasswordAuthenticationFilter.class)
				.logout(logout -> logout
						.logoutUrl("/api/v1/auth/logout")
						.addLogoutHandler(logoutHandler)
						.logoutSuccessHandler((request, response, authentication) ->
								SecurityContextHolder.clearContext())
				)
				.build();
	}

	@Bean
	AuthenticationProvider authenticationProvider() {
		DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
		authenticationProvider.setUserDetailsService(userDetailsService);
		authenticationProvider.setPasswordEncoder(passwordEncoder());
		return authenticationProvider;
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
		return config.getAuthenticationManager();
	}
}