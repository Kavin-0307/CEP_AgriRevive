package com.agrirevive.demo.biomass;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;

@Service
public class AiVerificationService {
	private final BiomassListingRepository listingRepository;
	public AiVerificationService(BiomassListingRepository listingRepository) {
		this.listingRepository=listingRepository;
	}
	@Async
	@Transactional
	@CacheEvict(value="activeListings",allEntries=true)
	public void verifyListing(Long listingId) {
		try {
			Thread.sleep(3000);
			BiomassListing listing=listingRepository.findById(listingId).orElseThrow();
			if(listing.getMoisturePercent()!=null&&listing.getMoisturePercent().doubleValue()>20.0) {
				listing.setAiVerifiedStatus("REJECTED");
				listing.setStatus("REJECTED");
				listing.setAdminRemarks("AI rejected due to excessive moisture content.");
			}else {
				listing.setAiVerifiedStatus("APPROVED");
				listing.setStatus("ACTIVE");
			}
			listingRepository.save(listing);
		}
		catch(InterruptedException e) {
			Thread.currentThread().interrupt();
		}
		
	}
}
