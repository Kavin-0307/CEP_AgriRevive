package com.agrirevive.demo.biomass;
import com.agrirevive.demo.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name="biomass_listings")
@Getter@Setter@NoArgsConstructor@AllArgsConstructor@Builder
public class BiomassListing {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long id;
	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="farmer_id")
	private User farmer;
	
	@ManyToOne(fetch=FetchType.LAZY)
	@JoinColumn(name="farmer_id")
	private ResidueType residueType;
	
	private String title,description;
	
	@Column(name="quantity_available")
	private BigDecimal quantityAvailable;
	@Column(name="price_per_tonne")
	private BigDecimal pricePerTonne;
	@Column(name="quality_grade")
	private String qualityGrade;
	@Column(name="moiture_percent")
	private BigDecimal moisturePercent;
	private String state,district;
	@Column(name="pickup_address")
	private String pickupAddress;
	@Column(name="available_from")
	private LocalDate availableFrom;
	@Column(name="image_path")
	private String imagePath;
	private String status;
	
	@Column(name="ai_verified_status")
	private String aiVerifiedStatus;
	@Column(name="admin_remarks")
	private String adminRemarks;
	@Version
	private Long version;
	@Column(name="created_at",insertable=false,updatable=false)
    private LocalDateTime createdAt;
    @Column(name="updated_at",insertable=false,updatable=false)
    private LocalDateTime updatedAt;
	
}
