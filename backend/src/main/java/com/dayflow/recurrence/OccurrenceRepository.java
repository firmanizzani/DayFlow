package com.dayflow.recurrence;

import org.springframework.data.jpa.repository.*;

public interface OccurrenceRepository
    extends JpaRepository<Occurrence, Long>, JpaSpecificationExecutor<Occurrence> {
  java.util.List<Occurrence> findAllByUserId(Long userId);

  java.util.Optional<Occurrence> findByIdAndUserId(Long id, Long userId);

  java.util.Optional<Occurrence> findByRuleIdAndOccurrenceDate(
      Long ruleId, java.time.LocalDate date);
}
