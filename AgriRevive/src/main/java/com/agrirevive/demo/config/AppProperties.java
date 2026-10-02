package com.agrirevive.demo.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import lombok.Getter;
import lombok.Setter;

@Configuration
@ConfigurationProperties(prefix= "app")
@Getter
public class AppProperties {	
	private Jwt jwt=new Jwt();
	@Getter@Setter
	public static class Jwt{
		private String secret;
		private long expirations;
	}
}
