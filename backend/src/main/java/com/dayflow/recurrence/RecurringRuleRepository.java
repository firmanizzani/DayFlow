package com.dayflow.recurrence;

import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface RecurringRuleRepository
    extends JpaRepository<RecurringRule, UUID>, JpaSpecificationExecutor<RecurringRule> {
  java.util.List<RecurringRule> findAllByUserId(UUID userId);

  java.util.Optional<RecurringRule> findByIdAndUserId(UUID id, UUID userId);
}
