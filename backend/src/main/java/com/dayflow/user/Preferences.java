package com.dayflow.user;

import com.dayflow.common.OwnedEntity;
import jakarta.persistence.*;
import java.time.*;

@Entity
@Table(name = "user_preferences")
public class Preferences extends OwnedEntity {
  public String theme = "SYSTEM";
  public boolean notificationsEnabled;
  public int defaultReminder = 15;
  public int focusMinutes = 25;
  public int shortBreakMinutes = 5;
  public int longBreakMinutes = 15;
}
