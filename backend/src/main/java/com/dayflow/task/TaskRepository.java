package com.dayflow.task;

import org.springframework.data.jpa.repository.*;

public interface TaskRepository extends JpaRepository<Task, Long>, JpaSpecificationExecutor<Task> {
  java.util.List<Task> findAllByUserId(Long userId);

  java.util.Optional<Task> findByIdAndUserId(Long id, Long userId);
}
