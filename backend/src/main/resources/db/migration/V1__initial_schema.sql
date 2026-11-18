CREATE TABLE users (
 id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
 password_hash TEXT NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
 created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE UNIQUE INDEX users_email_unique ON users(lower(email));
CREATE TABLE user_preferences (
 id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users ON DELETE CASCADE,
 theme VARCHAR(20) NOT NULL DEFAULT 'SYSTEM' CHECK(theme IN ('LIGHT','DARK','SYSTEM')),
 notifications_enabled BOOLEAN NOT NULL DEFAULT false,
 default_reminder INTEGER NOT NULL DEFAULT 15 CHECK(default_reminder IN (0,5,15,30,60)),
 focus_minutes INTEGER NOT NULL DEFAULT 25 CHECK(focus_minutes BETWEEN 1 AND 180),
 short_break_minutes INTEGER NOT NULL DEFAULT 5 CHECK(short_break_minutes BETWEEN 1 AND 60),
 long_break_minutes INTEGER NOT NULL DEFAULT 15 CHECK(long_break_minutes BETWEEN 1 AND 120),
 created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE auth_refresh_tokens (
 id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
 token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
 revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE password_reset_tokens (
 id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
 token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE categories (
 id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
 name VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL,
 created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL, UNIQUE(id,user_id)
);
CREATE UNIQUE INDEX category_name_unique ON categories(user_id,lower(name));
CREATE TABLE tasks (
 id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
 category_id UUID REFERENCES categories ON DELETE SET NULL,
  title VARCHAR(150) NOT NULL,
 description TEXT,
  priority VARCHAR(10) NOT NULL CHECK(priority IN ('LOW','MEDIUM','HIGH')),
 status VARCHAR(20) NOT NULL CHECK(status IN ('TODO','IN_PROGRESS','COMPLETED')),
 due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL, UNIQUE(id,user_id)
);
CREATE INDEX task_user_status_due ON tasks(user_id,status,due_at);
CREATE TABLE subtasks (
 id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
 task_id UUID NOT NULL,
  title VARCHAR(150) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT false,
 sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
 FOREIGN KEY(task_id,user_id) REFERENCES tasks(id,user_id) ON DELETE CASCADE
);
CREATE TABLE recurring_rules (
 id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
 task_id UUID NOT NULL UNIQUE,
  frequency VARCHAR(10) NOT NULL CHECK(frequency IN ('DAILY','WEEKLY','MONTHLY')),
 repeat_interval INTEGER NOT NULL CHECK(repeat_interval BETWEEN 1 AND 365),
  weekdays VARCHAR(30) NOT NULL DEFAULT '',
 start_date DATE NOT NULL,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT true,
 created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL, UNIQUE(id,user_id),
 FOREIGN KEY(task_id,user_id) REFERENCES tasks(id,user_id) ON DELETE CASCADE,
 CHECK(end_date IS NULL OR end_date >= start_date)
);
CREATE TABLE recurring_occurrences (
 id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
 rule_id UUID NOT NULL,
  occurrence_date DATE NOT NULL,
  title_override VARCHAR(150),
 status VARCHAR(20) NOT NULL DEFAULT 'TODO' CHECK(status IN ('TODO','IN_PROGRESS','COMPLETED','SKIPPED')),
 completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
 UNIQUE(rule_id,occurrence_date), UNIQUE(id,user_id),
 FOREIGN KEY(rule_id,user_id) REFERENCES recurring_rules(id,user_id) ON DELETE CASCADE
);
CREATE TABLE planning_sessions (
 id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
 task_id UUID NOT NULL,
  occurrence_id UUID,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
 status VARCHAR(20) NOT NULL CHECK(status IN ('PLANNED','COMPLETED','CANCELLED','RESCHEDULED')),
 reminder_minutes_before INTEGER CHECK(reminder_minutes_before IN (0,5,15,30,60)),
 previous_session_id UUID REFERENCES planning_sessions ON DELETE SET NULL,
 created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
 FOREIGN KEY(task_id,user_id) REFERENCES tasks(id,user_id) ON DELETE CASCADE,
 FOREIGN KEY(occurrence_id,user_id) REFERENCES recurring_occurrences(id,user_id),
 CHECK(end_at > start_at)
);
CREATE INDEX planner_user_time ON planning_sessions(user_id,start_at,end_at);
CREATE TABLE focus_sessions (
 id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users ON DELETE CASCADE,
 task_id UUID REFERENCES tasks ON DELETE SET NULL,
 mode VARCHAR(20) NOT NULL CHECK(mode IN ('FOCUS','SHORT_BREAK','LONG_BREAK')),
 started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
 duration_seconds INTEGER NOT NULL CHECK(duration_seconds BETWEEN 1 AND 10800),
 completed BOOLEAN NOT NULL,
  client_id UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
 UNIQUE(user_id,client_id), CHECK(ended_at >= started_at)
);
CREATE INDEX focus_user_time ON focus_sessions(user_id,started_at);
