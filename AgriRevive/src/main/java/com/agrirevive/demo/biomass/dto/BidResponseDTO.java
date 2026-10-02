package com.agrirevive.demo.biomass.dto;
import lombok.Data;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
@Data
@AllArgsConstructor
public class BidResponseDTO {
	private Long listingId;
	private String bidderName;
	private BigDecimal amount;
}
