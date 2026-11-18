package com.dayflow.task;

import java.util.UUID;
import org.springframework.data.jpa.repository.*;

public interface SubtaskRepository
    extends JpaRepository<Subtask, UUID>, JpaSpecificationExecutor<Subtask> {
  java.util.List<Subtask> findAllByUserId(UUID userId);

  java.util.Optional<Subtask> findByIdAndUserId(UUID id, UUID userId);

  @Query(
      """
      select new com.dayflow.task.SubtaskCount(
          s.taskId,
          count(s),
          sum(case when s.isCompleted = true then 1 else 0 end)
      )
      from Subtask s
      where s.userId = :userId and s.taskId in :taskIds
      group by s.taskId
      """)
  java.util.List<SubtaskCount> countForTasks(UUID userId, java.util.List<UUID> taskIds);
}
