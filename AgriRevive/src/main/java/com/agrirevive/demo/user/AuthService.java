package com.agrirevive.demo.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import com.agrirevive.demo.common.BusinessRuleException;
import com.agrirevive.demo.security.JwtService;
import com.agrirevive.demo.user.dto.AuthResponse;
import com.agrirevive.demo.user.dto.LoginRequest;
import com.agrirevive.demo.user.dto.RegisterRequest;

public class AuthService {
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	public AuthService(UserRepository userRepository,PasswordEncoder passwordEncoder,JwtService jwtService) {
		this.userRepository=userRepository;
		this.passwordEncoder=passwordEncoder;
		this.jwtService=jwtService;
	}
	@Transactional
	public AuthResponse register(RegisterRequest req) {
		if(req.getRole()==Role.ADMIN) {
			throw new BusinessRuleException("Cannot self-register as ADMIN");
		}
		if(userRepository.findByEmail(req.getEmail()).isPresent()) {
			throw new BusinessRuleException("Email already registered");
		}
		User user=User.builder().name(req.getName()).email(req.getEmail()).phone(req.getPhone()).passwordHash(passwordEncoder.encode(req.getPassword())).role(req.getRole()).
				status("ACTIVE").organizationName(req.getOrganizationName()).build();
		userRepository.save(user);
		String token=jwtService.generateToken(user);
		return new AuthResponse(token,user);
	}
	public AuthResponse login(LoginRequest req) {
		User user=userRepository.findByEmail(req.getEmail()).orElseThrow(()->new BusinessRuleException("Invalid Credentials"));
		if("BLOCKED".equals(user.getStatus())) {
			throw new BusinessRuleException("User is blocked");
		}
		String token=jwtService.generateToken(user);
		return new AuthResponse(token,user);
	}
}
