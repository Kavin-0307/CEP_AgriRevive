package com.agrirevive.demo.biomass;

import java.util.List;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agrirevive.demo.common.BusinessRuleException;
import com.agrirevive.demo.biomass.dto.BiomassListingRequest;
import com.agrirevive.demo.common.ResourceNotFoundException;
import com.agrirevive.demo.user.User;
import com.agrirevive.demo.user.UserRepository;


@Service
public class BiomassListingService {
	private final BiomassListingRepository listingRepository;
	private final ResidueTypeRepository residueTypeRepository;
	private final UserRepository userRepository;
	private final AiVerificationService aiVerificationService;
	public BiomassListingService(BiomassListingRepository listingRepository,ResidueTypeRepository residueTypeRepository,UserRepository userRepository,
			AiVerificationService aiVerificationService) {
		this.userRepository=userRepository;
		this.listingRepository=listingRepository;
		this.aiVerificationService=aiVerificationService;
		this.residueTypeRepository=residueTypeRepository;
	}
	@Transactional
	@CacheEvict(value="activeListings",allEntries=true)
	public BiomassListing createListing(String farmerEmail,BiomassListingRequest req) {
		User farmer=userRepository.findByEmail(farmerEmail).orElseThrow(()->new ResourceNotFoundException("Farmer not found"));
		ResidueType type=residueTypeRepository.findById(req.getResidueTypeId()).orElseThrow(()->new ResourceNotFoundException("Residue type not found"));
		BiomassListing listing=BiomassListing.builder().farmer(farmer).residueType(type).title(req.getTitle()).description(req.getDescription())
				.quantityAvailable(req.getQuantityAvailable()).pricePerTonne(req.getPricePerTonne()).moisturePercent(req.getMoisturePercent())
				.state(req.getState()).district(req.getDistrict()).pickupAddress(req.getPickupAddress()).availableFrom(req.getAvailableFrom())
				.qualityGrade(req.getQualityGrade()).availableFrom(req.getAvailableFrom()).listingType(req.getListingType())
				.auctionEndTime(req.getAuctionEndTime())
				.status("PENDING_APPROVAL").aiVerifiedStatus("PENDING").build();
		listing=listingRepository.save(listing);
		aiVerificationService.verifyListing(listing.getId());
		return listing;
	}
	@Cacheable(value="activeListings")
	public List<BiomassListing> getActiveListings(){
		return listingRepository.findByStatus("ACTIVE");
	}
	public List<BiomassListing> getMyListings(String farmerEmail){
		User farmer=userRepository.findByEmail(farmerEmail).orElseThrow(()-> new ResourceNotFoundException("Farmer not found"));
		return listingRepository.findByFarmerId(farmer.getId());
	}
	@Transactional
	@CacheEvict(value="activeListings",allEntries=true)
	public BiomassListing updateListing(Long id,String farmerEmail,BiomassListingRequest req) {
		BiomassListing listing=listingRepository.findById(id).orElseThrow(()->new ResourceNotFoundException("Listing not found"));
		if(!listing.getFarmer().getEmail().equals(farmerEmail))throw new BusinessRuleException("You do not own this listing");
		listing.setTitle(req.getTitle());
		listing.setDescription(req.getDescription());
		listing.setQuantityAvailable(req.getQuantityAvailable());
		listing.setPricePerTonne(req.getPricePerTonne());
		listing.setMoisturePercent(req.getMoisturePercent());
		listing.setState(req.getState());
		listing.setDistrict(req.getDistrict());
		listing.setPickupAddress(req.getPickupAddress());
		listing.setQualityGrade(req.getQualityGrade());
		listing.setAvailableFrom(req.getAvailableFrom());
		return listingRepository.save(listing);
	}
	
}
