package com.dayflow.recurrence;

import static com.dayflow.common.Input.*;

import com.dayflow.common.ApiException;
import com.dayflow.task.TaskService;
import com.dayflow.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RecurrenceService {
  private final RecurringRuleRepository rules;
  private final OccurrenceRepository occurrences;
  private final TaskService tasks;
  private final UserRepository users;

  public RecurrenceService(
      RecurringRuleRepository rules,
      OccurrenceRepository occurrences,
      TaskService tasks,
      UserRepository users) {
    this.rules = rules;
    this.occurrences = occurrences;
    this.tasks = tasks;
    this.users = users;
  }

  public List<RecurringRule> list(Long user) {
    return rules.findAllByUserId(user);
  }

  public RecurringRule save(Long user, Long id, JsonNode input) {
    var rule = id == null ? new RecurringRule() : owned(user, id);
    rule.userId = user;
    if (id == null) {
      rule.taskId = identifier(input, "taskId");
      if (rule.taskId == null) throw ApiException.invalid("Choose a task.");
      tasks.owned(user, rule.taskId);
    }
    if (id == null || input.has("frequency")) {
      rule.frequency = choice(input, "frequency", "DAILY", "WEEKLY", "MONTHLY");
    }
    if (id == null || input.has("repeatInterval")) {
      rule.repeatInterval = number(input, "repeatInterval", 1, 365);
    }
    if (id == null || input.has("startDate")) {
      rule.startDate = LocalDate.parse(text(input, "startDate", 10));
    }
    if (input.has("endDate")) {
      rule.endDate =
          input.hasNonNull("endDate") ? LocalDate.parse(input.get("endDate").asText()) : null;
    }
    if (rule.endDate != null && rule.endDate.isBefore(rule.startDate)) {
      throw ApiException.invalid("End date must be on or after start date.");
    }
    if (input.has("weekdays")) {
      if (!input.get("weekdays").isArray()) {
        throw ApiException.invalid("Weekdays must be a list of numbers (Monday = 1).");
      }
      var days = new TreeSet<Integer>();
      input
          .get("weekdays")
          .forEach(
              day -> {
                if (!day.isInt() || day.asInt() < 1 || day.asInt() > 7) {
                  throw ApiException.invalid("Choose weekdays from 1 to 7.");
                }
                days.add(day.asInt());
              });
      rule.weekdays = String.join(",", days.stream().map(String::valueOf).toList());
    }
    if (rule.frequency.equals("WEEKLY") && rule.weekdays.isBlank()) {
      rule.weekdays = String.valueOf(rule.startDate.getDayOfWeek().getValue());
    }
    if (input.has("active")) rule.active = bool(input, "active");
    return rules.save(rule);
  }

  public static boolean matches(RecurringRule rule, LocalDate date) {
    if (!rule.active
        || date.isBefore(rule.startDate)
        || (rule.endDate != null && date.isAfter(rule.endDate))) return false;
    return switch (rule.frequency) {
      case "DAILY" -> ChronoUnit.DAYS.between(rule.startDate, date) % rule.repeatInterval == 0;
      case "WEEKLY" -> {
        var firstWeek = rule.startDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        var thisWeek = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        yield ChronoUnit.WEEKS.between(firstWeek, thisWeek) % rule.repeatInterval == 0
            && Arrays.asList(rule.weekdays.split(","))
                .contains(String.valueOf(date.getDayOfWeek().getValue()));
      }
      case "MONTHLY" ->
          ChronoUnit.MONTHS.between(YearMonth.from(rule.startDate), YearMonth.from(date))
                      % rule.repeatInterval
                  == 0
              && date.getDayOfMonth()
                  == Math.min(rule.startDate.getDayOfMonth(), date.lengthOfMonth());
      default -> false;
    };
  }

  public record OccurrenceView(
      @JsonSerialize(using = ToStringSerializer.class) Long id,
      @JsonSerialize(using = ToStringSerializer.class) Long ruleId,
      @JsonSerialize(using = ToStringSerializer.class) Long taskId,
      LocalDate occurrenceDate,
      String title,
      String status,
      Instant completedAt) {}

  public List<OccurrenceView> occurrences(Long user, LocalDate from, LocalDate to) {
    if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) > 93) {
      throw ApiException.invalid("Choose a recurrence window of at most 93 days.");
    }
    users.lockById(user).orElseThrow(ApiException::missing);
    var result = new ArrayList<OccurrenceView>();
    for (var rule : rules.findAllByUserId(user)) {
      var task = tasks.owned(user, rule.taskId);
      for (LocalDate date = from; !date.isAfter(to); date = date.plusDays(1)) {
        if (!matches(rule, date)) continue;
        final LocalDate occurrenceDate = date;
        var occurrence =
            occurrences
                .findByRuleIdAndOccurrenceDate(rule.id, date)
                .orElseGet(
                    () -> {
                      var next = new Occurrence();
                      next.userId = user;
                      next.ruleId = rule.id;
                      next.occurrenceDate = occurrenceDate;
                      return occurrences.save(next);
                    });
        result.add(
            new OccurrenceView(
                occurrence.id,
                rule.id,
                rule.taskId,
                date,
                occurrence.titleOverride == null ? task.title : occurrence.titleOverride,
                occurrence.status,
                occurrence.completedAt));
      }
    }
    result.sort(Comparator.comparing(OccurrenceView::occurrenceDate));
    return result;
  }

  public Occurrence updateOccurrence(Long user, Long id, JsonNode input) {
    var occurrence = occurrences.findByIdAndUserId(id, user).orElseThrow(ApiException::missing);
    if (input.has("title")) occurrence.titleOverride = text(input, "title", 150);
    if (input.has("status")) {
      occurrence.status = choice(input, "status", "TODO", "IN_PROGRESS", "COMPLETED", "SKIPPED");
      occurrence.completedAt = occurrence.status.equals("COMPLETED") ? Instant.now() : null;
    }
    return occurrences.save(occurrence);
  }

  public void stop(Long user, Long id) {
    var rule = owned(user, id);
    rule.active = false;
    rules.save(rule);
  }

  private RecurringRule owned(Long user, Long id) {
    return rules.findByIdAndUserId(id, user).orElseThrow(ApiException::missing);
  }
}
