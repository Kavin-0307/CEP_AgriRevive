package com.agrirevive.demo.biomass.dto;
import java.math.BigDecimal;
import lombok.Data;
@Data
public class BidRequestDTO {
	private Long listingId;
	private BigDecimal amount;
}
