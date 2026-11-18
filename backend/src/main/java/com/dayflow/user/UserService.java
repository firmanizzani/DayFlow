package com.dayflow.user;

import static com.dayflow.common.Input.*;

import com.dayflow.common.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.ZoneId;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {
  private final UserRepository users;
  private final PreferencesRepository preferences;

  public UserService(UserRepository users, PreferencesRepository preferences) {
    this.users = users;
    this.preferences = preferences;
  }

  public User get(Long id) {
    return users.findById(id).orElseThrow(ApiException::missing);
  }

  public User update(Long id, JsonNode input) {
    var user = get(id);
    if (input.has("name")) user.name = text(input, "name", 100);
    if (input.has("timezone")) {
      user.timezone = text(input, "timezone", 64);
      ZoneId.of(user.timezone);
    }
    return users.save(user);
  }

  public Preferences preferences(Long user) {
    return preferences.findAllByUserId(user).stream()
        .findFirst()
        .orElseThrow(ApiException::missing);
  }

  public Preferences updatePreferences(Long user, JsonNode input) {
    var p = preferences(user);
    if (input.has("theme")) p.theme = choice(input, "theme", "LIGHT", "DARK", "SYSTEM");
    if (input.has("notificationsEnabled")) {
      p.notificationsEnabled = bool(input, "notificationsEnabled");
    }
    if (input.has("defaultReminder")) {
      p.defaultReminder = number(input, "defaultReminder", 0, 60);
      if (!List.of(0, 5, 15, 30, 60).contains(p.defaultReminder)) {
        throw ApiException.invalid("Unsupported reminder interval.");
      }
    }
    if (input.has("focusMinutes")) p.focusMinutes = number(input, "focusMinutes", 1, 180);
    if (input.has("shortBreakMinutes"))
      p.shortBreakMinutes = number(input, "shortBreakMinutes", 1, 60);
    if (input.has("longBreakMinutes"))
      p.longBreakMinutes = number(input, "longBreakMinutes", 1, 120);
    return preferences.save(p);
  }

  public void delete(Long user) {
    users.delete(get(user));
  }
}
