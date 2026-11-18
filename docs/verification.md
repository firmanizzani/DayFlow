# Verification baseline — 18 November 2026

## Checks actually run

- Spring Boot compiled and packaged using Java 25 with Java 21 target compatibility.
- Neon PostgreSQL connection succeeded and Flyway migration V1 was applied; Hibernate schema validation succeeded.
- JUnit/Mockito: 7 tests passed, covering adjacent/overlapping plans, daily/weekly/monthly recurrence, end dates, daylight saving, idempotent focus retries, and elapsed-time validation.
- Real REST API integration against Neon: 44 checks passed. Covered register/login, ownership isolation between two accounts, categories, task/subtask progress, conflicts, reschedule history, occurrence status, focus persistence and duplicate prevention, insights, preferences, refresh rotation, logout, and task/account cleanup.
- Mobile form/date tests: 6 tests passed.
- Mobile TypeScript check passed after aligning with Expo SDK 58.
- Expo SDK dependency compatibility check passed.
- Expo web export passed on SDK 58.
- Android and iOS Hermes bundle exports passed on SDK 58.

## UI checks performed before the broader redesign

Browser preview of React Native Web was inspected at 390×844 and 320×740. Actual UI interactions covered login, task creation, adding a planning session, visibility in Today/Calendar, focus start/pause/end with successful API save, and switching to Light mode. The initial implementation used SDK 54 during this interactive browser pass; a later dependency alignment moved the baseline to SDK 58.

These are browser-preview checks, not evidence of a physical Android/iPhone test. Native notifications, secure token persistence across process termination, keyboard/safe-area behavior on real devices, and release binaries remain unverified. SMTP configuration is pending by user choice.

## Git baseline

The first commit captures implementation before the next visual redesign. Generated redesign reference images are not part of this baseline. Local `.env`, QA credentials, dependency caches, logs and build outputs are excluded by `.gitignore`. `scripts/check-staged-secrets.mjs` checks the exact Git index against local secrets and common credential patterns without printing secret values.
