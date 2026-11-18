// Writes a rollback-only PostgreSQL test. Run with psql -v ON_ERROR_STOP=1 -f FILE.
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const tables = {
  users: 'user_id',
  user_preferences: 'user_preference_id',
  auth_refresh_tokens: 'auth_refresh_token_id',
  password_reset_tokens: 'password_reset_token_id',
  categories: 'category_id',
  tasks: 'task_id',
  subtasks: 'subtask_id',
  recurring_rules: 'recurring_rule_id',
  recurring_occurrences: 'recurring_occurrence_id',
  planning_sessions: 'planning_session_id',
  focus_sessions: 'focus_session_id',
};
const refs = Object.fromEntries(
  Object.keys(tables).map((table) => [table, table === 'users' ? {} : { user_id: 'users' }]),
);
Object.assign(refs.tasks, { category_id: 'categories' });
Object.assign(refs.subtasks, { task_id: 'tasks' });
Object.assign(refs.recurring_rules, { task_id: 'tasks' });
Object.assign(refs.recurring_occurrences, { rule_id: 'recurring_rules' });
Object.assign(refs.planning_sessions, {
  task_id: 'tasks', occurrence_id: 'recurring_occurrences',
  previous_session_id: 'planning_sessions',
});
Object.assign(refs.focus_sessions, { task_id: 'tasks' });

// Hash all data after translating numeric references back to their legacy UUIDs.
// Actual data and credentials are never written to stdout.
function fingerprint(converted) {
  return Object.entries(tables).map(([table, pk]) => {
    let row = 'to_jsonb(t)';
    if (converted) {
      row += ` - '${pk}' - 'legacy_uuid' || jsonb_build_object('id', t.legacy_uuid)`;
      for (const [column, parent] of Object.entries(refs[table])) {
        row += ` || jsonb_build_object('${column}', (SELECT p.legacy_uuid FROM ${parent} p WHERE p.${tables[parent]} = t.${column}))`;
      }
    }
    return `SELECT '${table}' AS table_name, count(*) AS rows,
      md5(coalesce(string_agg(data::text, '' ORDER BY data::text), '')) AS digest
      FROM (SELECT ${row} AS data FROM ${table} t) records`;
  }).join('\nUNION ALL\n') + '\nORDER BY table_name;\n';
}

fs.mkdirSync('.local', { recursive: true });
fs.writeFileSync('.local/id-before.sql', fingerprint(false));
fs.writeFileSync('.local/id-after.sql', fingerprint(true));
const ids = Object.fromEntries(Object.keys(tables).map((t) => [t, `'${randomUUID()}'`]));
const insert = (table, columns, values) =>
  `INSERT INTO ${table} (id, created_at, updated_at${columns ? ', ' + columns : ''}) VALUES (${ids[table]}, now(), now()${values ? ', ' + values : ''});`;
const user = ids.users;
const task = ids.tasks;
const fixture = [
  insert('users', 'name, email, password_hash', "'Migration fixture', 'migration@example.test', 'not-a-password'"),
  insert('user_preferences', 'user_id', user),
  insert('auth_refresh_tokens', 'user_id, token_hash, expires_at', `${user}, 'refresh-fixture', now() + interval '1 day'`),
  insert('password_reset_tokens', 'user_id, token_hash, expires_at', `${user}, 'reset-fixture', now() + interval '1 hour'`),
  insert('categories', 'user_id, name, color', `${user}, 'Fixture', '#7366F0'`),
  insert('tasks', 'user_id, category_id, title, priority, status', `${user}, ${ids.categories}, 'Preserved task', 'MEDIUM', 'TODO'`),
  insert('subtasks', 'user_id, task_id, title', `${user}, ${task}, 'Preserved subtask'`),
  insert('recurring_rules', 'user_id, task_id, frequency, repeat_interval, start_date', `${user}, ${task}, 'DAILY', 1, current_date`),
  insert('recurring_occurrences', 'user_id, rule_id, occurrence_date', `${user}, ${ids.recurring_rules}, current_date`),
  insert('planning_sessions', 'user_id, task_id, occurrence_id, start_at, end_at, status', `${user}, ${task}, ${ids.recurring_occurrences}, now(), now() + interval '1 hour', 'PLANNED'`),
  insert('focus_sessions', 'user_id, task_id, mode, started_at, ended_at, duration_seconds, completed, client_id', `${user}, ${task}, 'FOCUS', now() - interval '1 minute', now(), 60, true, '${randomUUID()}'`),
  `INSERT INTO planning_sessions (id, user_id, task_id, previous_session_id, start_at, end_at, status, created_at, updated_at)
   VALUES ('${randomUUID()}', ${user}, ${task}, ${ids.planning_sessions}, now() + interval '2 hours', now() + interval '3 hours', 'PLANNED', now(), now());`,
  `INSERT INTO tasks (id, user_id, title, priority, status, created_at, updated_at)
   VALUES ('${randomUUID()}', ${user}, 'Nullable references', 'LOW', 'TODO', now(), now());`,
].join('\n');
const v1 = fs.readFileSync('backend/src/main/resources/db/migration/V1__initial_schema.sql', 'utf8');
const v2 = fs.readFileSync('backend/src/main/resources/db/migration/V2__sequential_entity_ids.sql', 'utf8');
const schema = `id_test_${randomUUID().replaceAll('-', '')}`;
fs.writeFileSync('.local/test-id-migration.sql', `
BEGIN;
CREATE SCHEMA ${schema};
SET LOCAL search_path = ${schema};
${v1}
${fixture}
CREATE TEMP TABLE before_ids ON COMMIT DROP AS ${fingerprint(false)}
${v2}
CREATE TEMP TABLE after_ids ON COMMIT DROP AS ${fingerprint(true)}
DO $$
BEGIN
  IF EXISTS (SELECT * FROM before_ids EXCEPT SELECT * FROM after_ids)
    OR EXISTS (SELECT * FROM after_ids EXCEPT SELECT * FROM before_ids) THEN
    RAISE EXCEPTION 'Migration changed data or relationships';
  END IF;
  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = '${schema}' AND is_identity = 'YES') <> 11 THEN
    RAISE EXCEPTION 'Expected 11 independent identity columns';
  END IF;
END $$;
-- Identity insertion, nullable legacy UUID, category SET NULL and task CASCADE.
INSERT INTO categories (user_id, name, color, created_at, updated_at)
SELECT user_id, 'New identity', '#123456', now(), now() FROM users;
DELETE FROM categories WHERE legacy_uuid IS NOT NULL;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM tasks WHERE category_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Category deletion did not clear task reference';
  END IF;
END $$;
DELETE FROM planning_sessions;
DELETE FROM tasks;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM subtasks) OR EXISTS (SELECT 1 FROM recurring_rules)
    OR EXISTS (SELECT 1 FROM recurring_occurrences)
    OR EXISTS (SELECT 1 FROM focus_sessions WHERE task_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Task deletion actions failed';
  END IF;
END $$;
DELETE FROM users;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM focus_sessions) OR EXISTS (SELECT 1 FROM categories)
    OR EXISTS (SELECT 1 FROM auth_refresh_tokens)
    OR EXISTS (SELECT 1 FROM password_reset_tokens)
    OR EXISTS (SELECT 1 FROM user_preferences) THEN
    RAISE EXCEPTION 'User deletion actions failed';
  END IF;
END $$;
ROLLBACK;
SELECT 'ID migration: data, relationships, identities and deletion actions passed' AS result;
`);
console.log('Prepared rollback-only ID migration test and private comparison queries.');
