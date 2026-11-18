package com.dayflow;

import static org.junit.jupiter.api.Assertions.*;

import com.dayflow.planner.PlannerService;
import com.dayflow.recurrence.*;
import java.time.*;
import org.junit.jupiter.api.Test;

class DomainRulesTest {
  @Test
  void adjacentTimeBlocksDoNotConflict() {
    var start = Instant.parse("2026-11-18T09:00:00Z");
    var end = start.plusSeconds(3600);
    assertFalse(PlannerService.overlaps(start, end, end, end.plusSeconds(3600)));
    assertTrue(PlannerService.overlaps(start, end, start.plusSeconds(1800), end.plusSeconds(1800)));
  }

  @Test
  void monthlyRecurrenceClampsToLastDayAndRespectsInterval() {
    var rule = rule("MONTHLY", "2026-01-31", 1);
    assertTrue(RecurrenceService.matches(rule, LocalDate.parse("2026-02-28")));
    assertFalse(RecurrenceService.matches(rule, LocalDate.parse("2026-03-28")));
    assertTrue(RecurrenceService.matches(rule, LocalDate.parse("2026-03-31")));
    rule.repeatInterval = 2;
    assertFalse(RecurrenceService.matches(rule, LocalDate.parse("2026-02-28")));
  }

  @Test
  void weeklyRecurrenceUsesCalendarWeeksAndSelectedWeekdays() {
    var rule = rule("WEEKLY", "2026-11-18", 2);
    rule.weekdays = "1,3,5";
    assertTrue(RecurrenceService.matches(rule, LocalDate.parse("2026-11-20")));
    assertFalse(RecurrenceService.matches(rule, LocalDate.parse("2026-11-23")));
    assertTrue(RecurrenceService.matches(rule, LocalDate.parse("2026-11-30")));
    assertFalse(RecurrenceService.matches(rule, LocalDate.parse("2026-11-16")));
  }

  @Test
  void recurrenceStopsAtEndDateAndWhenDisabled() {
    var rule = rule("DAILY", "2026-11-18", 1);
    rule.endDate = LocalDate.parse("2026-11-20");
    assertTrue(RecurrenceService.matches(rule, rule.endDate));
    assertFalse(RecurrenceService.matches(rule, rule.endDate.plusDays(1)));
    rule.active = false;
    assertFalse(RecurrenceService.matches(rule, rule.startDate));
  }

  @Test
  void daylightSavingDaysAreNotAssumedToBe24Hours() {
    var date = LocalDate.parse("2026-03-08");
    var zone = ZoneId.of("America/New_York");
    long hours =
        Duration.between(date.atStartOfDay(zone), date.plusDays(1).atStartOfDay(zone)).toHours();
    assertEquals(23, hours);
  }

  private RecurringRule rule(String frequency, String start, int interval) {
    var rule = new RecurringRule();
    rule.frequency = frequency;
    rule.startDate = LocalDate.parse(start);
    rule.repeatInterval = interval;
    return rule;
  }
}
