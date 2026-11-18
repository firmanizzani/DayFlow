package com.dayflow.auth;

import com.dayflow.common.OwnedEntity;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "auth_refresh_tokens")
@AttributeOverride(name = "id", column = @Column(name = "auth_refresh_token_id"))
public class RefreshToken extends OwnedEntity {
  public String tokenHash;
  public Instant expiresAt;
  public Instant revokedAt;
}
