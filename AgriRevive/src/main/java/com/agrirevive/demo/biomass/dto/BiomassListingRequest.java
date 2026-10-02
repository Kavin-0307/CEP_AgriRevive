package com.agrirevive.demo.biomass.dto;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
@Data
public class BiomassListingRequest {
	private Long residueTypeId;
	private String title;
	private String description;
	private BigDecimal quantityAvailable;
	private BigDecimal pricePerTonne;
	private String qualityGrade;
	private BigDecimal moisturePercent;
	private String state;
	private String district;
	private String pickupAddress;
	private LocalDate availableFrom;
}
