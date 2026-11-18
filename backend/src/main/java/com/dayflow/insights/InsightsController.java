package com.dayflow.insights;

import com.dayflow.focus.FocusService;
import com.dayflow.user.UserService;
import java.time.*;
import java.util.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class InsightsController {
  private final InsightsService service;
  private final FocusService focus;
  private final UserService users;

  public InsightsController(InsightsService service, FocusService focus, UserService users) {
    this.service = service;
    this.focus = focus;
    this.users = users;
  }

  @GetMapping("/health")
  Map<String, String> health() {
    return Map.of("status", "UP", "service", "dayflow-api");
  }

  @GetMapping("/dashboard/today")
  Map<String, Object> today(
      @AuthenticationPrincipal Jwt jwt, @RequestParam(required = false) LocalDate date) {
    var user = Long.valueOf(jwt.getSubject());
    return service.today(
        user, date == null ? LocalDate.now(ZoneId.of(users.get(user).timezone)) : date);
  }

  @GetMapping("/dashboard/unfinished")
  Map<String, Object> unfinished(@AuthenticationPrincipal Jwt jwt) {
    return service.unfinished(Long.valueOf(jwt.getSubject()));
  }

  @GetMapping("/insights/overview")
  InsightsService.Overview overview(
      @AuthenticationPrincipal Jwt jwt, @RequestParam Instant from, @RequestParam Instant to) {
    return service.overview(Long.valueOf(jwt.getSubject()), from, to);
  }

  @GetMapping("/insights/completion-trend")
  List<InsightsService.DayCount> trend(
      @AuthenticationPrincipal Jwt jwt, @RequestParam Instant from, @RequestParam Instant to) {
    return service.trend(Long.valueOf(jwt.getSubject()), from, to);
  }

  @GetMapping("/insights/categories")
  List<InsightsService.CategoryCount> categories(
      @AuthenticationPrincipal Jwt jwt, @RequestParam Instant from, @RequestParam Instant to) {
    return service.categories(Long.valueOf(jwt.getSubject()), from, to);
  }

  @GetMapping("/insights/focus")
  Map<String, Long> focus(
      @AuthenticationPrincipal Jwt jwt, @RequestParam Instant from, @RequestParam Instant to) {
    return focus.summary(Long.valueOf(jwt.getSubject()), from, to);
  }
}
