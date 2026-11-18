package com.dayflow.auth;

import com.dayflow.common.OwnedEntity;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "password_reset_tokens")
public class PasswordReset extends OwnedEntity {
  public String tokenHash;
  public Instant expiresAt;
  public Instant usedAt;
}
