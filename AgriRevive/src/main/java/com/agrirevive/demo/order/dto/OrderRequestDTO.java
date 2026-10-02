package com.agrirevive.demo.order.dto;
import lombok.Data;
import java.math.BigDecimal;
@Data
public class OrderRequestDTO {
	private Long listingId;
	private BigDecimal quantity;
	private BigDecimal offeredPrice;
	private String deliveryAddress;
	private String buyerNote;
}
