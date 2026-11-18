package com.dayflow.user;

import org.springframework.data.jpa.repository.*;

public interface PreferencesRepository
    extends JpaRepository<Preferences, Long>, JpaSpecificationExecutor<Preferences> {
  java.util.List<Preferences> findAllByUserId(Long userId);

  java.util.Optional<Preferences> findByIdAndUserId(Long id, Long userId);
}
