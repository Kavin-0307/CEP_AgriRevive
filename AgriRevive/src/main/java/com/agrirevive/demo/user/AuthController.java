package com.agrirevive.demo.user;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agrirevive.demo.user.dto.AuthResponse;
import com.agrirevive.demo.user.dto.LoginRequest;
import com.agrirevive.demo.user.dto.RegisterRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	private final AuthService authService;
	public AuthController(AuthService authService) {
		this.authService=authService;
	}
	@PostMapping("/register")
	public AuthResponse register(@Valid@RequestBody RegisterRequest request) {
		return authService.register(request);
	}
	@PostMapping("/login")
	public AuthResponse login(@RequestBody LoginRequest request) {
		return authService.login(request);
	}
}
