package com.dayflow.focus;

import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface FocusSessionRepository
    extends JpaRepository<FocusSession, UUID>, JpaSpecificationExecutor<FocusSession> {
  java.util.List<FocusSession> findAllByUserId(UUID userId);

  java.util.Optional<FocusSession> findByIdAndUserId(UUID id, UUID userId);

  java.util.Optional<FocusSession> findByUserIdAndClientId(UUID userId, UUID clientId);
}
