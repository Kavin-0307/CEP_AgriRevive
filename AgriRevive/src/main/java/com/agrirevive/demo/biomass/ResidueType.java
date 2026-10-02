package com.agrirevive.demo.biomass;
import lombok.*;
import jakarta.persistence.*;

@Entity
@Table(name="residue_types")
@Getter@Setter@NoArgsConstructor@AllArgsConstructor
public class ResidueType {
	@Id
	@GeneratedValue(strategy=GenerationType.IDENTITY)
	private Long id;
	private String name;
	private String description;
}
