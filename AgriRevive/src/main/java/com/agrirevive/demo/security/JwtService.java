package com.agrirevive.demo.security;

import java.util.Date;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.agrirevive.demo.config.AppProperties;
import com.agrirevive.demo.user.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
	private final AppProperties appProperties;
	private final SecretKey key;
	public JwtService(AppProperties appProperties) {
		this.appProperties=appProperties;
		byte[] keyBytes=Decoders.BASE64.decode(appProperties.getJwt().getSecret());
		this.key=Keys.hmacShaKeyFor(keyBytes);
	}
	public String generateToken(User user) {
		return Jwts.builder().subject(user.getEmail()).claim("role",user.getRole().name()).claim("userId",user.getId()).issuedAt(new Date(System.currentTimeMillis()))
				.expiration(new Date(System.currentTimeMillis()+appProperties.getJwt().getExpirations())).signWith(key).compact();
	}
	public String extractEmail(String token) {
		return extractClaims(token,Claims::getSubject);
	}
	public boolean isTokenValid(String token,String userEmail) {
		final String email=extractEmail(token);
		return (email.equals(userEmail))&&!isTokenExpired(token);
	}
	public boolean isTokenExpired(String token) {
		return extractClaims(token,Claims::getExpiration).before(new Date());
		
	}
	private <T> T extractClaims(String token,Function<Claims,T> claimsResolver) {
		 final Claims claims = Jwts.parser()
	                .verifyWith(key)
	                .build()
	                .parseSignedClaims(token)
	                .getPayload();
	        return claimsResolver.apply(claims);
	    }
	}
	


