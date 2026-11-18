package com.dayflow.user;

import com.dayflow.common.BaseEntity;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "users")
public class User extends BaseEntity {
  public String name;
  public String email;
  @com.fasterxml.jackson.annotation.JsonIgnore public String passwordHash;
  public String timezone = "UTC";
}
