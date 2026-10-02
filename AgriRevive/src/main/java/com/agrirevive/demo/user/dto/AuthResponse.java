package com.agrirevive.demo.user.dto;

import com.agrirevive.demo.user.User;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
	private String token;
	private User user;
}
