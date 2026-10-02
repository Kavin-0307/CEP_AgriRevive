package com.agrirevive.demo.product;
import com.agrirevive.demo.product.dto.EcoProductRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class EcoProductController {

 private final EcoProductService productService;

 public EcoProductController(EcoProductService productService) {
     this.productService = productService;
 }

 @PostMapping
 @PreAuthorize("hasRole('INDUSTRY')")
 public EcoProduct createProduct(@RequestBody EcoProductRequest request, Authentication authentication) {
     return productService.createProduct(authentication.getName(), request);
 }

 @GetMapping
 @PreAuthorize("hasAnyRole('CONSUMER', 'INDUSTRY', 'FARMER', 'ADMIN')")
 public List<EcoProduct> getStorefront() {
     return productService.getActiveStoreFront();
 }
}