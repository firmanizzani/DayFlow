package com.dayflow.task;

import com.dayflow.common.PageResponse;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class TaskController {
  private final TaskService service;

  public TaskController(TaskService service) {
    this.service = service;
  }

  private UUID user(Jwt j) {
    return UUID.fromString(j.getSubject());
  }

  @GetMapping("/tasks")
  PageResponse<Task> list(
      @AuthenticationPrincipal Jwt j,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) UUID categoryId,
      @RequestParam(required = false) String priority,
      @RequestParam(required = false) String search,
      @RequestParam(required = false) Instant dueBefore,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "30") int size,
      @RequestParam(defaultValue = "createdAt") String sort) {
    return PageResponse.from(
        service.list(user(j), status, categoryId, priority, search, dueBefore, page, size, sort));
  }

  @PostMapping("/tasks")
  @ResponseStatus(HttpStatus.CREATED)
  Task create(@AuthenticationPrincipal Jwt j, @RequestBody JsonNode n) {
    return service.save(user(j), null, n);
  }

  @GetMapping("/tasks/{id}")
  Task get(@AuthenticationPrincipal Jwt j, @PathVariable UUID id) {
    return service.owned(user(j), id);
  }

  @PatchMapping({"/tasks/{id}", "/tasks/{id}/status"})
  Task update(@AuthenticationPrincipal Jwt j, @PathVariable UUID id, @RequestBody JsonNode n) {
    return service.save(user(j), id, n);
  }

  @DeleteMapping("/tasks/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void delete(@AuthenticationPrincipal Jwt j, @PathVariable UUID id) {
    service.delete(user(j), id);
  }

  @GetMapping("/tasks/{id}/subtasks")
  List<Subtask> subtasks(@AuthenticationPrincipal Jwt j, @PathVariable UUID id) {
    return service.subtasks(user(j), id);
  }

  @PostMapping("/tasks/{id}/subtasks")
  @ResponseStatus(HttpStatus.CREATED)
  Subtask add(@AuthenticationPrincipal Jwt j, @PathVariable UUID id, @RequestBody JsonNode n) {
    return service.saveSubtask(user(j), id, null, n);
  }

  @PatchMapping("/subtasks/{id}")
  Subtask sub(@AuthenticationPrincipal Jwt j, @PathVariable UUID id, @RequestBody JsonNode n) {
    return service.saveSubtask(user(j), null, id, n);
  }

  @DeleteMapping("/subtasks/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void delSub(@AuthenticationPrincipal Jwt j, @PathVariable UUID id) {
    service.deleteSubtask(user(j), id);
  }
}
