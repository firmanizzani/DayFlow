package com.dayflow.task;

import com.dayflow.common.OwnedEntity;
import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "subtasks")
public class Subtask extends OwnedEntity {
  public UUID taskId;
  public String title;
  public boolean isCompleted;
  public int sortOrder;
}
