package com.dayflow;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.dayflow.auth.*;
import com.dayflow.common.ApiException;
import com.dayflow.user.*;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.*;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.test.util.ReflectionTestUtils;

class PasswordResetTest {
  private final UserRepository users = mock(UserRepository.class);
  private final PreferencesRepository preferences = mock(PreferencesRepository.class);
  private final RefreshTokenRepository refresh = mock(RefreshTokenRepository.class);
  private final PasswordResetRepository resets = mock(PasswordResetRepository.class);
  private final PasswordEncoder passwords = mock(PasswordEncoder.class);
  private final JavaMailSender mail = mock(JavaMailSender.class);
  private AuthService auth;
  private User user;

  @BeforeEach
  void setup() {
    auth = new AuthService(users, preferences, refresh, resets, passwords, mock(JwtEncoder.class), mail);
    ReflectionTestUtils.setField(auth, "mailFrom", "noreply@dayflow.example");
    ReflectionTestUtils.setField(auth, "resetUrl", "dayflow://reset-password");
    user = new User();
    user.id = 1L;
    user.email = "reset-test@dayflow.example";
    when(users.findByEmailIgnoreCase(user.email)).thenReturn(Optional.of(user));
    when(users.findById(user.id)).thenReturn(Optional.of(user));
  }

  @Test
  void resetEmailContainsRawTokenButDatabaseOnlyReceivesHashWithThirtyMinuteExpiry() {
    var before = Instant.now();
    auth.forgot(user.email);
    var stored = ArgumentCaptor.forClass(PasswordReset.class);
    var sent = ArgumentCaptor.forClass(SimpleMailMessage.class);
    verify(resets).save(stored.capture());
    verify(mail).send(sent.capture());
    String raw = Objects.requireNonNull(sent.getValue().getText()).split("\\?token=", 2)[1];
    assertEquals(AuthService.hash(raw), stored.getValue().tokenHash);
    assertNotEquals(raw, stored.getValue().tokenHash);
    assertEquals(user.id, stored.getValue().userId);
    assertTrue(stored.getValue().expiresAt.isAfter(before.plusSeconds(1799)));
    assertTrue(stored.getValue().expiresAt.isBefore(Instant.now().plusSeconds(1801)));
    assertEquals(user.email, sent.getValue().getTo()[0]);
  }

  @Test
  void validResetChangesHashConsumesTokenAndRevokesEveryRefreshSession() {
    var token = validToken();
    var first = new RefreshToken();
    var second = new RefreshToken();
    when(refresh.findByUserId(user.id)).thenReturn(List.of(first, second));
    when(passwords.encode("New-password123")).thenReturn("new-hash");
    auth.reset("raw-token", "New-password123");
    assertEquals("new-hash", user.passwordHash);
    assertNotNull(token.usedAt);
    assertNotNull(first.revokedAt);
    assertNotNull(second.revokedAt);
    verify(users).save(user);
    assertThrows(ApiException.class, () -> auth.reset("raw-token", "Another-password123"));
    verify(users, times(1)).save(user);
  }

  @Test
  void expiredTokenCannotChangePassword() {
    var token = validToken();
    token.expiresAt = Instant.now().minusSeconds(1);
    assertThrows(ApiException.class, () -> auth.reset("raw-token", "New-password123"));
    verify(users, never()).save(any());
  }

  @Test
  void nonexistentEmailDoesNotSendMailOrStoreResetToken() {
    auth.forgot("missing@dayflow.example");
    verifyNoInteractions(mail, resets);
  }

  @Test
  void smtpFailureReturnsControlledApiError() {
    doThrow(new MailSendException("Test SMTP unavailable"))
        .when(mail).send(any(SimpleMailMessage.class));
    var error = assertThrows(ApiException.class, () -> auth.forgot(user.email));
    assertEquals("MAIL_UNAVAILABLE", error.code);
    assertEquals(503, error.status.value());
  }

  private PasswordReset validToken() {
    var token = new PasswordReset();
    token.userId = user.id;
    token.tokenHash = AuthService.hash("raw-token");
    token.expiresAt = Instant.now().plusSeconds(1800);
    when(resets.findByTokenHash(token.tokenHash)).thenReturn(Optional.of(token));
    return token;
  }
}
