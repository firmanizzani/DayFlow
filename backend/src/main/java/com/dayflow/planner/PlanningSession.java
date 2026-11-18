package com.dayflow.planner;

import com.dayflow.common.OwnedEntity;
import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "planning_sessions")
public class PlanningSession extends OwnedEntity {
  public UUID taskId;
  public UUID occurrenceId;
  public Instant startAt;
  public Instant endAt;
  public String status = "PLANNED";
  public Integer reminderMinutesBefore;
  public UUID previousSessionId;
}
