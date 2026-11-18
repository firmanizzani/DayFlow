package com.dayflow.task;

import com.dayflow.common.OwnedEntity;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "subtasks")
@AttributeOverride(name = "id", column = @Column(name = "subtask_id"))
public class Subtask extends OwnedEntity {
  @JsonSerialize(using = ToStringSerializer.class)
  public Long taskId;

  public String title;
  public boolean isCompleted;
  public int sortOrder;
}
