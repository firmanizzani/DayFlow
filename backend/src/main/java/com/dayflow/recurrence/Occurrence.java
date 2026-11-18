package com.dayflow.recurrence;

import com.dayflow.common.OwnedEntity;
import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "recurring_occurrences")
public class Occurrence extends OwnedEntity {
  public UUID ruleId;
  public LocalDate occurrenceDate;
  public String titleOverride;
  public String status = "TODO";
  public Instant completedAt;
}
