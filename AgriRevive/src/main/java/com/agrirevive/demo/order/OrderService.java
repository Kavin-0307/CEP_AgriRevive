package com.agrirevive.demo.order;
import com.agrirevive.demo.common.BusinessRuleException;
import com.agrirevive.demo.common.ResourceNotFoundException;
import com.agrirevive.demo.biomass.BiomassListing;
import com.agrirevive.demo.biomass.BiomassListingRepository;
import com.agrirevive.demo.product.EcoProduct;
import com.agrirevive.demo.product.EcoProductRepository;
import com.agrirevive.demo.user.User;
import com.agrirevive.demo.user.UserRepository;
import com.agrirevive.demo.order.dto.OrderRequestDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.kafka.core.KafkaTemplate;
import com.agrirevive.demo.kafka.dto.OrderPlacedEvent;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.cache.annotation.CacheEvict;
@Service
public class OrderService {
	private final OrderRepository orderRepository;
	private final UserRepository userRepository;
	private final EcoProductRepository productRepository;
	private final BiomassListingRepository biomassRepository;
	private final KafkaTemplate<Object,Object> kafkaTemplate;
	public OrderService(OrderRepository orderRepository,BiomassListingRepository biomassRepository,EcoProductRepository
			productRepository,UserRepository userRepository,KafkaTemplate<Object,Object> kafkaTemplate) {
		this.orderRepository=orderRepository;
		this.biomassRepository=biomassRepository;
		this.productRepository=productRepository;
		this.userRepository=userRepository;
		this.kafkaTemplate=kafkaTemplate;
	}
	@Transactional
	public Order placeBiomassOrder(String buyerEmail,OrderRequestDTO req) {
		User buyer =userRepository.findByEmail(buyerEmail).orElseThrow();
		BiomassListing listing=biomassRepository.findById(req.getListingId()).orElseThrow(()->new ResourceNotFoundException("Listing Not Found"));
		if(!"ACTIVE".equals(listing.getStatus()))throw new BusinessRuleException("Listing not available");
		if(listing.getQuantityAvailable().compareTo(req.getQuantity())<0) throw new BusinessRuleException("Stock not enough");
		listing.setQuantityAvailable(listing.getQuantityAvailable().subtract(req.getQuantity()));
		if(listing.getQuantityAvailable().compareTo(BigDecimal.ZERO)==0)listing.setStatus("SOLD_OUT");		
		
		biomassRepository.save(listing);
		BigDecimal unitPrice=listing.getPricePerTonne();
		BigDecimal totalAmount=req.getQuantity().multiply(unitPrice);
		
		Order order=Order.builder().orderType("BIOMASS").buyer(buyer).seller(listing.getFarmer())
				.listingId(listing.getId()).quantity(req.getQuantity()).pricePerUnit(unitPrice).totalAmount(totalAmount)
				.status("REQUESTED").deliveryAddress(req.getDeliveryAddress()).buyerNote(req.getBuyerNote()).build();
		Order savedOrder=orderRepository.save(order);
		OrderPlacedEvent event=new OrderPlacedEvent(savedOrder.getId(),savedOrder.getOrderType(),
				buyer.getName(),listing.getFarmer().getName(),savedOrder.getTotalAmount());
		kafkaTemplate.send("biomass-orders",event);
		return savedOrder;

	}
	@Transactional
	public Order placeProductOrder(String email,OrderRequestDTO req) {
		User consumer=userRepository.findByEmail(email).orElseThrow();
		EcoProduct product=productRepository.findById(req.getListingId()).orElseThrow(()->new ResourceNotFoundException("Product Not Found"));
		if(!"ACTIVE".equals(product.getStatus())||product.getStockQuantity()<req.getQuantity().intValue())
			throw new BusinessRuleException("Product out of stock");
		 product.setStockQuantity(product.getStockQuantity()-req.getQuantity().intValue());
	        if (product.getStockQuantity()==0) {
	            product.setStatus("OUT_OF_STOCK");
	        }
	        productRepository.save(product);
	        Order order = Order.builder()
	                .orderType("ECO_PRODUCT")
	                .buyer(consumer)
	                .seller(product.getIndustry())
	                .listingId(product.getId())
	                .quantity(req.getQuantity())
	                .pricePerUnit(product.getPrice())
	                .totalAmount(req.getQuantity().multiply(product.getPrice()))
	                .status("PAID") // Consumers pay upfront
	                .deliveryAddress(req.getDeliveryAddress())
	                .build();
	        return orderRepository.save(order);
		
	}
	@Transactional 
	public Order updateOrderStatus(Long orderId,String newStatus,String userEmail) {
		Order order=orderRepository.findById(orderId).orElseThrow(()->new ResourceNotFoundException("Order not found"));
		User user=userRepository.findByEmail(userEmail).orElseThrow(()->new ResourceNotFoundException("User Not Found"));
		if(!order.getBuyer().getId().equals(user.getId())&&!order.getSeller().getId().equals(user.getId()))
			throw new BusinessRuleException("You do not have permission to update the order");
		if("REJECTED".equals(newStatus)&&!"REJECTED".equals(order.getStatus())) {
			BiomassListing listing=biomassRepository.findById(order.getListingId()).orElse(null);
		if(listing!=null) {
			listing.setQuantityAvailable(listing.getQuantityAvailable().add(order.getQuantity()));
			if("SOLD_OUT".equals(listing.getStatus()))listing.setStatus("ACTIVE");
			biomassRepository.save(listing);
		}
		}
		
		order.setStatus(newStatus);
		return orderRepository.save(order);
	}
	public List<Order> getMyOrders(String email){
		User user=userRepository.findByEmail(email).orElseThrow();
		List<Order> orders=orderRepository.findByBuyerId(user.getId());
		orders.addAll(orderRepository.findBySellerId(user.getId()));
		return orders;				
	}
}
