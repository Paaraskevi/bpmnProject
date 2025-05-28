package com.jts.BpmnJava.controller;

import com.jts.BpmnJava.secuirity.JWTService;
import com.jts.BpmnJava.dto.DashboardResponse;
import com.jts.BpmnJava.dto.LoginRequest;
import com.jts.BpmnJava.dto.LoginResponse;
import com.jts.BpmnJava.auth.RegisterRequest;
import com.jts.BpmnJava.dto.SignupResponse;
import com.jts.BpmnJava.service.LoginService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
// @CrossOrigin // Enable if you're calling from a frontend on a different origin
public class LoginController {

	@Autowired
	private AuthenticationManager authenticationManager;

	@Autowired
	private JWTService jwtService;

	@Autowired
	private LoginService loginService;

	@Autowired
	private UserDetailsService userDetailsService;

	@PostMapping("/doLogin")
	public ResponseEntity<LoginResponse> doLogin(@RequestBody LoginRequest request) {
		authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
		);

		UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
		String token = jwtService.generateToken(userDetails);
		String refreshToken = jwtService.generateRefreshToken(userDetails);

		LoginResponse response = new LoginResponse();
		response.setToken(token);
		response.setRefreshToken(refreshToken);

		return new ResponseEntity<>(response, HttpStatus.OK);
	}

	@GetMapping("/dashboard")
	public ResponseEntity<DashboardResponse> dashboard() {
		DashboardResponse response = new DashboardResponse();
		response.setResponse("Success");

		System.out.println("Dashboard Response");

		return new ResponseEntity<>(response, HttpStatus.OK);
	}

//	@PostMapping("/doRegister")
//	public ResponseEntity<SignupResponse> doRegister(@RequestBody RegisterRequest request) {
//		return new ResponseEntity<>(loginService.doRegister(request), HttpStatus.CREATED);
//	}
}
