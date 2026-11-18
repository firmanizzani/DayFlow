package com.dayflow.focus;

import static com.dayflow.common.Input.*;

import com.dayflow.common.ApiException;
import com.dayflow.task.TaskService;
import com.dayflow.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.*;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class FocusService {
  private final FocusSessionRepository sessions;
  private final TaskService tasks;
  private final UserRepository users;

  public FocusService(FocusSessionRepository sessions, TaskService tasks, UserRepository users) {
    this.sessions = sessions;
    this.tasks = tasks;
    this.users = users;
  }

  public FocusSession save(Long user, JsonNode input) {
    users.lockById(user).orElseThrow(ApiException::missing);
    java.util.UUID clientId = uuid(input, "clientId");
    if (clientId == null) throw ApiException.invalid("A unique client session ID is required.");
    var existing = sessions.findByUserIdAndClientId(user, clientId);
    if (existing.isPresent()) return existing.get();
    var session = new FocusSession();
    session.userId = user;
    session.clientId = clientId;
    session.taskId = identifier(input, "taskId");
    if (session.taskId != null) tasks.owned(user, session.taskId);
    session.mode = choice(input, "mode", "FOCUS", "SHORT_BREAK", "LONG_BREAK");
    session.startedAt = instant(input, "startedAt");
    session.endedAt = instant(input, "endedAt");
    session.durationSeconds = number(input, "durationSeconds", 1, 10800);
    session.completed = bool(input, "completed");
    if (session.startedAt == null
        || session.endedAt == null
        || session.endedAt.isBefore(session.startedAt)
        || session.endedAt.isAfter(Instant.now().plusSeconds(60))
        || session.durationSeconds
            > Duration.between(session.startedAt, session.endedAt).toSeconds() + 1) {
      throw ApiException.invalid("Recorded focus time must fit within the session timestamps.");
    }
    return sessions.save(session);
  }

  public List<FocusSession> list(Long user, Instant from, Instant to) {
    com.dayflow.planner.PlannerService.validateRange(from, to);
    return sessions.findAllByUserId(user).stream()
        .filter(s -> !s.startedAt.isBefore(from) && s.startedAt.isBefore(to))
        .sorted(Comparator.comparing((FocusSession s) -> s.startedAt).reversed())
        .toList();
  }

  public Map<String, Long> summary(Long user, Instant from, Instant to) {
    var items = list(user, from, to).stream().filter(s -> s.mode.equals("FOCUS")).toList();
    return Map.of(
        "totalSeconds", items.stream().mapToLong(s -> s.durationSeconds).sum(),
        "completedSessions", items.stream().filter(s -> s.completed).count());
  }
}
