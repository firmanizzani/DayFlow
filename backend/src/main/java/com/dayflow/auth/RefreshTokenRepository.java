package com.dayflow.auth;

import org.springframework.data.jpa.repository.*;

public interface RefreshTokenRepository
    extends JpaRepository<RefreshToken, Long>, JpaSpecificationExecutor<RefreshToken> {
  java.util.List<RefreshToken> findAllByUserId(Long userId);

  java.util.Optional<RefreshToken> findByIdAndUserId(Long id, Long userId);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  java.util.Optional<RefreshToken> findByTokenHash(String tokenHash);

  java.util.List<RefreshToken> findByUserId(Long userId);
}
