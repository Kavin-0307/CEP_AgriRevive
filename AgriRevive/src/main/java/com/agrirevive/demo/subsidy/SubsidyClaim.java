package com.agrirevive.demo.subsidy;
import com.agrirevive.demo.user.User;
import com.agrirevive.demo.order.Order;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="subsidy_claims")
@Getter@Setter@NoArgsConstructor@AllArgsConstructor@Builder
public class SubsidyClaim {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long id;
	
	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="farmer_id")
	private User farmer;
	
	@OneToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="order_id")
	private Order order;
	
	private BigDecimal amount;
	private String status;
	private String remarks;
	
	@Column(name="created_at",insertable=false,updatable=false)
    private LocalDateTime createdAt;
    
    @Column(name ="updated_at",insertable=false,updatable=false)
    private LocalDateTime updatedAt;
}
