package com.agrirevive.demo.user;
import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity
@Table(name="users")
@Getter@Setter@NoArgsConstructor@AllArgsConstructor@Builder
public class User {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long id;
	private String name,email,phone,passwordHash;
	@Enumerated(EnumType.STRING)
	private Role role;
	private String status;
	private String organizationName;
	private String state;
	private String district,address;
	@Column(name="created_at",insertable=false,updatable=false)
	private LocalDateTime createdAt;
	@Column(name="updated_at",insertable=false,updatable=false)
	private LocalDateTime updatedAt;
	
}
