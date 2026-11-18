package com.dayflow.planner;

import static com.dayflow.common.Input.*;

import com.dayflow.common.ApiException;
import com.dayflow.recurrence.OccurrenceRepository;
import com.dayflow.recurrence.RecurringRuleRepository;
import com.dayflow.task.TaskService;
import com.dayflow.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class PlannerService {
  private final PlanningSessionRepository sessions;
  private final TaskService tasks;
  private final UserRepository users;
  private final OccurrenceRepository occurrences;
  private final RecurringRuleRepository rules;

  public PlannerService(
      PlanningSessionRepository sessions,
      TaskService tasks,
      UserRepository users,
      OccurrenceRepository occurrences,
      RecurringRuleRepository rules) {
    this.sessions = sessions;
    this.tasks = tasks;
    this.users = users;
    this.occurrences = occurrences;
    this.rules = rules;
  }

  public List<PlanningSession> list(Long user, Instant from, Instant to) {
    validateRange(from, to);
    return sessions.findAllByUserId(user).stream()
        .filter(s -> s.startAt.isBefore(to) && s.endAt.isAfter(from))
        .sorted(java.util.Comparator.comparing(s -> s.startAt))
        .toList();
  }

  public static void validateRange(Instant from, Instant to) {
    if (from == null
        || to == null
        || !to.isAfter(from)
        || Duration.between(from, to).toDays() > 366) {
      throw ApiException.invalid("Select a date range of at most one year.");
    }
  }

  public static boolean overlaps(Instant start, Instant end, Instant otherStart, Instant otherEnd) {
    return start.isBefore(otherEnd) && end.isAfter(otherStart);
  }

  public PlanningSession save(Long user, Long id, JsonNode input) {
    // Serialize writes for each user so concurrent requests see committed conflicts.
    users.lockById(user).orElseThrow(ApiException::missing);
    PlanningSession session = id == null ? new PlanningSession() : owned(user, id);
    if (id != null && !session.status.equals("PLANNED")) {
      throw ApiException.invalid("Only planned sessions can be edited.");
    }
    session.userId = user;
    if (id == null || input.has("taskId")) {
      session.taskId = identifier(input, "taskId");
    }
    if (session.taskId == null) {
      throw ApiException.invalid("Choose a task to plan.");
    }
    tasks.owned(user, session.taskId);
    if (input.has("occurrenceId")) {
      session.occurrenceId = identifier(input, "occurrenceId");
    }
    if (session.occurrenceId != null) {
      var occurrence =
          occurrences
              .findByIdAndUserId(session.occurrenceId, user)
              .orElseThrow(ApiException::missing);
      var rule =
          rules.findByIdAndUserId(occurrence.ruleId, user).orElseThrow(ApiException::missing);
      if (!rule.taskId.equals(session.taskId)) {
        throw ApiException.invalid("The occurrence must belong to this task.");
      }
    }
    if (id == null || input.has("startAt")) {
      session.startAt = instant(input, "startAt");
    }
    if (id == null || input.has("endAt")) {
      session.endAt = instant(input, "endAt");
    }
    if (session.startAt == null
        || session.endAt == null
        || !session.endAt.isAfter(session.startAt)) {
      throw ApiException.invalid("End time must be after start time.");
    }
    if (input.has("reminderMinutesBefore")) {
      session.reminderMinutesBefore =
          input.hasNonNull("reminderMinutesBefore")
              ? number(input, "reminderMinutesBefore", 0, 60)
              : null;
      if (session.reminderMinutesBefore != null
          && !List.of(0, 5, 15, 30, 60).contains(session.reminderMinutesBefore)) {
        throw ApiException.invalid("Choose a supported reminder interval.");
      }
    }
    var conflicts =
        sessions.findAllByUserId(user).stream()
            .filter(s -> !s.id.equals(session.id))
            .filter(s -> s.status.equals("PLANNED"))
            .filter(s -> overlaps(session.startAt, session.endAt, s.startAt, s.endAt))
            .toList();
    boolean allowConflict = input.has("allowConflict") && bool(input, "allowConflict");
    if (!conflicts.isEmpty() && !allowConflict) {
      throw new ApiException(
          HttpStatus.CONFLICT,
          "SCHEDULE_CONFLICT",
          "This time overlaps another plan. Change the time or save anyway.",
          conflicts);
    }
    return sessions.save(session);
  }

  public PlanningSession reschedule(Long user, Long id, JsonNode input) {
    var previous = owned(user, id);
    if (!previous.status.equals("PLANNED")) {
      throw ApiException.invalid("Only planned sessions can be rescheduled.");
    }
    var copy = input.deepCopy();
    ((com.fasterxml.jackson.databind.node.ObjectNode) copy)
        .put("taskId", previous.taskId.toString());
    if (previous.occurrenceId != null) {
      ((com.fasterxml.jackson.databind.node.ObjectNode) copy)
          .put("occurrenceId", previous.occurrenceId.toString());
    }
    previous.status = "RESCHEDULED";
    sessions.saveAndFlush(previous);
    var next = save(user, null, copy);
    next.previousSessionId = previous.id;
    return sessions.save(next);
  }

  public PlanningSession status(Long user, Long id, JsonNode input) {
    var session = owned(user, id);
    session.status = choice(input, "status", "PLANNED", "COMPLETED", "CANCELLED");
    return sessions.save(session);
  }

  public void cancel(Long user, Long id) {
    var session = owned(user, id);
    session.status = "CANCELLED";
    sessions.save(session);
  }

  private PlanningSession owned(Long user, Long id) {
    return sessions.findByIdAndUserId(id, user).orElseThrow(ApiException::missing);
  }
}
