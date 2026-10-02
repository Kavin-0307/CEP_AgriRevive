package com.agrirevive.demo.biomass;
import com.agrirevive.demo.bidding.Bid;
import com.agrirevive.demo.bidding.BidRepository;
import com.agrirevive.demo.biomass.dto.BidRequestDTO;
import com.agrirevive.demo.biomass.dto.BidResponseDTO;
import com.agrirevive.demo.user.User;
import com.agrirevive.demo.user.UserRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;
import java.security.Principal;
import java.time.LocalDateTime;

@Controller
public class BidController {
	private final BiomassListingRepository listingRepository;
	private final BidRepository bidRepository;
	private final UserRepository userRepository;
	private final SimpMessagingTemplate messagingTemplate;
	public BidController(BiomassListingRepository listingRepository,BidRepository bidRepository,
			UserRepository userRepository,SimpMessagingTemplate messagingTemplate) {
		this.listingRepository=listingRepository;
		this.bidRepository=bidRepository;
		this.userRepository=userRepository;
		this.messagingTemplate=messagingTemplate;
	}
	@MessageMapping("/bid")
	@Transactional
	public void placeBid(@Payload BidRequestDTO request,Principal principal) {
		if(principal==null)return;
		User bidder=userRepository.findByEmail(principal.getName()).orElseThrow();
		BiomassListing listing=listingRepository.findById(request.getListingId()).orElseThrow();
		if(!"AUCTION".equals(listing.getListingType()))return;
		if(listing.getAuctionEndTime()!=null&&LocalDateTime.now().isAfter(listing.getAuctionEndTime()))return;
		if(listing.getHighestBidAmount()!=null&&request.getAmount().compareTo(listing.getHighestBidAmount())<0)return;
		Bid bid=Bid.builder().listing(listing).bidder(bidder).amount(request.getAmount()).build();
		bidRepository.save(bid);
		listing.setHighestBidAmount(request.getAmount());
		listing.setHighestBidderId(bidder.getId());
		listingRepository.save(listing);
        BidResponseDTO response = new BidResponseDTO(listing.getId(), bidder.getName(), request.getAmount());
        messagingTemplate.convertAndSend("/topic/bids/" + listing.getId(), response);

	}
}
