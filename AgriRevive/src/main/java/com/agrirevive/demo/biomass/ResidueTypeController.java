package com.agrirevive.demo.biomass;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/residue-types")
public class ResidueTypeController {
	private final ResidueTypeRepository residueTypeRepository;
	public ResidueTypeController(ResidueTypeRepository residueTypeRepository) {
		this.residueTypeRepository=residueTypeRepository;
	}
	@GetMapping
	@PreAuthorize("isAuthenticated")
	public List<ResidueType> getAllTypes(){
		return residueTypeRepository.findAll();
	}
}
