package com.dayflow.auth;

import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface PasswordResetRepository
    extends JpaRepository<PasswordReset, UUID>, JpaSpecificationExecutor<PasswordReset> {
  java.util.List<PasswordReset> findAllByUserId(UUID userId);

  java.util.Optional<PasswordReset> findByIdAndUserId(UUID id, UUID userId);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  java.util.Optional<PasswordReset> findByTokenHash(String tokenHash);
}
