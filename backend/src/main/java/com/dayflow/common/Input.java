package com.dayflow.common;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.*;
import java.util.*;

public final class Input {
  private Input() {}

  public static String text(JsonNode n, String key, int max) {
    var v = n.get(key);
    if (v == null || !v.isTextual() || v.asText().isBlank() || v.asText().trim().length() > max)
      throw ApiException.invalid(key + " is required (maximum " + max + " characters).");
    return v.asText().trim();
  }

  public static String choice(JsonNode n, String key, String... allowed) {
    String v = text(n, key, 30);
    if (!List.of(allowed).contains(v)) throw ApiException.invalid("Invalid " + key + ".");
    return v;
  }

  public static Long identifier(JsonNode n, String key) {
    if (!n.hasNonNull(key)) return null;
    String value = n.get(key).asText();
    if (!value.matches("[1-9][0-9]*"))
      throw ApiException.invalid(key + " must be a positive numeric ID.");
    try {
      return Long.valueOf(value);
    } catch (NumberFormatException e) {
      throw ApiException.invalid(key + " is out of range.");
    }
  }

  public static UUID uuid(JsonNode n, String key) {
    return n.hasNonNull(key) ? UUID.fromString(n.get(key).asText()) : null;
  }

  public static Instant instant(JsonNode n, String key) {
    return n.hasNonNull(key) ? Instant.parse(n.get(key).asText()) : null;
  }

  public static int number(JsonNode n, String key, int min, int max) {
    if (!n.has(key) || !n.get(key).isIntegralNumber())
      throw ApiException.invalid(key + " must be an integer.");
    int v = n.get(key).asInt();
    if (v < min || v > max) throw ApiException.invalid(key + " is out of range.");
    return v;
  }

  public static boolean bool(JsonNode n, String key) {
    if (!n.has(key) || !n.get(key).isBoolean())
      throw ApiException.invalid(key + " must be true or false.");
    return n.get(key).asBoolean();
  }
}
