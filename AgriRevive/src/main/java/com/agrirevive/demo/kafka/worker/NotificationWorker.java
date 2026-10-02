package com.agrirevive.demo.kafka.worker;
import com.agrirevive.demo.kafka.dto.OrderPlacedEvent;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
@Component
public class NotificationWorker {
	@KafkaListener(topics="biomass-orders",groupId="agrirevive-group")
	public void HandleOrderPlaced(OrderPlacedEvent event) {
		System.out.println("=========================================");
		System.out.println("KAFKA WORKER 1:NOTIFICATION SERVICE");
		System.out.println("Sending SMS to Seller:"+event.sellerName());
		System.out.println("Message: 'Great news!"+event.buyerName()+"just ordered your biomass for ₹"+event.totalAmount()+"!");
        System.out.println("=========================================");		
	}
}
