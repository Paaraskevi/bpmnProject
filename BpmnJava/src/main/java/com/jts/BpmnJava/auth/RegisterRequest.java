package com.jts.BpmnJava.auth;

import com.jts.BpmnJava.user.Role;
import lombok.*;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SignupRequest {

	private String name;

	private String username;
	
	private String password;
	
	private String address;
	
	private String mobileno;
	
	private String age;

	private Role role = Role.USER;

}
