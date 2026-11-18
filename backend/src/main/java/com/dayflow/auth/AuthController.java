package com.dayflow.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
  private final AuthService auth;

  public AuthController(AuthService auth) {
    this.auth = auth;
  }

  public record Register(
      @NotBlank @Size(max = 100) String name,
      @NotBlank @Email @Size(max = 255) String email,
      @NotBlank @Size(min = 8, max = 72) String password,
      @NotBlank String timezone) {}

  public record Login(@NotBlank @Email String email, @NotBlank String password) {}

  public record Token(@NotBlank String refreshToken) {}

  public record ResetEmail(@NotBlank @jakarta.validation.constraints.Email String email) {}

  public record Reset(@NotBlank String token, @NotBlank @Size(min = 8, max = 72) String password) {}

  @PostMapping("/register")
  @ResponseStatus(HttpStatus.CREATED)
  AuthService.Session register(@Valid @RequestBody Register r) {
    return auth.register(r.name, r.email, r.password, r.timezone);
  }

  @PostMapping("/login")
  AuthService.Session login(@Valid @RequestBody Login r) {
    return auth.login(r.email, r.password);
  }

  @PostMapping("/refresh")
  AuthService.Session refresh(@Valid @RequestBody Token r) {
    return auth.rotate(r.refreshToken);
  }

  @PostMapping("/logout")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void logout(@Valid @RequestBody Token r) {
    auth.logout(r.refreshToken);
  }

  @PostMapping("/forgot-password")
  java.util.Map<String, String> forgot(@Valid @RequestBody ResetEmail r) {
    auth.forgot(r.email);
    return java.util.Map.of("message", "If the account exists, a reset email will be sent.");
  }

  @PostMapping("/reset-password")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void reset(@Valid @RequestBody Reset r) {
    auth.reset(r.token, r.password);
  }
}
