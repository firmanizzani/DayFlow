package com.dayflow.auth;

import com.dayflow.common.*;
import com.dayflow.user.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {
  private final UserRepository users;
  private final PreferencesRepository preferences;
  private final RefreshTokenRepository refresh;
  private final PasswordResetRepository resets;
  private final PasswordEncoder passwords;
  private final JwtEncoder encoder;
  private final JavaMailSender mail;

  @Value("${app.mail-from}")
  String mailFrom;

  @Value("${app.reset-url}")
  String resetUrl;

  public AuthService(
      UserRepository users,
      PreferencesRepository preferences,
      RefreshTokenRepository refresh,
      PasswordResetRepository resets,
      PasswordEncoder passwords,
      JwtEncoder encoder,
      JavaMailSender mail) {
    this.users = users;
    this.preferences = preferences;
    this.refresh = refresh;
    this.resets = resets;
    this.passwords = passwords;
    this.encoder = encoder;
    this.mail = mail;
  }

  public record Session(String accessToken, String refreshToken, User user) {}

  public Session register(String name, String email, String password, String timezone) {
    validatePassword(password);
    if (users.findByEmailIgnoreCase(email.trim()).isPresent())
      throw new ApiException(
          HttpStatus.CONFLICT, "EMAIL_EXISTS", "This email is already registered.");
    ZoneId.of(timezone);
    var u = new User();
    u.name = name.trim();
    u.email = email.trim().toLowerCase(Locale.ROOT);
    u.passwordHash = passwords.encode(password);
    u.timezone = timezone;
    users.save(u);
    var p = new Preferences();
    p.userId = u.id;
    preferences.save(p);
    return session(u);
  }

  public Session login(String email, String password) {
    var u = users.findByEmailIgnoreCase(email.trim()).orElseThrow(this::unauthorized);
    if (!passwords.matches(password, u.passwordHash)) throw unauthorized();
    return session(u);
  }

  public Session rotate(String token) {
    var old = refresh.findByTokenHash(hash(token)).orElseThrow(this::unauthorized);
    if (old.revokedAt != null || old.expiresAt.isBefore(Instant.now())) throw unauthorized();
    old.revokedAt = Instant.now();
    refresh.save(old);
    return session(users.findById(old.userId).orElseThrow(this::unauthorized));
  }

  public void logout(String token) {
    refresh
        .findByTokenHash(hash(token))
        .ifPresent(
            t -> {
              t.revokedAt = Instant.now();
              refresh.save(t);
            });
  }

  private Session session(User user) {
    var now = Instant.now();
    var claims =
        JwtClaimsSet.builder()
            .issuer("dayflow")
            .subject(user.id.toString())
            .issuedAt(now)
            .expiresAt(now.plusSeconds(900))
            .build();
    var access =
        encoder
            .encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
            .getTokenValue();
    String raw = randomToken();
    var t = new RefreshToken();
    t.userId = user.id;
    t.tokenHash = hash(raw);
    t.expiresAt = now.plus(Duration.ofDays(30));
    refresh.save(t);
    return new Session(access, raw, user);
  }

  public void forgot(String email) {
    users
        .findByEmailIgnoreCase(email.trim())
        .ifPresent(
            u -> {
              String raw = randomToken();
              var t = new PasswordReset();
              t.userId = u.id;
              t.tokenHash = hash(raw);
              t.expiresAt = Instant.now().plusSeconds(1800);
              resets.save(t);
              var message = new SimpleMailMessage();
              message.setFrom(mailFrom);
              message.setTo(u.email);
              message.setSubject("Reset your Dayflow password");
              message.setText("Open this link within 30 minutes: " + resetUrl + "?token=" + raw);
              try {
                mail.send(message);
              } catch (MailException e) {
                throw new ApiException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "MAIL_UNAVAILABLE",
                    "Password reset email is unavailable. Please try again later.");
              }
            });
  }

  public void reset(String token, String password) {
    validatePassword(password);
    var t =
        resets
            .findByTokenHash(hash(token))
            .orElseThrow(() -> ApiException.invalid("This reset link is invalid or expired."));
    if (t.usedAt != null || t.expiresAt.isBefore(Instant.now()))
      throw ApiException.invalid("This reset link is invalid or expired.");
    var u = users.findById(t.userId).orElseThrow(this::unauthorized);
    u.passwordHash = passwords.encode(password);
    users.save(u);
    t.usedAt = Instant.now();
    resets.save(t);
    refresh
        .findByUserId(u.id)
        .forEach(
            r -> {
              r.revokedAt = Instant.now();
              refresh.save(r);
            });
  }

  public void changePassword(UUID id, String current, String next) {
    validatePassword(next);
    var u = users.findById(id).orElseThrow(this::unauthorized);
    if (!passwords.matches(current, u.passwordHash)) throw unauthorized();
    u.passwordHash = passwords.encode(next);
    users.save(u);
    refresh
        .findByUserId(id)
        .forEach(
            t -> {
              t.revokedAt = Instant.now();
              refresh.save(t);
            });
  }

  private void validatePassword(String password) {
    if (password.getBytes(StandardCharsets.UTF_8).length > 72) {
      throw ApiException.invalid("Password must be at most 72 UTF-8 bytes.");
    }
  }

  private ApiException unauthorized() {
    return new ApiException(
        HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Email, password or session is invalid.");
  }

  public static String hash(String value) {
    try {
      return HexFormat.of()
          .formatHex(
              MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException(e);
    }
  }

  private static String randomToken() {
    byte[] bytes = new byte[48];
    new SecureRandom().nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}
