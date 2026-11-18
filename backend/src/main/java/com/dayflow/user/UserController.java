package com.dayflow.user;

import com.dayflow.auth.AuthService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users/me")
public class UserController {
  private final UserService service;
  private final AuthService auth;

  public UserController(UserService service, AuthService auth) {
    this.service = service;
    this.auth = auth;
  }

  @GetMapping
  User profile(@AuthenticationPrincipal Jwt jwt) {
    return service.get(Long.valueOf(jwt.getSubject()));
  }

  @PatchMapping
  User update(@AuthenticationPrincipal Jwt jwt, @RequestBody JsonNode input) {
    return service.update(Long.valueOf(jwt.getSubject()), input);
  }

  @DeleteMapping
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void delete(@AuthenticationPrincipal Jwt jwt) {
    service.delete(Long.valueOf(jwt.getSubject()));
  }

  @GetMapping("/preferences")
  Preferences preferences(@AuthenticationPrincipal Jwt jwt) {
    return service.preferences(Long.valueOf(jwt.getSubject()));
  }

  @PatchMapping("/preferences")
  Preferences updatePreferences(@AuthenticationPrincipal Jwt jwt, @RequestBody JsonNode input) {
    return service.updatePreferences(Long.valueOf(jwt.getSubject()), input);
  }

  public record Password(
      @NotBlank String currentPassword, @NotBlank @Size(min = 8, max = 72) String newPassword) {}

  @PostMapping("/password")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void password(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody Password input) {
    auth.changePassword(Long.valueOf(jwt.getSubject()), input.currentPassword, input.newPassword);
  }
}
