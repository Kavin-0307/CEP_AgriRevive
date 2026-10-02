package com.agrirevive.demo.kafka.dto;
import java.math.BigDecimal;
public record OrderPlacedEvent(Long orderId,String orderType,String buyerName,String sellerName
		,BigDecimal totalAmount) {

}
