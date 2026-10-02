package com.agrirevive.demo.product;
import com.agrirevive.demo.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="edo_products")
@Getter@Setter@NoArgsConstructor@AllArgsConstructor@Builder
public class EcoProduct {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="industry_id")
	private User industry;
	
	private String name,description;
	private BigDecimal price;
	@Column(name="stock_quantity")
	private Integer stockQuantity;
	@Column(name="image_path")
	private String imagePath;
	@Version
	private Long version;
	private String status;

    @Column(name="created_at",insertable=false,updatable=false)
    private LocalDateTime createdAt;
    @Column(name="updated_at",insertable=false,updatable=false)
    private LocalDateTime updatedAt;
}
