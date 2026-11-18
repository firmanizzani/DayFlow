# Kontrak REST API

Base path: `/api/v1`. Resource pengguna memerlukan `Authorization: Bearer ACCESS_TOKEN`. Payload dan response memakai JSON dengan nama field camelCase. Timestamp memakai ISO 8601 dengan offset/UTC; recurrence menggunakan tanggal kalender akun (`YYYY-MM-DD`).

ID resource di database memakai `BIGINT GENERATED ALWAYS AS IDENTITY` dengan
sequence terpisah untuk setiap tabel. Response API tetap mengirim ID sebagai
string desimal, misalnya `"id": "42"` dan `"taskId": "17"`, agar tidak kehilangan
presisi di JavaScript. Input referensi menerima string desimal positif atau
integer JSON. `clientId` pada focus session tetap UUID untuk idempotensi.
JWT menggunakan user ID numerik sebagai subject; access token UUID lama mendapat
401 dan refresh token yang sudah ada dapat dipakai untuk mendapatkan sesi baru.

| Modul                       | Method             | Path                                                                                          |
| --------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| Health                      | GET                | `/health`                                                                                     |
| Authentication              | POST               | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`                              |
| Password reset              | POST               | `/auth/forgot-password`, `/auth/reset-password`                                               |
| Profile                     | GET, PATCH, DELETE | `/users/me`                                                                                   |
| Preferences                 | GET, PATCH         | `/users/me/preferences`                                                                       |
| Change password             | POST               | `/users/me/password`                                                                          |
| Tasks                       | GET, POST          | `/tasks`                                                                                      |
| Task detail                 | GET, PATCH, DELETE | `/tasks/{id}`                                                                                 |
| Task status                 | PATCH              | `/tasks/{id}/status`                                                                          |
| Subtasks                    | GET, POST          | `/tasks/{id}/subtasks`                                                                        |
| Subtask                     | PATCH, DELETE      | `/subtasks/{id}`                                                                              |
| Categories                  | GET, POST          | `/categories`                                                                                 |
| Category                    | PATCH, DELETE      | `/categories/{id}`                                                                            |
| Planner                     | GET, POST          | `/planning-sessions`                                                                          |
| Planning session            | PATCH, DELETE      | `/planning-sessions/{id}`                                                                     |
| Reschedule                  | POST               | `/planning-sessions/{id}/reschedule`                                                          |
| Session status              | PATCH              | `/planning-sessions/{id}/status`                                                              |
| Recurrence rules            | GET, POST          | `/recurring-rules`                                                                            |
| Rule                        | PATCH, DELETE      | `/recurring-rules/{id}`                                                                       |
| Occurrences                 | GET                | `/recurring-occurrences`                                                                      |
| Occurrence exception/status | PATCH              | `/recurring-occurrences/{id}`                                                                 |
| Focus                       | GET, POST          | `/focus-sessions`                                                                             |
| Focus summary               | GET                | `/focus-sessions/summary`                                                                     |
| Dashboard                   | GET                | `/dashboard/today`, `/dashboard/unfinished`                                                   |
| Insights                    | GET                | `/insights/overview`, `/insights/completion-trend`, `/insights/focus`, `/insights/categories` |

## Authentication

Register: `{ name, email, password, timezone }`. Login: `{ email, password }`. Response: `{ accessToken, refreshToken, user }`. User tidak memuat hash password.

Access JWT berlaku 15 menit, issuer `dayflow`, subject UUID pengguna. Refresh token acak berlaku 30 hari dan hanya hash SHA-256 yang tersimpan. `/auth/refresh` dan `/auth/logout` menerima `{ refreshToken }`. Rotasi mencabut token lama secara transaksional dengan row lock. Logout mencabut refresh session. Access token yang telah terbit tetap memiliki masa berlaku pendeknya.

Forgot password: `{ email }`. Reset: `{ token, password }`. Change password: `{ currentPassword, newPassword }`. Password minimal 8 karakter dan maksimal 72 UTF-8 bytes untuk BCrypt. Endpoint auth dibatasi 30 permintaan POST per IP per menit pada satu instance backend.

## Tasks

Create: `{ title, description?, categoryId?, priority?, dueAt? }`. Status default `TODO`, priority default `MEDIUM`. Nilai status: `TODO`, `IN_PROGRESS`, `COMPLETED`. Priority: `LOW`, `MEDIUM`, `HIGH`. Field opsional dapat bernilai `null` untuk dihapus lewat PATCH.

GET query: `page` (mulai 0), `size` (1–100), `status`, `categoryId`, `priority`, `search`, `dueBefore`, `sort` (`createdAt`, `dueAt`, `title`, `priority`). Response berbentuk Spring Page dengan `content`, `totalElements`, `number`, `last`. Setiap task list memuat `totalSubtasks` dan `completedSubtasks` dari agregasi backend.

Subtask: `{ title, isCompleted?, sortOrder? }`. Penyelesaian semua subtask tidak mengubah status task induk.

Category: `{ name, color }`. Warna berupa hex enam digit. Nama unik per pengguna tanpa membedakan huruf besar/kecil. Penghapusan kategori membuat task terkait menjadi uncategorized.

## Planner

Create: `{ taskId, occurrenceId?, startAt, endAt, reminderMinutesBefore?, allowConflict? }`. Reminder dapat bernilai `null`, 0, 5, 15, 30, atau 60. `endAt` wajib setelah `startAt`. Occurrence harus milik task dan akun yang sama.

GET memakai `from` inclusive dan `to` exclusive, maksimal satu tahun. Sesi yang melintasi batas range juga ikut dimuat. Status: `PLANNED`, `COMPLETED`, `CANCELLED`, `RESCHEDULED`.

Konflik menghasilkan HTTP 409 dengan `code: SCHEDULE_CONFLICT` dan `details` berupa daftar sesi yang bertabrakan. Pengguna dapat mengirim ulang dengan `allowConflict: true`. Blok yang berakhir tepat ketika sesi berikutnya mulai tidak bertabrakan.

Reschedule: `{ startAt, endAt, reminderMinutesBefore?, allowConflict? }`. Sesi lama menjadi `RESCHEDULED`; sesi baru menyimpan `previousSessionId`. DELETE membatalkan sesi tanpa menghapus task. Status task tidak berubah ketika waktu sesi lewat atau sesi dikonfirmasi selesai.

## Recurrence

Create: `{ taskId, frequency, repeatInterval, weekdays?, startDate, endDate? }`. Frequency `DAILY`, `WEEKLY`, atau `MONTHLY`; weekdays array angka ISO Monday = 1 sampai Sunday = 7. Monthly pada tanggal 29–31 memakai hari terakhir untuk bulan yang lebih pendek.

GET occurrences memakai `from` dan `to` tanggal inclusive, maksimal 93 hari. Occurrence dibuat hanya untuk window yang diminta, dengan UUID stabil dari rule dan tanggal; tidak ada generator tanpa batas. PATCH occurrence menerima `status` (`TODO`, `IN_PROGRESS`, `COMPLETED`, `SKIPPED`) dan/atau `title` sebagai exception hari tersebut. DELETE rule menonaktifkan series dan mempertahankan record historis.

## Focus dan insights

POST focus: `{ clientId, taskId?, mode, startedAt, endedAt, durationSeconds, completed }`. `clientId` UUID unik per pengguna berfungsi sebagai idempotency key. Mode `FOCUS`, `SHORT_BREAK`, atau `LONG_BREAK`. Durasi 1–10800 detik, tidak boleh melebihi elapsed wall time; jeda tidak dihitung sebagai fokus. Hanya mode `FOCUS` masuk agregasi focus time.

GET focus, summary, dan insights memakai range timestamp `from` inclusive, `to` exclusive, maksimal satu tahun. Completion trend dikelompokkan berdasarkan timezone akun. Planned task dihitung distinct; beberapa planning session tidak menggandakan task dalam denominator.

Dashboard Today menerima `date` opsional; default hari ini di timezone akun. Unfinished memisahkan `overdueTasks` dan `missedSessions`.

## Error

Error aplikasi menggunakan `{ code, message, details, requestId }`. Bean validation menaruh field errors dalam `details`. Resource asing diperlakukan sebagai tidak ditemukan (404). Input invalid memakai 400/422; konflik 409; token invalid 401; rate limit 429 dengan `Retry-After`; kegagalan mail 503.
