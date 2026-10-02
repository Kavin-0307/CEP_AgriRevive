package com.agrirevive.demo.order;
import com.agrirevive.demo.order.dto.OrderRequestDTO;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/orders")
public class OrderController {
 private final OrderService orderService;
 public OrderController(OrderService orderService) {
     this.orderService = orderService;
 }

 @PostMapping("/biomass")
 @PreAuthorize("hasRole('INDUSTRY')")
 public Order orderBiomass(@RequestBody OrderRequestDTO request,Authentication auth) {
     return orderService.placeBiomassOrder(auth.getName(), request);
 }

 @PostMapping("/products")
 @PreAuthorize("hasRole('CONSUMER')")
 public Order orderProduct(@RequestBody OrderRequestDTO request,Authentication auth) {
     return orderService.placeProductOrder(auth.getName(),request);
 }

 @GetMapping("/mine")
 @PreAuthorize("isAuthenticated()")
 public List<Order> getMyOrders(Authentication auth) {
     return orderService.getMyOrders(auth.getName());
 }
}