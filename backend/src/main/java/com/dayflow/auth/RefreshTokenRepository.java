package com.dayflow.auth;

import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface RefreshTokenRepository
    extends JpaRepository<RefreshToken, UUID>, JpaSpecificationExecutor<RefreshToken> {
  java.util.List<RefreshToken> findAllByUserId(UUID userId);

  java.util.Optional<RefreshToken> findByIdAndUserId(UUID id, UUID userId);

  @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
  java.util.Optional<RefreshToken> findByTokenHash(String tokenHash);

  java.util.List<RefreshToken> findByUserId(UUID userId);
}
