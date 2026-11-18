package com.dayflow.task;

import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {
  java.util.List<Task> findAllByUserId(UUID userId);

  java.util.Optional<Task> findByIdAndUserId(UUID id, UUID userId);
}
