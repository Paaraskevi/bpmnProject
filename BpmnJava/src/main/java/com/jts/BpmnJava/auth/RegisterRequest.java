package com.jts.BpmnJava.auth;

import com.jts.BpmnJava.user.Role;
import com.jts.BpmnJava.user.RoleName;
import lombok.*;

import java.util.Set;

@Data
@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {

	private String firstName;
	private String lastName;
	private String username;
	private String password;
	private String address;
	private String email;
	private String mobileno;
	private String age;
	private Set<RoleName> roleNames;

}
