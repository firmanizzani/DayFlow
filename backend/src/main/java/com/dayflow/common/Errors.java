package com.dayflow.common;

import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class Errors {
  public record Error(String code, String message, Object details, String requestId) {}

  @ExceptionHandler(ApiException.class)
  ResponseEntity<Error> api(ApiException e) {
    return ResponseEntity.status(e.status)
        .body(new Error(e.code, e.getMessage(), e.details, UUID.randomUUID().toString()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<Error> validation(MethodArgumentNotValidException e) {
    var fields = new LinkedHashMap<String, String>();
    e.getBindingResult()
        .getFieldErrors()
        .forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
    return ResponseEntity.badRequest()
        .body(
            new Error(
                "VALIDATION_ERROR",
                "Please check the highlighted fields.",
                fields,
                UUID.randomUUID().toString()));
  }

  @ExceptionHandler({
    IllegalArgumentException.class,
    java.time.DateTimeException.class,
    ClassCastException.class,
    org.springframework.http.converter.HttpMessageNotReadableException.class,
    org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class
  })
  ResponseEntity<Error> bad(Exception e) {
    return ResponseEntity.badRequest()
        .body(
            new Error(
                "BAD_REQUEST", "Invalid request format.", null, UUID.randomUUID().toString()));
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<Error> conflict(Exception e) {
    return ResponseEntity.status(409)
        .body(
            new Error(
                "CONFLICT",
                "This value already exists or conflicts with related data.",
                null,
                UUID.randomUUID().toString()));
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<Error> unknown(Exception e) {
    return ResponseEntity.internalServerError()
        .body(
            new Error(
                "SERVER_ERROR",
                "The request could not be completed. Please try again.",
                null,
                UUID.randomUUID().toString()));
  }
}
