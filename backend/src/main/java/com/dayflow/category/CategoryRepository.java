package com.dayflow.category;

import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface CategoryRepository
    extends JpaRepository<Category, UUID>, JpaSpecificationExecutor<Category> {
  java.util.List<Category> findAllByUserId(UUID userId);

  java.util.Optional<Category> findByIdAndUserId(UUID id, UUID userId);
}
