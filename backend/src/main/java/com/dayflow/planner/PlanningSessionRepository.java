package com.dayflow.planner;

import org.springframework.data.jpa.repository.*;

public interface PlanningSessionRepository
    extends JpaRepository<PlanningSession, Long>, JpaSpecificationExecutor<PlanningSession> {
  java.util.List<PlanningSession> findAllByUserId(Long userId);

  java.util.Optional<PlanningSession> findByIdAndUserId(Long id, Long userId);
}
