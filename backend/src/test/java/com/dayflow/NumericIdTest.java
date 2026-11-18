package com.dayflow;

import static org.junit.jupiter.api.Assertions.*;

import com.dayflow.common.ApiException;
import com.dayflow.common.Input;
import com.dayflow.task.Task;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class NumericIdTest {
  private final ObjectMapper json = new ObjectMapper().findAndRegisterModules();

  @Test
  void acceptsPositiveIdsAsStringsOrJsonIntegers() throws Exception {
    assertEquals(42L, Input.identifier(json.readTree("{\"id\":\"42\"}"), "id"));
    assertEquals(42L, Input.identifier(json.readTree("{\"id\":42}"), "id"));
    assertNull(Input.identifier(json.readTree("{\"id\":null}"), "id"));
    assertNull(Input.identifier(json.readTree("{}"), "id"));
  }

  @Test
  void rejectsInvalidAndOverflowingIds() throws Exception {
    for (String value : new String[] {"0", "-1", "1.5", "abc", "9223372036854775808"}) {
      var body = json.createObjectNode().put("id", value);
      assertThrows(ApiException.class, () -> Input.identifier(body, "id"));
    }
  }

  @Test
  void serializesBigintReferencesWithoutJavascriptPrecisionLoss() throws Exception {
    var task = new Task();
    task.id = 9007199254740993L;
    task.userId = 9007199254740994L;
    task.categoryId = 9007199254740995L;
    var result = json.readTree(json.writeValueAsString(task));
    assertTrue(result.get("id").isTextual());
    assertEquals("9007199254740993", result.get("id").asText());
    assertEquals("9007199254740994", result.get("userId").asText());
    assertEquals("9007199254740995", result.get("categoryId").asText());
    assertTrue(result.get("totalSubtasks").isNumber());
  }
}
