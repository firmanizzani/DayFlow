package com.dayflow.focus;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.Instant;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/focus-sessions")
public class FocusController {
  private final FocusService service;

  public FocusController(FocusService service) {
    this.service = service;
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  FocusSession save(@AuthenticationPrincipal Jwt jwt, @RequestBody JsonNode input) {
    return service.save(Long.valueOf(jwt.getSubject()), input);
  }

  @GetMapping
  List<FocusSession> list(
      @AuthenticationPrincipal Jwt jwt, @RequestParam Instant from, @RequestParam Instant to) {
    return service.list(Long.valueOf(jwt.getSubject()), from, to);
  }

  @GetMapping("/summary")
  Map<String, Long> summary(
      @AuthenticationPrincipal Jwt jwt, @RequestParam Instant from, @RequestParam Instant to) {
    return service.summary(Long.valueOf(jwt.getSubject()), from, to);
  }
}
