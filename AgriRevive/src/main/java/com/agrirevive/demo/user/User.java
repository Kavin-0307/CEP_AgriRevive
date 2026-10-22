package com.agrirevive.demo.user;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDateTime;
@Entity
@Table(name="users")
@Getter@Setter@NoArgsConstructor@AllArgsConstructor@Builder
public class User implements Serializable {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long id;
	private String name,email,phone;
	@JsonIgnore
	private String passwordHash;
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
