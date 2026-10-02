package com.agrirevive.demo.subsidy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SubsidyClaimRepository extends JpaRepository<SubsidyClaim,Long>{
	List<SubsidyClaim> findByFarmerId(Long farmerId);

}
