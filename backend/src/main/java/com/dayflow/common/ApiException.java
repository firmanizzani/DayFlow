package com.dayflow.common;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
  public final HttpStatus status;
  public final String code;
  public final Object details;

  public ApiException(HttpStatus status, String code, String message) {
    this(status, code, message, null);
  }

  public ApiException(HttpStatus status, String code, String message, Object details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  public static ApiException missing() {
    return new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Resource not found.");
  }

  public static ApiException invalid(String message) {
    return new ApiException(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", message);
  }
}
