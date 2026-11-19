# Feature verification — 19 November 2026

This report records checks performed against the current working tree. Passing these checks does not establish that every device and lifecycle scenario is bug-free.

## Automated results

| Check | Result | Scope |
| --- | --- | --- |
| Backend JUnit/Mockito | 15 passed, 0 failed | Domain rules, numeric IDs, focus validation/idempotency, password reset |
| Mobile TypeScript | Passed | Current app, services, and tests |
| Mobile Node tests | 17 passed, 0 failed | Forms, date utilities, NativeWind controls, focus state, reminder logic |
| Existing integration suite | 53 API checks passed | Real running backend and PostgreSQL |
| Additional feature suite | 56 API checks passed, 11 scenarios passed | Real backend and PostgreSQL, disposable accounts |
| Password reset integration | 7 API checks passed before cleanup | Dedicated backend, real PostgreSQL, local SMTP sink |
| Expo export | Android, iOS, and web passed | Hermes bundles for Android/iOS and web build; not signed distribution binaries |

Commands run from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backend.ps1 test
node scripts/test-api.mjs
node scripts/test-features.mjs
```

Commands run from `mobile`:

```powershell
npm run typecheck
npm test
npx expo export --platform all --output-dir ../.local/feature-verification-export
```

Mockito completed on the host Windows environment. The earlier stalled run was not reproduced there; it had occurred inside the restricted execution environment.

## API coverage

- Registration, login, refresh rotation, rejection of reused/revoked refresh tokens, logout, and account cleanup.
- Isolation between accounts for tasks, categories, subtasks, recurrence rules, and occurrences.
- Task creation/editing/deletion, description and deadline persistence, search, priority/status/category filters, and a paginated result.
- Category rename/deletion, with tasks retained and their category reference cleared.
- Subtask creation, rename, completion, deletion, and parent-task independence.
- Planning conflicts, explicit conflict override, invalid time ranges, rescheduling history, and task deletion cleanup.
- Daily recurrence intervals and inclusive end dates; weekly weekdays, series editing and stopping; monthly day-31 clamping to February; stable occurrence IDs; individual occurrence completion.
- Invalid recurrence windows, weekdays, numeric IDs, reminder intervals, and elapsed focus durations.
- Focus records, idempotent duplicate submissions, summaries, insights, and planned-task deduplication.
- Profile name/timezone updates, invalid timezone rejection without overwriting the saved timezone, all focus/reminder preferences, and theme persistence.
- Password changes reject the wrong current password, accept the new password, reject the old password, and revoke existing refresh sessions.

The first extended-suite run expected HTTP 422 for an invalid timezone. The API's existing exception handler correctly returned HTTP 400. The test expectation was corrected to the current contract; this was not treated as an application defect.

## Password reset

Five unit tests cover hashed token storage, a 30-minute expiry, valid reset, single-use enforcement, expired-token rejection, refresh-session revocation, nonexistent accounts, and a controlled SMTP error.

An additional integration test used `scripts/test-password-reset.mjs` and a temporary backend on port 8083. Mail was captured by a local SMTP sink bound to `127.0.0.1:2525`; no email was sent to an external recipient. The delivered reset link successfully changed a disposable account's password, its token could not be reused, and the original refresh token was rejected.

The temporary backend used command-line overrides for its port, SMTP host/port, disabled SMTP authentication/STARTTLS for the local sink, and a localhost reset-link destination. Existing `.env` files and the main backend were not changed. The temporary SMTP listener and backend were stopped afterward.

This verifies the reset flow with a controlled SMTP transport. Delivery through a real email provider and opening its link on a physical phone remain unverified.

## Interactive app checks

The current React Native Web preview was exercised through its visible controls using a disposable account:

- Empty login shows email/password validation; valid login opens Today.
- Creating a task and adding/completing a subtask updates the detail screen.
- Planning a task persists the session and displays it in Today and the calendar agenda.
- Creating a daily recurrence updates the task's series summary and shows its occurrence in Calendar.
- Completing an occurrence, opening Insights, and switching between calendar views did not produce a new runtime error after the rendering fix.
- Focus start, pause, resume, and end produced a saved-session confirmation and a record on task details.
- Dark theme persists; Account security opens with lock icons and independent show/hide controls for both password fields.
- Both password visibility controls switch the input between visible text and password masking.
- Opening Planner with no selected task shows normal validation when saving and no longer emits the empty-text-node rendering error.

The existing Pixel_7 Android emulator was also launched directly from the Android SDK, and the current project opened successfully in Expo Go. It restored an existing user session and displayed Today. That account's tasks, preferences, and credentials were not modified. This is a native launch check, not a complete native feature pass.

## Fixes applied

1. Account security and Reset password now reuse the existing `AuthField` component, with lock icons, show/hide controls, and password-appropriate keyboard settings.
2. Shared `Field` and `TaskPicker` conditions now use booleans rather than potentially rendering an empty string directly inside a native `View`. A regression test covers the empty field-error case observed in Planner.

## Native behavior covered by simulated tests

The focus tests execute the actual Zustand store with controlled time and substituted persistent storage. They cover paused-time exclusion, timestamp recovery after a simulated process restart, stable idempotency keys, double-finish protection, break modes, and clearing state.

The reminder tests execute the actual reconciliation function with substituted React/native dependencies. They cover selecting the nearest 60 eligible reminders, excluding past/cancelled/completed items, permission denial, disabled preferences, stale-notification cancellation, avoiding duplicate schedules, and skipping native scheduling on web.

These tests do not verify OS notification delivery, real SecureStore persistence, physical-device process termination, or lock-screen timing.

## Cleanup and remaining limits

All accounts created by the API, reset, and UI checks were deleted together with their related records. The temporary UI session file was also removed. No existing user records were changed by the test suites. Generated exports and the Account security screenshot are stored under ignored `.local` directories.

Still requires device verification:

- Android/iPhone notification permissions and delivery while backgrounded, locked, or terminated.
- SecureStore and timer recovery after a real app process is killed, including storage failures.
- Physical-device keyboard, safe-area, and accessibility behavior across devices.
- Real SMTP provider delivery and native password-reset deep links.
- Signed release builds and long-running/offline/network-recovery scenarios.

Main task data still requires the backend. The web preview intentionally stores credentials and timer state only in memory; full offline support is not implemented.
