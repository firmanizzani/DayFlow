package com.dayflow.task;

import org.springframework.data.jpa.repository.*;

public interface SubtaskRepository
    extends JpaRepository<Subtask, Long>, JpaSpecificationExecutor<Subtask> {
  java.util.List<Subtask> findAllByUserId(Long userId);

  java.util.Optional<Subtask> findByIdAndUserId(Long id, Long userId);

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
  java.util.List<SubtaskCount> countForTasks(Long userId, java.util.List<Long> taskIds);
}
