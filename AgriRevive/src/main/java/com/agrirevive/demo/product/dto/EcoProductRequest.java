package com.agrirevive.demo.product.dto;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class EcoProductRequest {
	private String name;
	private String description;
	private BigDecimal price;
	private Integer stockQuantity;
	private String imagePath;
}
