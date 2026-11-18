package com.dayflow.focus;

import org.springframework.data.jpa.repository.*;

public interface FocusSessionRepository
    extends JpaRepository<FocusSession, Long>, JpaSpecificationExecutor<FocusSession> {
  java.util.List<FocusSession> findAllByUserId(Long userId);

  java.util.Optional<FocusSession> findByIdAndUserId(Long id, Long userId);

  java.util.Optional<FocusSession> findByUserIdAndClientId(Long userId, java.util.UUID clientId);
}
