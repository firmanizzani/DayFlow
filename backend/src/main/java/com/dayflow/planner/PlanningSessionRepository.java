package com.dayflow.planner;

import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface PlanningSessionRepository
    extends JpaRepository<PlanningSession, UUID>, JpaSpecificationExecutor<PlanningSession> {
  java.util.List<PlanningSession> findAllByUserId(UUID userId);

  java.util.Optional<PlanningSession> findByIdAndUserId(UUID id, UUID userId);
}
