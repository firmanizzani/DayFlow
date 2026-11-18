package com.dayflow.task;

import com.dayflow.common.OwnedEntity;
import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "tasks")
public class Task extends OwnedEntity {
  public UUID categoryId;
  public String title;
  public String description;
  public String priority = "MEDIUM";
  public String status = "TODO";
  public Instant dueAt;
  public Instant completedAt;

  @Transient public long totalSubtasks;

  @Transient public long completedSubtasks;
}
