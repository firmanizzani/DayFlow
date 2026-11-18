package com.dayflow.recurrence;

import com.dayflow.common.OwnedEntity;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "recurring_occurrences")
@AttributeOverride(name = "id", column = @Column(name = "recurring_occurrence_id"))
public class Occurrence extends OwnedEntity {
  @JsonSerialize(using = ToStringSerializer.class)
  public Long ruleId;

  public LocalDate occurrenceDate;
  public String titleOverride;
  public String status = "TODO";
  public Instant completedAt;
}
