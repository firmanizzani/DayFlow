package com.dayflow.auth;

import com.dayflow.common.OwnedEntity;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "auth_refresh_tokens")
public class RefreshToken extends OwnedEntity {
  public String tokenHash;
  public Instant expiresAt;
  public Instant revokedAt;
}
