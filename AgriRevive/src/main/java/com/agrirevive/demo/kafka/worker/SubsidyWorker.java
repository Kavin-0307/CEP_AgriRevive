package com.agrirevive.demo.kafka.worker;

import com.agrirevive.demo.kafka.dto.OrderPlacedEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
@Component
public class SubsidyWorker {
	@KafkaListener(topics="biomass-orders",groupId="agrirevive-group")
	public void processSubsidies(OrderPlacedEvent event) {
		BigDecimal estimatedSubsidy=event.totalAmount().multiply(new BigDecimal("0.10"));
		System.out.println("=========================================");
        System.out.println("KAFKA WORKER 2: SUBSIDY SERVICE");
        System.out.println("Order " + event.orderId() + " processed asynchronously.");
        System.out.println("Auto-generating government subsidy claim for ₹" + estimatedSubsidy);
        System.out.println("=========================================");
	}
}
