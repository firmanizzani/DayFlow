-- Convert existing rows in place. Flyway runs this migration in one transaction.
-- UUIDs remain in legacy_uuid for audit; all primary/foreign keys become BIGINT.
-- New rows use an independent identity sequence for each entity table.
SET LOCAL lock_timeout = '15s';

LOCK TABLE users, user_preferences, auth_refresh_tokens,
    password_reset_tokens, categories, tasks, subtasks,
    recurring_rules, recurring_occurrences, planning_sessions,
    focus_sessions IN ACCESS EXCLUSIVE MODE;

CREATE TEMP TABLE dayflow_id_tables (
    table_name TEXT PRIMARY KEY,
    primary_column TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO dayflow_id_tables VALUES
    ('users', 'user_id'),
    ('user_preferences', 'user_preference_id'),
    ('auth_refresh_tokens', 'auth_refresh_token_id'),
    ('password_reset_tokens', 'password_reset_token_id'),
    ('categories', 'category_id'),
    ('tasks', 'task_id'),
    ('subtasks', 'subtask_id'),
    ('recurring_rules', 'recurring_rule_id'),
    ('recurring_occurrences', 'recurring_occurrence_id'),
    ('planning_sessions', 'planning_session_id'),
    ('focus_sessions', 'focus_session_id');

CREATE TEMP TABLE dayflow_id_relations (
    child_table TEXT,
    child_column TEXT,
    parent_table TEXT
) ON COMMIT DROP;

INSERT INTO dayflow_id_relations
SELECT table_name, 'user_id', 'users'
FROM dayflow_id_tables
WHERE table_name <> 'users';

INSERT INTO dayflow_id_relations VALUES
    ('tasks', 'category_id', 'categories'),
    ('subtasks', 'task_id', 'tasks'),
    ('recurring_rules', 'task_id', 'tasks'),
    ('recurring_occurrences', 'rule_id', 'recurring_rules'),
    ('planning_sessions', 'task_id', 'tasks'),
    ('planning_sessions', 'occurrence_id', 'recurring_occurrences'),
    ('planning_sessions', 'previous_session_id', 'planning_sessions'),
    ('focus_sessions', 'task_id', 'tasks');

-- Capture exact foreign key actions, including composite ownership constraints.
CREATE TEMP TABLE dayflow_id_foreign_keys ON COMMIT DROP AS
SELECT c.conrelid::regclass AS child_table,
    c.conname AS constraint_name,
    replace(
        pg_get_constraintdef(c.oid),
        '(id',
        '(' || parent.primary_column
    ) AS definition
FROM pg_constraint c
JOIN dayflow_id_tables parent
    ON c.confrelid = to_regclass(parent.table_name)
WHERE c.contype = 'f';

DO $$
DECLARE
    item RECORD;
    parent_key TEXT;
    was_required BOOLEAN;
BEGIN
    -- Abort instead of altering any unexpected external dependent tables.
    IF EXISTS (
        SELECT 1
        FROM dayflow_id_foreign_keys f
        WHERE NOT EXISTS (
            SELECT 1 FROM dayflow_id_tables t
            WHERE to_regclass(t.table_name) = f.child_table
        )
    ) THEN
        RAISE EXCEPTION 'Unexpected external foreign key references Dayflow tables';
    END IF;

    FOR item IN SELECT * FROM dayflow_id_foreign_keys LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',
            item.child_table, item.constraint_name);
    END LOOP;

    -- Remove old primary/composite unique keys before renaming their columns.
    FOR item IN
        SELECT c.conrelid::regclass AS table_name, c.conname
        FROM pg_constraint c
        JOIN dayflow_id_tables t
            ON c.conrelid = to_regclass(t.table_name)
        JOIN pg_attribute a
            ON a.attrelid = c.conrelid AND a.attname = 'id'
        WHERE c.contype IN ('p', 'u') AND a.attnum = ANY(c.conkey)
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',
            item.table_name, item.conname);
    END LOOP;

    FOR item IN SELECT * FROM dayflow_id_tables LOOP
        EXECUTE format('ALTER TABLE %I RENAME COLUMN id TO legacy_uuid',
            item.table_name);
        EXECUTE format('ALTER TABLE %I ALTER COLUMN legacy_uuid DROP NOT NULL',
            item.table_name);
        EXECUTE format('ALTER TABLE %I ADD UNIQUE (legacy_uuid)',
            item.table_name);
        EXECUTE format(
            'ALTER TABLE %I ADD COLUMN %I BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
            item.table_name, item.primary_column);
    END LOOP;

    FOR item IN SELECT * FROM dayflow_id_relations LOOP
        SELECT primary_column INTO STRICT parent_key
        FROM dayflow_id_tables WHERE table_name = item.parent_table;

        SELECT attnotnull INTO STRICT was_required
        FROM pg_attribute
        WHERE attrelid = to_regclass(item.child_table)
            AND attname = item.child_column;

        EXECUTE format('ALTER TABLE %I ADD COLUMN numeric_reference BIGINT',
            item.child_table);
        EXECUTE format(
            'UPDATE %I child SET numeric_reference = parent.%I
             FROM %I parent WHERE child.%I = parent.legacy_uuid',
            item.child_table, parent_key, item.parent_table, item.child_column);

        -- Fail transactionally if any reference could not be mapped.
        EXECUTE format(
            'SELECT EXISTS (SELECT 1 FROM %I
             WHERE %I IS NOT NULL AND numeric_reference IS NULL)',
            item.child_table, item.child_column) INTO was_required;
        IF was_required THEN
            RAISE EXCEPTION 'Unmapped reference %.%',
                item.child_table, item.child_column;
        END IF;

        SELECT attnotnull INTO STRICT was_required
        FROM pg_attribute
        WHERE attrelid = to_regclass(item.child_table)
            AND attname = item.child_column;
        EXECUTE format('ALTER TABLE %I DROP COLUMN %I',
            item.child_table, item.child_column);
        EXECUTE format('ALTER TABLE %I RENAME COLUMN numeric_reference TO %I',
            item.child_table, item.child_column);
        IF was_required THEN
            EXECUTE format('ALTER TABLE %I ALTER COLUMN %I SET NOT NULL',
                item.child_table, item.child_column);
        END IF;
    END LOOP;
END $$;

ALTER TABLE user_preferences ADD UNIQUE (user_id);
ALTER TABLE categories ADD UNIQUE (category_id, user_id);
ALTER TABLE tasks ADD UNIQUE (task_id, user_id);
ALTER TABLE recurring_rules ADD UNIQUE (task_id);
ALTER TABLE recurring_rules ADD UNIQUE (recurring_rule_id, user_id);
ALTER TABLE recurring_occurrences ADD UNIQUE (rule_id, occurrence_date);
ALTER TABLE recurring_occurrences ADD UNIQUE (recurring_occurrence_id, user_id);
ALTER TABLE focus_sessions ADD UNIQUE (user_id, client_id);

DO $$
DECLARE item RECORD;
BEGIN
    FOR item IN SELECT * FROM dayflow_id_foreign_keys LOOP
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s',
            item.child_table, item.constraint_name, item.definition);
    END LOOP;
END $$;

CREATE UNIQUE INDEX category_name_unique ON categories(user_id, lower(name));
CREATE INDEX task_user_status_due ON tasks(user_id, status, due_at);
CREATE INDEX planner_user_time ON planning_sessions(user_id, start_at, end_at);
CREATE INDEX focus_user_time ON focus_sessions(user_id, started_at);
