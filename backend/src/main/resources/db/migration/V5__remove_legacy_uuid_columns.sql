-- UUID-to-numeric mappings have been verified; remove only the audit columns.
-- All current IDs, foreign keys, identity sequences and other data stay intact.
SET LOCAL lock_timeout = '15s';

LOCK TABLE users, user_preferences, auth_refresh_tokens,
    password_reset_tokens, categories, tasks, subtasks,
    recurring_rules, recurring_occurrences, planning_sessions,
    focus_sessions IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
    table_name TEXT;
    before_digest TEXT;
    after_digest TEXT;
BEGIN
    FOREACH table_name IN ARRAY ARRAY[
        'users', 'user_preferences', 'auth_refresh_tokens',
        'password_reset_tokens', 'categories', 'tasks', 'subtasks',
        'recurring_rules', 'recurring_occurrences', 'planning_sessions',
        'focus_sessions'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_attribute
            WHERE attrelid = to_regclass(table_name)
                AND attname = 'legacy_uuid' AND NOT attisdropped
                AND atttypid = 'uuid'::regtype
        ) THEN
            RAISE EXCEPTION 'Expected legacy UUID audit column in %', table_name;
        END IF;

        EXECUTE format(
            'SELECT md5(coalesce(string_agg(row_data, '''' ORDER BY row_data), ''''))
             FROM (SELECT (to_jsonb(t) - ''legacy_uuid'')::text AS row_data
                 FROM %I t) rows',
            table_name) INTO before_digest;

        -- RESTRICT is intentional: unexpected dependencies abort the transaction.
        EXECUTE format('ALTER TABLE %I DROP COLUMN legacy_uuid RESTRICT', table_name);

        EXECUTE format(
            'SELECT md5(coalesce(string_agg(row_data, '''' ORDER BY row_data), ''''))
             FROM (SELECT to_jsonb(t)::text AS row_data FROM %I t) rows',
            table_name) INTO after_digest;
        IF before_digest IS DISTINCT FROM after_digest THEN
            RAISE EXCEPTION 'Removing legacy UUID changed current data in %', table_name;
        END IF;
    END LOOP;
END $$;
