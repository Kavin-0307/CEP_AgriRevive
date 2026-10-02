package com.agrirevive.demo.biomass;
import com.agrirevive.demo.order.Order;
import com.agrirevive.demo.order.OrderRepository;
import com.agrirevive.demo.user.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.math.BigDecimal;
@Component
public class AuctionScheduler {
	private final BiomassListingRepository listingRepository;
	private final OrderRepository orderRepository;
	private final UserRepository userRepository;
	
	public AuctionScheduler(BiomassListingRepository listingRepository,OrderRepository orderRepository,
			UserRepository userRepository) {
		this.listingRepository=listingRepository;
		this.orderRepository=orderRepository;
		this.userRepository=userRepository;
	}
	@Scheduled(cron="0 * * * * *")
	@Transactional
	public void resolveExpiredAuctions() {
		List<BiomassListing> expiredAuctions=listingRepository.findAll().stream()
				.filter(l->"ACTIVE".equals(l.getStatus()))
				.filter(l->"AUCTION".equals(l.getListingType()))
				.filter(l->l.getAuctionEndTime()!=null&&l.getAuctionEndTime().isBefore(LocalDateTime.now()))
				.filter(l->l.getHighestBidderId()!=null)
				.toList();
		for(BiomassListing listing:expiredAuctions) {
			Order order=Order.builder().orderType("BIOMASS").buyer(userRepository.findById(listing.getHighestBidderId()).orElseThrow())
                    .seller(listing.getFarmer())
                    .listingId(listing.getId())
                    .quantity(listing.getQuantityAvailable())
                    .pricePerUnit(listing.getHighestBidAmount())
                    .totalAmount(listing.getQuantityAvailable().multiply(listing.getHighestBidAmount()))
                    .status("AWAITING_PAYMENT")
                    .build();
			orderRepository.save(order);
			listing.setStatus("SOLD_OUT");
            listing.setQuantityAvailable(BigDecimal.ZERO);
            listingRepository.save(listing);
            
		}
	}
}
