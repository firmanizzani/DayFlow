package com.dayflow.task;

import com.dayflow.common.OwnedEntity;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "tasks")
@AttributeOverride(name = "id", column = @Column(name = "task_id"))
public class Task extends OwnedEntity {
  @JsonSerialize(using = ToStringSerializer.class)
  public Long categoryId;

  public String title;
  public String description;
  public String priority = "MEDIUM";
  public String status = "TODO";
  public Instant dueAt;
  public Instant completedAt;

  @Transient public long totalSubtasks;

  @Transient public long completedSubtasks;
}
