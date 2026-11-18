package com.dayflow.category;

import org.springframework.data.jpa.repository.*;

public interface CategoryRepository
    extends JpaRepository<Category, Long>, JpaSpecificationExecutor<Category> {
  java.util.List<Category> findAllByUserId(Long userId);

  java.util.Optional<Category> findByIdAndUserId(Long id, Long userId);
}
