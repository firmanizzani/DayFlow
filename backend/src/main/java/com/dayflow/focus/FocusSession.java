package com.dayflow.focus;

import com.dayflow.common.OwnedEntity;
import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "focus_sessions")
public class FocusSession extends OwnedEntity {
  public UUID taskId;
  public String mode;
  public Instant startedAt;
  public Instant endedAt;
  public int durationSeconds;
  public boolean completed;
  public UUID clientId;
}
