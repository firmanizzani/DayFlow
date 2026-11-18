package com.dayflow.user;

import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface PreferencesRepository
    extends JpaRepository<Preferences, UUID>, JpaSpecificationExecutor<Preferences> {
  java.util.List<Preferences> findAllByUserId(UUID userId);

  java.util.Optional<Preferences> findByIdAndUserId(UUID id, UUID userId);
}
