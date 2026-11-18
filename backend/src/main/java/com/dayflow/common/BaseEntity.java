package com.dayflow.common;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import jakarta.persistence.*;
import java.time.Instant;

@MappedSuperclass
public abstract class BaseEntity {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @JsonSerialize(using = ToStringSerializer.class)
  public Long id;

  @Column(nullable = false, updatable = false)
  public Instant createdAt = Instant.now();

  @Column(nullable = false)
  public Instant updatedAt = Instant.now();

  @PreUpdate
  public void updated() {
    updatedAt = Instant.now();
  }
}
