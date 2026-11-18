package com.dayflow.user;

import com.dayflow.common.BaseEntity;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "users")
@AttributeOverride(name = "id", column = @Column(name = "user_id"))
public class User extends BaseEntity {
  public String name;
  public String email;
  @com.fasterxml.jackson.annotation.JsonIgnore public String passwordHash;
  public String timezone = "UTC";
}
