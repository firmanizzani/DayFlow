-- Order columns: identity primary key, foreign keys, data, timestamps, legacy UUID.
-- Preserve IDs, sequences, data, constraints and indexes transactionally.
SET LOCAL lock_timeout = '15s';

LOCK TABLE users, user_preferences, auth_refresh_tokens,
    password_reset_tokens, categories, tasks, subtasks,
    recurring_rules, recurring_occurrences, planning_sessions,
    focus_sessions IN ACCESS EXCLUSIVE MODE;

CREATE TEMP TABLE dayflow_layout_tables ON COMMIT DROP AS
SELECT c.oid AS table_oid, c.oid::regclass AS table_name, a.attnum AS pk_position
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_constraint pk ON pk.conrelid = c.oid AND pk.contype = 'p'
JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = pk.conkey[1]
WHERE n.nspname = current_schema()
    AND c.relname IN (
        'users', 'user_preferences', 'auth_refresh_tokens',
        'password_reset_tokens', 'categories', 'tasks', 'subtasks',
        'recurring_rules', 'recurring_occurrences', 'planning_sessions',
        'focus_sessions'
    );

CREATE TEMP TABLE dayflow_layout_constraints ON COMMIT DROP AS
SELECT c.conrelid::regclass AS table_name,
    c.conname AS constraint_name, c.contype AS kind,
    pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE c.contype IN ('f', 'u', 'c', 'x')
    AND (c.conrelid IN (SELECT table_oid FROM dayflow_layout_tables)
        OR c.confrelid IN (SELECT table_oid FROM dayflow_layout_tables));

CREATE TEMP TABLE dayflow_layout_indexes ON COMMIT DROP AS
SELECT i.indexrelid::regclass AS index_name,
    pg_get_indexdef(i.indexrelid) AS definition
FROM pg_index i
WHERE i.indrelid IN (SELECT table_oid FROM dayflow_layout_tables)
    AND NOT EXISTS (
        SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid
    );

CREATE TEMP TABLE dayflow_layout_metadata ON COMMIT DROP AS
SELECT t.table_name, t.table_oid, a.attname AS column_name,
    a.attnum AS position, format_type(a.atttypid, a.atttypmod) AS data_type,
    a.attnotnull AS required, a.attidentity, a.attgenerated,
    CASE
        WHEN a.attname = 'legacy_uuid' THEN 3
        WHEN EXISTS (
            SELECT 1 FROM pg_constraint fk
            WHERE fk.conrelid = t.table_oid AND fk.contype = 'f'
                AND a.attnum = ANY(fk.conkey)
        ) THEN 0
        WHEN a.atttypid IN ('timestamp'::regtype, 'timestamptz'::regtype) THEN 2
        ELSE 1
    END AS column_group,
    pg_get_expr(d.adbin, d.adrelid) AS default_value,
    col_description(t.table_oid, a.attnum) AS description,
    CASE WHEN a.attcollation <> 0 THEN
        format('%I.%I', ns.nspname, co.collname) END AS collation_name
FROM dayflow_layout_tables t
JOIN pg_attribute a ON a.attrelid = t.table_oid
LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
LEFT JOIN pg_collation co ON co.oid = a.attcollation
LEFT JOIN pg_namespace ns ON ns.oid = co.collnamespace
WHERE a.attnum > 0 AND NOT a.attisdropped AND a.attnum <> t.pk_position;

CREATE TEMP TABLE dayflow_layout_fingerprints (
    table_oid OID PRIMARY KEY,
    fingerprint TEXT NOT NULL
) ON COMMIT DROP;

DO $$
DECLARE
    item RECORD;
    column_item RECORD;
    digest TEXT;
    expected_columns TEXT[];
    actual_columns TEXT[];
BEGIN
    IF (SELECT count(*) FROM dayflow_layout_tables) <> 11 THEN
        RAISE EXCEPTION 'Expected all 11 application tables';
    END IF;
    IF EXISTS (
        SELECT 1 FROM dayflow_layout_constraints
        WHERE table_name::oid NOT IN (SELECT table_oid FROM dayflow_layout_tables)
    ) THEN
        RAISE EXCEPTION 'Unexpected external foreign key';
    END IF;
    IF EXISTS (
        SELECT 1 FROM dayflow_layout_metadata
        WHERE attidentity <> '' OR attgenerated <> ''
    ) THEN
        RAISE EXCEPTION 'Unexpected generated non-primary column';
    END IF;

    FOR item IN SELECT * FROM dayflow_layout_tables LOOP
        EXECUTE format(
            'SELECT md5(coalesce(string_agg(row_data, '''' ORDER BY row_data), ''''))
             FROM (SELECT to_jsonb(t)::text AS row_data FROM %s t) rows',
            item.table_name) INTO digest;
        INSERT INTO dayflow_layout_fingerprints VALUES (item.table_oid, digest);
    END LOOP;

    -- Foreign keys must be removed before the unique keys they reference.
    FOR item IN
        SELECT * FROM dayflow_layout_constraints ORDER BY (kind = 'f') DESC
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',
            item.table_name, item.constraint_name);
    END LOOP;
    FOR item IN SELECT * FROM dayflow_layout_indexes LOOP
        EXECUTE format('DROP INDEX %s', item.index_name);
    END LOOP;

    FOR column_item IN
        SELECT * FROM dayflow_layout_metadata
        ORDER BY table_oid, column_group,
            CASE WHEN column_group = 0 AND column_name = 'user_id' THEN 0 ELSE 1 END,
            position
    LOOP
        EXECUTE format('ALTER TABLE %s ADD COLUMN dayflow_reordered_column %s%s',
            column_item.table_name, column_item.data_type,
            CASE WHEN column_item.collation_name IS NULL THEN ''
                ELSE ' COLLATE ' || column_item.collation_name END);
        EXECUTE format('UPDATE %s SET dayflow_reordered_column = %I',
            column_item.table_name, column_item.column_name);
        EXECUTE format('ALTER TABLE %s DROP COLUMN %I',
            column_item.table_name, column_item.column_name);
        EXECUTE format('ALTER TABLE %s RENAME COLUMN dayflow_reordered_column TO %I',
            column_item.table_name, column_item.column_name);
        IF column_item.default_value IS NOT NULL THEN
            EXECUTE format('ALTER TABLE %s ALTER COLUMN %I SET DEFAULT %s',
                column_item.table_name, column_item.column_name,
                column_item.default_value);
        END IF;
        IF column_item.required THEN
            EXECUTE format('ALTER TABLE %s ALTER COLUMN %I SET NOT NULL',
                column_item.table_name, column_item.column_name);
        END IF;
        IF column_item.description IS NOT NULL THEN
            EXECUTE format('COMMENT ON COLUMN %s.%I IS %L',
                column_item.table_name, column_item.column_name,
                column_item.description);
        END IF;
    END LOOP;

    FOR item IN
        SELECT * FROM dayflow_layout_constraints ORDER BY (kind = 'f') ASC
    LOOP
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s',
            item.table_name, item.constraint_name, item.definition);
    END LOOP;
    FOR item IN SELECT * FROM dayflow_layout_indexes LOOP
        EXECUTE item.definition;
    END LOOP;

    FOR item IN SELECT * FROM dayflow_layout_tables LOOP
        EXECUTE format(
            'SELECT md5(coalesce(string_agg(row_data, '''' ORDER BY row_data), ''''))
             FROM (SELECT to_jsonb(t)::text AS row_data FROM %s t) rows',
            item.table_name) INTO digest;
        IF digest IS DISTINCT FROM (
            SELECT fingerprint FROM dayflow_layout_fingerprints
            WHERE table_oid = item.table_oid
        ) THEN
            RAISE EXCEPTION 'Column reordering changed data in %', item.table_name;
        END IF;
        IF EXISTS (
            SELECT 1 FROM pg_attribute
            WHERE attrelid = item.table_oid AND attnum > 0 AND NOT attisdropped
                AND attnum < item.pk_position
        ) THEN
            RAISE EXCEPTION 'Primary key is not first in %', item.table_name;
        END IF;
        SELECT array_agg(column_name ORDER BY column_group,
            CASE WHEN column_group = 0 AND column_name = 'user_id' THEN 0 ELSE 1 END,
            position)
        INTO expected_columns
        FROM dayflow_layout_metadata WHERE table_oid = item.table_oid;
        SELECT array_agg(attname::text ORDER BY attnum)
        INTO actual_columns
        FROM pg_attribute
        WHERE attrelid = item.table_oid AND attnum > 0 AND NOT attisdropped
            AND attnum <> item.pk_position;
        IF actual_columns IS DISTINCT FROM expected_columns THEN
            RAISE EXCEPTION 'Unexpected column layout in %', item.table_name;
        END IF;
    END LOOP;
END $$;
