package com.agrirevive.demo.order;
import com.agrirevive.demo.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name="orders")
@Getter@Setter@NoArgsConstructor@AllArgsConstructor@Builder
public class Order {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long id;
	
	@Column(name="order_type")
	private String orderType;
	
	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="seller_id")
	private User seller;
	
	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="buyer_id")
	private User buyer;
	
	@Column(name="listing_id")
	private Long listingId;
	
	private BigDecimal quantity;
	

    @Column(name = "price_per_unit")
    private BigDecimal pricePerUnit;
    
    @Column(name="total_amount")
    private BigDecimal totalAmount;
    private String status;
    @Column(name="preferred_pickup_date")
    private LocalDate preferredPickupDate;
    @Column(name="pickup_date")
    private LocalDate pickupDate;
    
    @Column(name="vehicle_number")
    private String vehicleNumber;
    
    @Column(name="pickup_notes")
    private String pickupNotes;
    
    @Column(name="delivery_address")
    private String deliveryAddress;
    
    @Column(name="buyer_note")
    private String buyerNote;
    
    @Column(name="rejection_reason")
    private String rejectionReason;
    
    @Column(name="delivery_remarks")
    private String deliveryRemarks;
    @Column(name="created_at",insertable=false,updatable=false)
    private LocalDateTime createdAt;
    @Column(name ="updated_at",insertable=false,updatable=false)
    private LocalDateTime updatedAt;
}
