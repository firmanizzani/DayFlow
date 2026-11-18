package com.dayflow.insights;

import com.dayflow.category.CategoryRepository;
import com.dayflow.focus.FocusService;
import com.dayflow.planner.*;
import com.dayflow.task.*;
import com.dayflow.user.UserService;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class InsightsService {
  private final TaskRepository tasks;
  private final PlanningSessionRepository sessions;
  private final CategoryRepository categories;
  private final FocusService focus;
  private final UserService users;

  public InsightsService(
      TaskRepository tasks,
      PlanningSessionRepository sessions,
      CategoryRepository categories,
      FocusService focus,
      UserService users) {
    this.tasks = tasks;
    this.sessions = sessions;
    this.categories = categories;
    this.focus = focus;
    this.users = users;
  }

  public record Overview(
      long completedTasks,
      long plannedTasks,
      long completedPlannedTasks,
      long totalFocusSeconds,
      int completionRate) {}

  public Overview overview(Long user, Instant from, Instant to) {
    PlannerService.validateRange(from, to);
    var all = tasks.findAllByUserId(user);
    Set<Long> planned =
        sessions.findAllByUserId(user).stream()
            .filter(s -> !s.status.equals("CANCELLED") && !s.status.equals("RESCHEDULED"))
            .filter(s -> !s.startAt.isBefore(from) && s.startAt.isBefore(to))
            .map(s -> s.taskId)
            .collect(Collectors.toSet());
    long completed = all.stream().filter(t -> completedIn(t, from, to)).count();
    long completedPlanned =
        all.stream().filter(t -> planned.contains(t.id) && t.status.equals("COMPLETED")).count();
    return new Overview(
        completed,
        planned.size(),
        completedPlanned,
        focus.summary(user, from, to).get("totalSeconds"),
        planned.isEmpty() ? 0 : (int) Math.round(completedPlanned * 100.0 / planned.size()));
  }

  private static boolean completedIn(Task task, Instant from, Instant to) {
    return task.completedAt != null
        && !task.completedAt.isBefore(from)
        && task.completedAt.isBefore(to);
  }

  public record DayCount(LocalDate date, long completedTasks) {}

  public List<DayCount> trend(Long user, Instant from, Instant to) {
    PlannerService.validateRange(from, to);
    var zone = ZoneId.of(users.get(user).timezone);
    var all = tasks.findAllByUserId(user);
    var result = new ArrayList<DayCount>();
    LocalDate last = to.minusNanos(1).atZone(zone).toLocalDate();
    for (LocalDate day = from.atZone(zone).toLocalDate();
        !day.isAfter(last);
        day = day.plusDays(1)) {
      final LocalDate selected = day;
      result.add(
          new DayCount(
              day,
              all.stream()
                  .filter(t -> completedIn(t, from, to))
                  .filter(t -> t.completedAt.atZone(zone).toLocalDate().equals(selected))
                  .count()));
    }
    return result;
  }

  public record CategoryCount(String name, String color, long completedTasks) {}

  public List<CategoryCount> categories(Long user, Instant from, Instant to) {
    PlannerService.validateRange(from, to);
    var completed =
        tasks.findAllByUserId(user).stream().filter(t -> completedIn(t, from, to)).toList();
    var result = new ArrayList<CategoryCount>();
    for (var category : categories.findAllByUserId(user)) {
      result.add(
          new CategoryCount(
              category.name,
              category.color,
              completed.stream().filter(t -> category.id.equals(t.categoryId)).count()));
    }
    result.add(
        new CategoryCount(
            "Uncategorized",
            "#85879A",
            completed.stream().filter(t -> t.categoryId == null).count()));
    return result;
  }

  public Map<String, Object> today(Long user, LocalDate date) {
    var zone = ZoneId.of(users.get(user).timezone);
    var from = date.atStartOfDay(zone).toInstant();
    var to = date.plusDays(1).atStartOfDay(zone).toInstant();
    var planned =
        sessions.findAllByUserId(user).stream()
            .filter(s -> s.startAt.isBefore(to) && s.endAt.isAfter(from))
            .filter(s -> s.status.equals("PLANNED") || s.status.equals("COMPLETED"))
            .sorted(Comparator.comparing(s -> s.startAt))
            .toList();
    var all = tasks.findAllByUserId(user);
    var plannedIds = planned.stream().map(s -> s.taskId).collect(Collectors.toSet());
    return Map.of(
        "date",
        date,
        "overview",
        overview(user, from, to),
        "sessions",
        planned,
        "unscheduledTasks",
        all.stream()
            .filter(t -> !t.status.equals("COMPLETED") && !plannedIds.contains(t.id))
            .toList());
  }

  public Map<String, Object> unfinished(Long user) {
    var now = Instant.now();
    return Map.of(
        "overdueTasks",
            tasks.findAllByUserId(user).stream()
                .filter(
                    t -> !t.status.equals("COMPLETED") && t.dueAt != null && t.dueAt.isBefore(now))
                .toList(),
        "missedSessions",
            sessions.findAllByUserId(user).stream()
                .filter(s -> s.status.equals("PLANNED") && s.endAt.isBefore(now))
                .toList());
  }
}
