package com.dayflow;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.dayflow.common.ApiException;
import com.dayflow.focus.*;
import com.dayflow.task.TaskService;
import com.dayflow.user.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class FocusServiceTest {
  private final FocusSessionRepository repository = mock(FocusSessionRepository.class);
  private final TaskService tasks = mock(TaskService.class);
  private final UserRepository users = mock(UserRepository.class);
  private final UUID userId = UUID.randomUUID();
  private final ObjectMapper json = new ObjectMapper();
  private FocusService service;

  @BeforeEach
  void setup() {
    when(users.lockById(userId)).thenReturn(Optional.of(new User()));
    service = new FocusService(repository, tasks, users);
  }

  @Test
  void retryReturnsExistingSessionWithoutDoubleCounting() throws Exception {
    var id = UUID.randomUUID();
    var existing = new FocusSession();
    existing.clientId = id;
    when(repository.findByUserIdAndClientId(userId, id)).thenReturn(Optional.of(existing));
    assertSame(existing, service.save(userId, json.readTree("{\"clientId\":\"" + id + "\"}")));
    verify(repository, never()).save(any());
  }

  @Test
  void recordedTimeCannotExceedElapsedWallTime() throws Exception {
    var payload = json.createObjectNode();
    payload.put("clientId", UUID.randomUUID().toString());
    payload.put("mode", "FOCUS");
    payload.put("startedAt", "2026-11-18T01:00:00Z");
    payload.put("endedAt", "2026-11-18T01:01:00Z");
    payload.put("durationSeconds", 120);
    payload.put("completed", true);
    assertThrows(ApiException.class, () -> service.save(userId, payload));
    verify(repository, never()).save(any());
  }
}
