# ID database

Keputusan pengguna menggantikan persyaratan UUID pada spesifikasi awal.
Migrasi Flyway V2 mengubah primary key dan seluruh foreign key menjadi BIGINT.
Setiap tabel mempunyai identity sequence sendiri; data baru mendapat ID otomatis.
ID yang dihapus tidak dipakai ulang dan kegagalan transaksi dapat menyisakan celah.

Migrasi V3 menempatkan primary key angka sebagai kolom pertama pada seluruh
11 tabel aplikasi. Kolom lainnya disusun setelah primary key dan `legacy_uuid`
diletakkan paling akhir. Nilai ID, data, identity sequence, default, index,
constraint, dan relasi tetap dipertahankan. Sidik seluruh data dibandingkan
di dalam transaksi; migrasi dibatalkan jika isi data berubah.

Migrasi V4 melengkapi urutan menjadi primary key, foreign key, kolom data,
kolom bertipe timestamp, lalu `legacy_uuid`. Foreign key ditemukan dari constraint
database, dengan `user_id` ditempatkan pertama dalam kelompok foreign key.
`client_id` pada focus session tetap termasuk kolom data karena bukan foreign key.

| Tabel | Primary key |
| --- | --- |
| users | user_id |
| user_preferences | user_preference_id |
| auth_refresh_tokens | auth_refresh_token_id |
| password_reset_tokens | password_reset_token_id |
| categories | category_id |
| tasks | task_id |
| subtasks | subtask_id |
| recurring_rules | recurring_rule_id |
| recurring_occurrences | recurring_occurrence_id |
| planning_sessions | planning_session_id |
| focus_sessions | focus_session_id |

Setelah verifikasi migrasi dan persetujuan pengguna, migrasi V5 menghapus
`legacy_uuid` dari seluruh 11 tabel aplikasi. Urutan akhir adalah primary key,
foreign key, data, lalu timestamp. Migrasi membandingkan sidik seluruh data
selain kolom audit sebelum dan sesudah penghapusan di dalam transaksi.
Backup privat dibuat sebelum penghapusan. `focus_sessions.client_id` tetap UUID
untuk mencegah penyimpanan sesi berulang saat aplikasi mengirim ulang permintaan;
kolom tersebut bukan primary key atau foreign key.

API mempertahankan properti `id`, `userId`, `taskId`, dan nama camelCase lainnya.
Nilainya berupa string desimal untuk menjaga presisi BIGINT pada JavaScript.
Backend menggunakan Long dan validasi referensi numerik positif.

## Verifikasi

`node scripts/test-id-migration.mjs` menghasilkan SQL pengujian di `.local`.
Jalankan `.local/test-id-migration.sql` menggunakan psql dengan `ON_ERROR_STOP=1`
pada database pengembangan. Pengujian membuat schema sementara, menjalankan V1,
mengisi seluruh jenis entitas, lalu menjalankan V2 sampai V5. Pengujian memeriksa
sidik data, relasi, urutan kolom, penghapusan kolom audit, identity, nullable
foreign key, CASCADE, dan SET NULL. Seluruh pengujian diakhiri ROLLBACK.

Saat migrasi Neon pada 18 November 2026, backup privat disimpan lokal sebelum
perubahan. Sidik data pada seluruh 11 tabel cocok setelah konversi, dengan token
baru untuk pengujian kompatibilitas sesi dikecualikan dari perbandingan.
Refresh token sebelum migrasi berhasil digunakan untuk akun yang sama setelah
migrasi. Kredensial, backup, dan hasil pemeriksaan privat tetap diabaikan Git.

Validasi akhir perubahan: 10 pengujian unit backend, 53 pemeriksaan API nyata,
6 pengujian mobile, dan TypeScript typecheck lulus. Pemeriksaan API mencakup
penyimpanan bersamaan, penolakan referensi ID tidak valid, ID setelah penghapusan,
ownership antar akun, planner, recurrence, dan idempotensi focus session.
