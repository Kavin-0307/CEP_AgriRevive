package com.agrirevive.demo.subsidy;

import com.agrirevive.demo.order.Order;
import com.agrirevive.demo.order.OrderRepository;
import com.agrirevive.demo.user.User;
import com.agrirevive.demo.user.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
@RestController
@RequestMapping("/api/subsidies")
public class SubsidyController {
    private final SubsidyClaimRepository subsidyRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    public SubsidyController(SubsidyClaimRepository subsidyRepository, OrderRepository orderRepository, UserRepository userRepository) {
        this.subsidyRepository = subsidyRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }
    @PostMapping("/claim/{orderId}")
    @PreAuthorize("hasRole('FARMER')")
    public SubsidyClaim fileClaim(@PathVariable Long orderId, Authentication auth) {
        User farmer = userRepository.findByEmail(auth.getName()).orElseThrow();
        Order order = orderRepository.findById(orderId).orElseThrow();
        
        SubsidyClaim claim = SubsidyClaim.builder()
                .farmer(farmer)
                .order(order)
                .amount(order.getTotalAmount().multiply(new BigDecimal("0.10")))
                .status("PENDING")
                .build();
                
        return subsidyRepository.save(claim);
    }
}