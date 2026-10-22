package com.agrirevive.demo.biomass;
import com.agrirevive.demo.biomass.dto.BiomassListingRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/biomass")
public class BiomassController {
	private final BiomassListingService listingService;
	public BiomassController(BiomassListingService listingService) {
		this.listingService=listingService;
	}
	@PostMapping
	@PreAuthorize("hasRole('FARMER')")
	public BiomassListing createListing(@RequestBody BiomassListingRequest request,Authentication authentication) {
		return listingService.createListing(authentication.getName(), request);
	}
	@GetMapping
	@PreAuthorize("hasAnyRole('INDUSTRY','CONSUMER','ADMIN','FARMER')")
	public List<BiomassListing> getActiveListings(){
		return listingService.getActiveListings();
	}
	@GetMapping("/mine")
	@PreAuthorize("hasRole('FARMER')")
	public List<BiomassListing> getMyListings(Authentication authentication){
		return listingService.getMyListings(authentication.getName());
	}
	@PutMapping("/{id}")
	@PreAuthorize("hasRole('FARMER')")
	public BiomassListing updateListing (@PathVariable Long id,@RequestBody BiomassListingRequest request,Authentication authentication) {
		return listingService.updateListing(id,authentication.getName(),request);
	}
}
