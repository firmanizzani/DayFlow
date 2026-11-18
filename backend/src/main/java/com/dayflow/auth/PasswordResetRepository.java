package com.dayflow.auth;

import org.springframework.data.jpa.repository.*;

public interface PasswordResetRepository
    extends JpaRepository<PasswordReset, Long>, JpaSpecificationExecutor<PasswordReset> {
  java.util.List<PasswordReset> findAllByUserId(Long userId);

  java.util.Optional<PasswordReset> findByIdAndUserId(Long id, Long userId);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  java.util.Optional<PasswordReset> findByTokenHash(String tokenHash);
}
