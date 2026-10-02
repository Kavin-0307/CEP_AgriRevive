package com.agrirevive.demo.bidding;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface BidRepository extends JpaRepository<Bid,Long>{
	List<Bid> findByListingIdOrderByAmountDesc(Long listingId);
}
