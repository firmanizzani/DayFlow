package com.dayflow.recurrence;

import com.dayflow.common.OwnedEntity;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "recurring_rules")
@AttributeOverride(name = "id", column = @Column(name = "recurring_rule_id"))
public class RecurringRule extends OwnedEntity {
  @JsonSerialize(using = ToStringSerializer.class)
  public Long taskId;

  public String frequency;
  public int repeatInterval;
  public String weekdays = "";
  public LocalDate startDate;
  public LocalDate endDate;
  public boolean active = true;
}
