# Dayflow

Dayflow is a personal productivity planner for Android and iOS that brings tasks, daily planning, focus sessions, and progress insights into one app. It helps students, professionals, and freelancers turn a list of things to do into a practical daily schedule.

Capture a task, organize it by category and priority, schedule time to work on it, and start a focus session. Review your progress to understand how you spend your time and what you complete.

## Features

### Tasks and organization

- Create, edit, and delete tasks with optional deadlines, priorities, and statuses.
- Break larger tasks into subtasks.
- Organize work with personal categories.
- Find tasks with search, filters, sorting, and pagination.

### Daily planning and calendar

- See today's work in a dedicated Today view.
- Schedule one or more planning sessions for a task.
- Review scheduling conflicts and choose whether to keep an overlapping session.
- Reschedule sessions while preserving their history.
- Browse day, week, and month calendar views with an agenda.
- Distinguish task deadlines from scheduled work, and overdue tasks from missed sessions.

Tasks and planning sessions are separate records: a deadline describes when a task is due, while a planning session reserves time to work on it. This lets you spread a single task across multiple sessions without duplicating the task itself.

### Recurring tasks

- Set daily, weekly, or monthly recurrence with custom intervals.
- Choose weekdays and an optional end date.
- Update the title and completion status of individual occurrences.
- Edit or stop a recurring series.

### Focus sessions

- Start a focus timer and take breaks.
- Pause and resume a session.
- Recover the native timer state when reopening the app.
- Record actual focus duration, with retry protection against duplicate submissions.

The timer uses timestamps to recalculate remaining time when the app becomes active again. Focus records are sent to the backend when the app can run and has a connection.

### Insights

- Review completion trends using your account's timezone.
- See task activity by category and summaries of focus time.
- Compare planned and completed tasks without counting a task multiple times just because it has several planning sessions.

### Account and preferences

- Onboarding, registration, login, logout, and session renewal.
- Profile management, password changes, and account deletion.
- Password reset through email when SMTP is configured.
- Light, dark, and system themes.
- Configurable focus and reminder preferences.
- Local reminders refreshed after relevant changes and when the app becomes active.

## Technology

| Layer           | Technologies                                                |
| --------------- | ----------------------------------------------------------- |
| Mobile app      | React Native, Expo, Expo Router, TypeScript                 |
| UI and styling  | NativeWind, Tailwind CSS, shared theme tokens, Lucide icons |
| State and data  | Zustand, TanStack Query                                     |
| Forms           | React Hook Form, Zod                                        |
| Native services | Expo SecureStore, Expo Notifications                        |
| Backend         | Java 25 LTS, Spring Boot, Spring Security, Spring Data JPA   |
| Database        | PostgreSQL, with Neon configuration support                 |
| Migrations      | Flyway                                                      |

The mobile app communicates with the backend through a REST API. PostgreSQL stores the main application data, and the backend is the source of truth. Flyway applies database migrations at startup; Hibernate validates the schema.

Native session credentials are stored with Expo SecureStore. The web preview keeps session credentials in memory, so they do not survive a page reload.

## Getting started

### Requirements

- Node.js 22.13 or newer and npm.
- Java 25 LTS or newer.
- Maven 3.9 or newer, or the bundled setup script for Windows.
- A PostgreSQL database, such as a Neon database.
- A physical device or emulator for native testing.

Use an Expo Go version compatible with the Expo version declared in `mobile/package.json`, or a matching development build.

### 1. Configure the backend

Copy `backend/.env.example` to `backend/.env` and set your database connection and JWT secret:

```powershell
Copy-Item backend/.env.example backend/.env
```

| Variable                         | Purpose                                                        |
| -------------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL`                   | PostgreSQL JDBC connection URL                                 |
| `DATABASE_USERNAME`              | Database username                                              |
| `DATABASE_PASSWORD`              | Database password                                              |
| `JWT_SECRET`                     | Signing secret with at least 32 random bytes                   |
| `PORT`                           | API port; defaults to `8080`                                   |
| `CORS_ORIGINS`                   | Comma-separated allowed browser origins                        |
| `MAIL_HOST`, `MAIL_PORT`         | SMTP server connection                                         |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | SMTP credentials, when required                                |
| `MAIL_AUTH`, `MAIL_TLS`          | SMTP authentication and STARTTLS settings                      |
| `MAIL_FROM`                      | Sender address for password reset emails                       |
| `PASSWORD_RESET_URL`             | Reset link destination; defaults to `dayflow://reset-password` |

Keep backend credentials in the backend environment. Variables prefixed with `EXPO_PUBLIC_` are exposed to the mobile app and must not contain secrets.

### 2. Start the backend

From the repository root on Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup-tools.ps1
powershell -ExecutionPolicy Bypass -File scripts/backend.ps1 run
```

The setup script downloads Maven into `.tools`. The backend script loads `backend/.env` and can use Android Studio's bundled Java runtime if `JAVA_HOME` is not set.

After setup, you can also start the backend with the shortcut from the `backend` directory:

```powershell
cd backend
.\start.ps1
```

If Maven is already installed, load the environment variables into your shell, then run `mvn spring-boot:run` from `backend`.

Check the API at [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health).

### 3. Start the mobile app

```powershell
cd mobile
npm ci
npm start
```

The app attempts to derive the development computer's address from the Metro host. To specify the backend address explicitly, copy `mobile/.env.example` to `mobile/.env` and set:

```dotenv
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:8080/api/v1
```

Restart Expo after changing the environment file.

### Run on iPhone

1. Start the backend and Expo on your computer.
2. Connect the iPhone and computer to the same Wi-Fi network.
3. Open the Expo QR code with Camera or Expo Go, using a compatible client.
4. Ensure the device can reach the computer on ports `8080` and `8081`.

Use the computer's LAN address for the backend on a physical device. `localhost` on the phone points to the phone itself.

Windows can host Metro for a physical iPhone. The iOS Simulator and local native iOS builds require macOS and Xcode.

### Run on Android

Open the Expo QR code in a compatible Expo Go client, or press `a` in Metro to launch an active Android emulator. For the standard Android emulator, you can set the backend URL to `http://10.0.2.2:8080/api/v1`.

### Open the web preview

```powershell
cd mobile
npm run web
```

The preview is available at [http://localhost:8081](http://localhost:8081) and uses the same screens through React Native Web. Use native devices to verify SecureStore, notifications, and mobile lifecycle behavior.

## Project structure

```text
backend/
  src/main/java/com/dayflow/
    auth/                Authentication and password reset
    category/            Personal task categories
    common/              Shared API and domain utilities
    focus/               Focus session records
    insights/            Productivity summaries
    planner/             Scheduled work sessions
    recurrence/          Recurring rules and occurrences
    security/            API security and rate limiting
    task/                Tasks and subtasks
    user/                Profiles and preferences
  src/main/resources/db/migration/
  src/test/java/com/dayflow/
mobile/
  app/                   Expo Router screens and navigation
  assets/                App icons and splash assets
  src/components/        Reusable native UI components
  src/features/          Feature flows and form validation
  src/services/          API, storage, notifications, timer lifecycle
  src/store/             Session and focus state
  src/theme/             Light and dark theme tokens
  src/types/             API contracts
  src/utils/             Date and time helpers
  tests/                 Form and date utility tests
scripts/                 Tool setup, backend commands, API verification
docs/                    API documentation
```

See [API documentation](docs/api.md) for endpoint details.

## Verification

Run backend unit tests from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/backend.ps1 test
```

With the backend running, verify the API against a development database:

```powershell
node scripts/test-api.mjs
```

The API verification script creates two unique test accounts, exercises real API flows, and attempts to delete both accounts and their data in a `finally` block. Run it only against a development database intended for testing.

Run mobile checks from `mobile`:

```powershell
npm run typecheck
npm test
npx expo install --check
npx expo export --platform android --platform ios
npx expo export --platform web
```

Backend unit tests use JUnit and Mockito. Mobile tests use Node's test runner for form validation and date utilities. Export checks verify bundling; physical device testing is still needed for notification permissions, background behavior, keyboard handling, and safe areas.

## Current limitations

- Main application data requires a backend connection; full offline operation is not supported.
- Password reset email delivery requires a working SMTP configuration.
- Local reminders cover a rolling 28-day window and schedule up to 60 upcoming notifications. The window refreshes when the app becomes active, and delivery depends on notification permissions and operating system behavior.
- Timer recovery uses saved timestamps. Saving focus records to the API depends on the app being able to run and connect.
- Native distribution builds and physical Android/iPhone behavior need verification before release.

## Development conventions

TypeScript and TSX use Prettier with a print width of 88. Keep shared visual styles in theme tokens and reusable native components. Once a database migration has been shared or released, introduce schema changes in a new migration rather than editing an existing one.

For Pressable components styled entirely through a functional `style` prop, set
`cssInterop={false}` so NativeWind preserves the native style callback. Keep
className-based components on the normal NativeWind path. The native Pressable
regression checks exercise the installed JSX dispatcher and actual component source.

Database IDs use per-table BIGINT identity columns with entity-specific names.
API IDs are decimal strings to preserve JavaScript precision. See
[database ID conventions and migration checks](docs/database-ids.md).

For production, configure HTTPS, separate environment credentials, working SMTP delivery, and verified native distribution builds.
