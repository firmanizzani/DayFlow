package com.dayflow.planner;

import com.dayflow.common.OwnedEntity;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "planning_sessions")
@AttributeOverride(name = "id", column = @Column(name = "planning_session_id"))
public class PlanningSession extends OwnedEntity {
  @JsonSerialize(using = ToStringSerializer.class)
  public Long taskId;

  @JsonSerialize(using = ToStringSerializer.class)
  public Long occurrenceId;

  public Instant startAt;
  public Instant endAt;
  public String status = "PLANNED";
  public Integer reminderMinutesBefore;

  @JsonSerialize(using = ToStringSerializer.class)
  public Long previousSessionId;
}
