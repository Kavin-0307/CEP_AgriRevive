package com.agrirevive.demo.kafka.dto;

import java.math.BigDecimal;
public record ListingCreatedEvent(Long listingId,String farmerName,String residueType,BigDecimal
		quantityAvailable) {

}
