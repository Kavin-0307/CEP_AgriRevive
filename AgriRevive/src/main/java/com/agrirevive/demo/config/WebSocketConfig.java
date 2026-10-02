package com.agrirevive.demo.config;
import com.agrirevive.demo.security.JwtService;

import java.util.List;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker

public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
	private final JwtService jwtService;
	public WebSocketConfig(JwtService jwtService) {
		this.jwtService=jwtService;
	}
	@Override
	public void configureMessageBroker(MessageBrokerRegistry config) {
		config.enableSimpleBroker("/topic");
		config.setApplicationDestinationPrefixes("/app");
		
	}
	  @Override
	    public void registerStompEndpoints(StompEndpointRegistry registry) {
	        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
	    }

	@Override 
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(new ChannelInterceptor(){
			@Override
			public Message<?> preSend(Message<?> message,MessageChannel channel){
				StompHeaderAccessor accessor=MessageHeaderAccessor.getAccessor(message,StompHeaderAccessor.class);
				if(StompCommand.CONNECT.equals(accessor.getCommand())) {
					List<String> authorization=accessor.getNativeHeader("Authorization");
					if(authorization!=null&&!authorization.isEmpty()&&authorization.get(0).startsWith("Bearer ")) {
						String token=authorization.get(0).substring(7);
						String email=jwtService.extractEmail(token);
						if(email!=null&&!jwtService.isTokenExpired(token)) {
							UsernamePasswordAuthenticationToken auth=new UsernamePasswordAuthenticationToken(email,null,List.of());
							accessor.setUser(auth);
						}
					}
				}
				return message;
			}
 		});
	}

}
