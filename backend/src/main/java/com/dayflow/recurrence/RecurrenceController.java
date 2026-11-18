package com.dayflow.recurrence;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.LocalDate;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class RecurrenceController {
  private final RecurrenceService service;

  public RecurrenceController(RecurrenceService service) {
    this.service = service;
  }

  @GetMapping("/recurring-rules")
  List<RecurringRule> list(@AuthenticationPrincipal Jwt jwt) {
    return service.list(UUID.fromString(jwt.getSubject()));
  }

  @PostMapping("/recurring-rules")
  @ResponseStatus(HttpStatus.CREATED)
  RecurringRule create(@AuthenticationPrincipal Jwt jwt, @RequestBody JsonNode input) {
    return service.save(UUID.fromString(jwt.getSubject()), null, input);
  }

  @PatchMapping("/recurring-rules/{id}")
  RecurringRule update(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody JsonNode input) {
    return service.save(UUID.fromString(jwt.getSubject()), id, input);
  }

  @DeleteMapping("/recurring-rules/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void stop(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
    service.stop(UUID.fromString(jwt.getSubject()), id);
  }

  @GetMapping("/recurring-occurrences")
  List<RecurrenceService.OccurrenceView> occurrences(
      @AuthenticationPrincipal Jwt jwt, @RequestParam LocalDate from, @RequestParam LocalDate to) {
    return service.occurrences(UUID.fromString(jwt.getSubject()), from, to);
  }

  @PatchMapping("/recurring-occurrences/{id}")
  Occurrence occurrence(
      @AuthenticationPrincipal Jwt jwt, @PathVariable UUID id, @RequestBody JsonNode input) {
    return service.updateOccurrence(UUID.fromString(jwt.getSubject()), id, input);
  }
}
