-- PostgreSQL cannot ALTER a column's ordinal position directly.
-- Rebuild non-PK columns after the existing identity PK, in one transaction.
-- Keep table OIDs, identity sequences, IDs, data and all application constraints.
SET LOCAL lock_timeout = '15s';

LOCK TABLE users, user_preferences, auth_refresh_tokens,
    password_reset_tokens, categories, tasks, subtasks,
    recurring_rules, recurring_occurrences, planning_sessions,
    focus_sessions IN ACCESS EXCLUSIVE MODE;

CREATE TEMP TABLE dayflow_column_tables ON COMMIT DROP AS
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

CREATE TEMP TABLE dayflow_column_constraints ON COMMIT DROP AS
SELECT c.conrelid::regclass AS table_name,
    c.conname AS constraint_name, c.contype AS kind,
    pg_get_constraintdef(c.oid) AS definition
FROM pg_constraint c
WHERE c.contype IN ('f', 'u', 'c', 'x')
    AND (c.conrelid IN (SELECT table_oid FROM dayflow_column_tables)
        OR c.confrelid IN (SELECT table_oid FROM dayflow_column_tables));

CREATE TEMP TABLE dayflow_column_indexes ON COMMIT DROP AS
SELECT i.indexrelid::regclass AS index_name,
    pg_get_indexdef(i.indexrelid) AS definition
FROM pg_index i
WHERE i.indrelid IN (SELECT table_oid FROM dayflow_column_tables)
    AND NOT EXISTS (
        SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid
    );

CREATE TEMP TABLE dayflow_column_metadata ON COMMIT DROP AS
SELECT t.table_name, t.table_oid, a.attname AS column_name,
    a.attnum AS position, format_type(a.atttypid, a.atttypmod) AS data_type,
    a.attnotnull AS required, a.attidentity, a.attgenerated,
    pg_get_expr(d.adbin, d.adrelid) AS default_value,
    col_description(t.table_oid, a.attnum) AS description,
    CASE WHEN a.attcollation <> 0 THEN
        format('%I.%I', ns.nspname, co.collname) END AS collation_name
FROM dayflow_column_tables t
JOIN pg_attribute a ON a.attrelid = t.table_oid
LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
LEFT JOIN pg_collation co ON co.oid = a.attcollation
LEFT JOIN pg_namespace ns ON ns.oid = co.collnamespace
WHERE a.attnum > 0 AND NOT a.attisdropped AND a.attnum <> t.pk_position;

CREATE TEMP TABLE dayflow_column_fingerprints (
    table_oid OID PRIMARY KEY,
    fingerprint TEXT NOT NULL
) ON COMMIT DROP;

DO $$
DECLARE
    item RECORD;
    column_item RECORD;
    digest TEXT;
BEGIN
    IF (SELECT count(*) FROM dayflow_column_tables) <> 11 THEN
        RAISE EXCEPTION 'Expected all 11 application tables';
    END IF;
    IF EXISTS (
        SELECT 1 FROM dayflow_column_constraints
        WHERE table_name::oid NOT IN (SELECT table_oid FROM dayflow_column_tables)
    ) THEN
        RAISE EXCEPTION 'Unexpected external foreign key';
    END IF;
    IF EXISTS (
        SELECT 1 FROM dayflow_column_metadata
        WHERE attidentity <> '' OR attgenerated <> ''
    ) THEN
        RAISE EXCEPTION 'Unexpected generated non-primary column';
    END IF;

    FOR item IN SELECT * FROM dayflow_column_tables LOOP
        EXECUTE format(
            'SELECT md5(coalesce(string_agg(row_data, '''' ORDER BY row_data), ''''))
             FROM (SELECT to_jsonb(t)::text AS row_data FROM %s t) rows',
            item.table_name) INTO digest;
        INSERT INTO dayflow_column_fingerprints VALUES (item.table_oid, digest);
    END LOOP;

    -- Foreign keys must be removed before the unique keys they reference.
    FOR item IN
        SELECT * FROM dayflow_column_constraints ORDER BY (kind = 'f') DESC
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',
            item.table_name, item.constraint_name);
    END LOOP;
    FOR item IN SELECT * FROM dayflow_column_indexes LOOP
        EXECUTE format('DROP INDEX %s', item.index_name);
    END LOOP;

    FOR column_item IN
        SELECT * FROM dayflow_column_metadata
        ORDER BY table_oid, (column_name = 'legacy_uuid'), position
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
        SELECT * FROM dayflow_column_constraints ORDER BY (kind = 'f') ASC
    LOOP
        EXECUTE format('ALTER TABLE %s ADD CONSTRAINT %I %s',
            item.table_name, item.constraint_name, item.definition);
    END LOOP;
    FOR item IN SELECT * FROM dayflow_column_indexes LOOP
        EXECUTE item.definition;
    END LOOP;

    FOR item IN SELECT * FROM dayflow_column_tables LOOP
        EXECUTE format(
            'SELECT md5(coalesce(string_agg(row_data, '''' ORDER BY row_data), ''''))
             FROM (SELECT to_jsonb(t)::text AS row_data FROM %s t) rows',
            item.table_name) INTO digest;
        IF digest IS DISTINCT FROM (
            SELECT fingerprint FROM dayflow_column_fingerprints
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
    END LOOP;
END $$;
