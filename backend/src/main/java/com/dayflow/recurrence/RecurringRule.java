package com.dayflow.recurrence;

import com.dayflow.common.OwnedEntity;
import jakarta.persistence.*;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "recurring_rules")
public class RecurringRule extends OwnedEntity {
  public UUID taskId;
  public String frequency;
  public int repeatInterval;
  public String weekdays = "";
  public LocalDate startDate;
  public LocalDate endDate;
  public boolean active = true;
}
