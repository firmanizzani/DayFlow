package com.dayflow.common;

import jakarta.persistence.*;
import java.util.UUID;

@MappedSuperclass
public abstract class OwnedEntity extends BaseEntity {
  @Column(nullable = false)
  public UUID userId;
}
