package com.dayflow.task;

import static com.dayflow.common.Input.*;

import com.dayflow.category.*;
import com.dayflow.common.*;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.*;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TaskService {
  private final TaskRepository tasks;
  private final CategoryRepository categories;
  private final SubtaskRepository subtasks;

  public TaskService(
      TaskRepository tasks, CategoryRepository categories, SubtaskRepository subtasks) {
    this.tasks = tasks;
    this.categories = categories;
    this.subtasks = subtasks;
  }

  public Task owned(Long user, Long id) {
    return tasks.findByIdAndUserId(id, user).orElseThrow(ApiException::missing);
  }

  public Page<Task> list(
      Long user,
      String status,
      Long category,
      String priority,
      String search,
      Instant dueBefore,
      int page,
      int size,
      String sort) {
    Specification<Task> spec = (r, q, b) -> b.equal(r.get("userId"), user);
    if (status != null) spec = spec.and((r, q, b) -> b.equal(r.get("status"), status));
    if (category != null) spec = spec.and((r, q, b) -> b.equal(r.get("categoryId"), category));
    if (priority != null) spec = spec.and((r, q, b) -> b.equal(r.get("priority"), priority));
    if (search != null && !search.isBlank()) {
      String escaped =
          search
              .toLowerCase(Locale.ROOT)
              .replace("\\", "\\\\")
              .replace("%", "\\%")
              .replace("_", "\\_");
      spec = spec.and((r, q, b) -> b.like(b.lower(r.get("title")), "%" + escaped + "%", '\\'));
    }
    if (dueBefore != null) spec = spec.and((r, q, b) -> b.lessThan(r.get("dueAt"), dueBefore));
    String field =
        List.of("createdAt", "dueAt", "title", "priority").contains(sort) ? sort : "createdAt";
    var result =
        tasks.findAll(
            spec,
            PageRequest.of(
                Math.max(0, page),
                Math.max(1, Math.min(100, size)),
                Sort.by(field.equals("createdAt") ? Sort.Direction.DESC : Sort.Direction.ASC, field)
                    .and(Sort.by("id"))));
    withProgress(user, result.getContent());
    return result;
  }

  public List<Task> withProgress(Long user, List<Task> items) {
    if (items.isEmpty()) return items;
    var counts = subtasks.countForTasks(user, items.stream().map(t -> t.id).toList());
    for (var task : items) {
      counts.stream()
          .filter(count -> count.taskId().equals(task.id))
          .findFirst()
          .ifPresent(
              count -> {
                task.totalSubtasks = count.total();
                task.completedSubtasks = count.completed();
              });
    }
    return items;
  }

  public Task save(Long user, Long id, JsonNode n) {
    var t = id == null ? new Task() : owned(user, id);
    t.userId = user;
    if (id == null || n.has("title")) t.title = text(n, "title", 150);
    if (n.has("description")) {
      if (n.hasNonNull("description")
          && (!n.get("description").isTextual() || n.get("description").asText().length() > 10000))
        throw ApiException.invalid("Description must be at most 10000 characters.");
      t.description = n.hasNonNull("description") ? n.get("description").asText() : null;
    }
    if (n.has("categoryId")) {
      t.categoryId = identifier(n, "categoryId");
      if (t.categoryId != null)
        categories.findByIdAndUserId(t.categoryId, user).orElseThrow(ApiException::missing);
    }
    if (n.has("priority")) t.priority = choice(n, "priority", "LOW", "MEDIUM", "HIGH");
    if (n.has("dueAt")) t.dueAt = instant(n, "dueAt");
    if (n.has("status")) {
      t.status = choice(n, "status", "TODO", "IN_PROGRESS", "COMPLETED");
      t.completedAt =
          t.status.equals("COMPLETED")
              ? (t.completedAt == null ? Instant.now() : t.completedAt)
              : null;
    }
    return tasks.save(t);
  }

  public void delete(Long user, Long id) {
    tasks.delete(owned(user, id));
  }

  public List<Subtask> subtasks(Long user, Long task) {
    owned(user, task);
    return subtasks.findAllByUserId(user).stream()
        .filter(s -> s.taskId.equals(task))
        .sorted(Comparator.comparingInt(s -> s.sortOrder))
        .toList();
  }

  public Subtask saveSubtask(Long user, Long taskId, Long id, JsonNode n) {
    var s =
        id == null
            ? new Subtask()
            : subtasks.findByIdAndUserId(id, user).orElseThrow(ApiException::missing);
    if (id == null) {
      owned(user, taskId);
      s.userId = user;
      s.taskId = taskId;
    }
    if (id == null || n.has("title")) s.title = text(n, "title", 150);
    if (n.has("isCompleted")) s.isCompleted = bool(n, "isCompleted");
    if (n.has("sortOrder")) s.sortOrder = number(n, "sortOrder", 0, 10000);
    return subtasks.save(s);
  }

  public void deleteSubtask(Long user, Long id) {
    subtasks.delete(subtasks.findByIdAndUserId(id, user).orElseThrow(ApiException::missing));
  }
}
