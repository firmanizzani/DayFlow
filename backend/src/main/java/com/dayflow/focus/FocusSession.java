package com.dayflow.focus;

import com.dayflow.common.OwnedEntity;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "focus_sessions")
@AttributeOverride(name = "id", column = @Column(name = "focus_session_id"))
public class FocusSession extends OwnedEntity {
  @JsonSerialize(using = ToStringSerializer.class)
  public Long taskId;

  public String mode;
  public Instant startedAt;
  public Instant endedAt;
  public int durationSeconds;
  public boolean completed;

  public java.util.UUID clientId;
}
