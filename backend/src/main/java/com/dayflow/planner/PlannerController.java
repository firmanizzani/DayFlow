package com.dayflow.planner;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/planning-sessions")
public class PlannerController {
  private final PlannerService service;

  public PlannerController(PlannerService service) {
    this.service = service;
  }

  @GetMapping
  List<PlanningSession> list(
      @AuthenticationPrincipal Jwt jwt, @RequestParam Instant from, @RequestParam Instant to) {
    return service.list(UUID.fromString(jwt.getSubject()), from, to);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  PlanningSession create(@AuthenticationPrincipal Jwt jwt, @RequestBody JsonNode input) {
    return service.save(UUID.fromString(jwt.getSubject()), null, input);
  }

  @PatchMapping("/{id}")
  PlanningSession update(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody JsonNode input) {
    return service.save(UUID.fromString(jwt.getSubject()), id, input);
  }

  @PostMapping("/{id}/reschedule")
  PlanningSession reschedule(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody JsonNode input) {
    return service.reschedule(UUID.fromString(jwt.getSubject()), id, input);
  }

  @PatchMapping("/{id}/status")
  PlanningSession status(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody JsonNode input) {
    return service.status(UUID.fromString(jwt.getSubject()), id, input);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void cancel(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
    service.cancel(UUID.fromString(jwt.getSubject()), id);
  }
}
