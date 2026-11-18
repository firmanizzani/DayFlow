package com.dayflow.recurrence;

import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface OccurrenceRepository
    extends JpaRepository<Occurrence, UUID>, JpaSpecificationExecutor<Occurrence> {
  java.util.List<Occurrence> findAllByUserId(UUID userId);

  java.util.Optional<Occurrence> findByIdAndUserId(UUID id, UUID userId);

  java.util.Optional<Occurrence> findByRuleIdAndOccurrenceDate(
      UUID ruleId, java.time.LocalDate date);
}
