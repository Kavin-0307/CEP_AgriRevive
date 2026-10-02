package com.agrirevive.demo.bidding;
import com.agrirevive.demo.biomass.BiomassListing;
import com.agrirevive.demo.user.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="bids")
@Getter@Setter@NoArgsConstructor@AllArgsConstructor@Builder
public class Bid {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "listing_id")
	private BiomassListing listing;
	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "bidder_id")
	private User bidder;
	private BigDecimal amount;
	@Column(name = "created_at", insertable = false, updatable = false)
	private LocalDateTime createdAt;
}
