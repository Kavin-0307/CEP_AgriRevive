package com.agrirevive.demo.product;
import com.agrirevive.demo.common.ResourceNotFoundException;
import com.agrirevive.demo.user.User;
import com.agrirevive.demo.user.UserRepository;
import com.agrirevive.demo.product.dto.EcoProductRequest;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;



@Service
public class EcoProductService {
	private final EcoProductRepository productRepository;
	private final UserRepository userRepository;
	public EcoProductService(EcoProductRepository productRepository,UserRepository userRepository) {
		this.productRepository=productRepository;
		this.userRepository=userRepository;
	}
	@Transactional
	@CacheEvict(value="storefrontProducts",allEntries=true)
	public EcoProduct createProduct(String industryEmail,EcoProductRequest req) {
		User industry=userRepository.findByEmail(industryEmail).orElseThrow(()->new ResourceNotFoundException("Industry User not Found"));

        EcoProduct product = EcoProduct.builder()
                .industry(industry)
                .name(req.getName())
                .description(req.getDescription())
                .price(req.getPrice())
                .stockQuantity(req.getStockQuantity())
                .imagePath(req.getImagePath())
                .status("ACTIVE")
                .build();
        return productRepository.save(product);
	}
	@Cacheable(value="storefrontProducts")
	public List<EcoProduct> getActiveStoreFront(){
		return productRepository.findByStatus("ACTIVE");
	}
}
