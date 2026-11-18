package com.dayflow.common;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.persistence.*;

@MappedSuperclass
public abstract class OwnedEntity extends BaseEntity {
  @Column(nullable = false)
  @JsonSerialize(using = ToStringSerializer.class)
  public Long userId;
}
