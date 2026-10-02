package com.agrirevive.demo.product;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EcoProductRepository extends JpaRepository<EcoProduct,Long>{
	List<EcoProduct> findByStatus(String status);
}
