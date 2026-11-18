package com.dayflow.recurrence;

import org.springframework.data.jpa.repository.*;

public interface RecurringRuleRepository
    extends JpaRepository<RecurringRule, Long>, JpaSpecificationExecutor<RecurringRule> {
  java.util.List<RecurringRule> findAllByUserId(Long userId);

  java.util.Optional<RecurringRule> findByIdAndUserId(Long id, Long userId);
}
