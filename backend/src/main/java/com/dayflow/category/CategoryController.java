package com.dayflow.category;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {
  private final CategoryService service;

  public CategoryController(CategoryService service) {
    this.service = service;
  }

  @GetMapping
  List<Category> list(@AuthenticationPrincipal Jwt j) {
    return service.list(UUID.fromString(j.getSubject()));
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  Category add(@AuthenticationPrincipal Jwt j, @RequestBody JsonNode n) {
    return service.save(UUID.fromString(j.getSubject()), null, n);
  }

  @PatchMapping("/{id}")
  Category update(@AuthenticationPrincipal Jwt j, @PathVariable UUID id, @RequestBody JsonNode n) {
    return service.save(UUID.fromString(j.getSubject()), id, n);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void delete(@AuthenticationPrincipal Jwt j, @PathVariable UUID id) {
    service.delete(UUID.fromString(j.getSubject()), id);
  }
}
