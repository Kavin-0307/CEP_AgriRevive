package com.agrirevive.demo.biomass;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BiomassListingRepository extends JpaRepository<BiomassListing,Long>{
	List<BiomassListing> findByStatus(String status);
	List<BiomassListing> findByFarmerId(Long farmerId);
}
