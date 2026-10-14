from typing import Optional, Dict, List

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.consts.databases import DatabaseType
from app.consts.workspaces import resolve_schema
from app.databases.factory import DatabaseFactory
from app.models.layer import Layer, Workspace
from app.utils.logger import Logger


def _resolve_layer_key(session: Session, workspace: str, layer: str) -> str:
    ws_name = workspace
    ws = session.query(Workspace).filter(Workspace.alias == workspace).first()
    if ws:
        ws_name = ws.db_schema or ws.geoserver_workspace
    else:
        ws_name = resolve_schema(workspace) or workspace
    row = (
        session.query(Layer)
        .filter(Layer.workspace_alias == workspace, Layer.id == layer)
        .first()
    )
    if row and row.geoserver_layer:
        return f"{ws_name}:{row.geoserver_layer}"
    return f"{ws_name}:{layer}"

DEFAULT_DATE_COLUMN = "fecha"

_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS public.layer_periodicity (
    layer_key TEXT PRIMARY KEY,
    periodicity JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.layer_periodicity ADD COLUMN IF NOT EXISTS date_column TEXT NOT NULL DEFAULT 'fecha';
"""

_CREATE_FUNCTION_SQL = """
CREATE OR REPLACE FUNCTION public.refresh_layer_periodicity()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    rec RECORD;
    dyn_sql TEXT;
    fecha_expr TEXT;
    result JSONB;
    exclude_schemas TEXT[] := ARRAY[
        'information_schema', 'pg_catalog', 'pg_toast',
        'tiger', 'tiger_data', 'topology', 'ogr_system_tables',
        'prueba', 'public', 'raster'
    ];
BEGIN
    CREATE TEMP TABLE _periodicity_batch (
        layer_key TEXT PRIMARY KEY,
        periodicity JSONB NOT NULL,
        date_column TEXT NOT NULL
    ) ON COMMIT DROP;

    FOR rec IN
        WITH candidates AS (
            SELECT n.nspname AS schema_name, c.relname AS table_name,
                   a.attname AS column_name, t.typname AS col_type,
                   coalesce(col_description(c.oid, a.attnum), '') ILIKE '%mapalab:fecha%' AS by_comment,
                   a.attname = 'fecha' AS by_name
            FROM pg_attribute a
            JOIN pg_class c ON c.oid = a.attrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            JOIN pg_type t ON t.oid = a.atttypid
            WHERE a.attnum > 0
              AND NOT a.attisdropped
              AND c.relkind IN ('r', 'm', 'v')
              AND n.nspname != ALL(exclude_schemas)
        )
        SELECT DISTINCT ON (schema_name, table_name) schema_name, table_name, column_name, col_type
        FROM candidates
        WHERE by_comment OR by_name
        ORDER BY schema_name, table_name, by_comment DESC, column_name
    LOOP
        BEGIN
            IF rec.col_type IN ('date', 'timestamp', 'timestamptz') THEN
                fecha_expr := format('%I', rec.column_name);
            ELSE
                fecha_expr := format('%I::date', rec.column_name);
            END IF;

            dyn_sql := format(
                'WITH dates AS (
                    SELECT DISTINCT
                        EXTRACT(YEAR FROM %s)::int AS y,
                        EXTRACT(MONTH FROM %s)::int AS m,
                        EXTRACT(DAY FROM %s)::int AS d
                    FROM %I.%I
                    WHERE %I IS NOT NULL
                ),
                by_month AS (
                    SELECT y, m, jsonb_agg(d ORDER BY d) AS days
                    FROM dates GROUP BY y, m
                ),
                by_year AS (
                    SELECT y, jsonb_object_agg(m::text, days ORDER BY m) AS months
                    FROM by_month GROUP BY y
                )
                SELECT jsonb_object_agg(y::text, months ORDER BY y) FROM by_year',
                fecha_expr, fecha_expr, fecha_expr,
                rec.schema_name, rec.table_name, rec.column_name
            );

            EXECUTE dyn_sql INTO result;

            IF result IS NOT NULL THEN
                INSERT INTO _periodicity_batch (layer_key, periodicity, date_column)
                VALUES (rec.schema_name || ':' || rec.table_name, result, rec.column_name);
            END IF;

        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error processing %.%: %', rec.schema_name, rec.table_name, SQLERRM;
        END;
    END LOOP;

    DELETE FROM public.layer_periodicity;
    INSERT INTO public.layer_periodicity (layer_key, periodicity, date_column, updated_at)
    SELECT layer_key, periodicity, date_column, now()
    FROM _periodicity_batch;
END;
$$;
"""


class PeriodicityService:

    @staticmethod
    def ensure_schema() -> None:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            session.execute(text(_CREATE_TABLE_SQL))
            session.execute(text(_CREATE_FUNCTION_SQL))
            session.commit()

            count = session.execute(
                text("SELECT count(*) FROM public.layer_periodicity")
            ).scalar()
            if count == 0:
                Logger.info("layer_periodicity is empty, running initial refresh")
                session.execute(text("SELECT public.refresh_layer_periodicity()"))
                session.commit()

            Logger.info("layer_periodicity schema ready")

    @staticmethod
    def refresh() -> None:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            session.execute(text("SELECT public.refresh_layer_periodicity()"))
            session.commit()
            Logger.info("layer_periodicity refreshed successfully")

    @staticmethod
    def get_periodicity(workspace: str, layer: str) -> Optional[dict]:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            layer_key = _resolve_layer_key(session, workspace, layer)
            result = session.execute(
                text("SELECT periodicity FROM public.layer_periodicity WHERE layer_key = :key"),
                {"key": layer_key}
            ).scalar()
            return result

    @staticmethod
    def get_date_column(workspace: str, layer: str) -> str:
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            layer_key = _resolve_layer_key(session, workspace, layer)
            result = session.execute(
                text("SELECT date_column FROM public.layer_periodicity WHERE layer_key = :key"),
                {"key": layer_key}
            ).scalar()
            return result or DEFAULT_DATE_COLUMN

    @staticmethod
    def get_date_columns(layer_keys: List[str]) -> Dict[str, str]:
        if not layer_keys:
            return {}
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            resolved: Dict[str, str] = {}
            for raw in layer_keys:
                if ":" in raw:
                    ws, _, ly = raw.partition(":")
                    resolved[raw] = _resolve_layer_key(session, ws, ly)
                else:
                    resolved[raw] = raw
            rows = session.execute(
                text("SELECT layer_key, date_column FROM public.layer_periodicity WHERE layer_key = ANY(:keys)"),
                {"keys": list(set(resolved.values()))}
            ).fetchall()
            found = {row[0]: row[1] for row in rows}
            return {raw: found[key] for raw, key in resolved.items() if key in found}

    @staticmethod
    def get_periodicities_batch(layer_keys: List[str]) -> Dict[str, Optional[dict]]:
        if not layer_keys:
            return {}
        conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
        with conn.get_session() as session:
            resolved: Dict[str, str] = {}
            for raw in layer_keys:
                if ":" in raw:
                    ws, _, ly = raw.partition(":")
                    resolved[raw] = _resolve_layer_key(session, ws, ly)
                else:
                    resolved[raw] = raw
            unique_keys = list({k for k in resolved.values()})
            rows = session.execute(
                text("SELECT layer_key, periodicity FROM public.layer_periodicity WHERE layer_key = ANY(:keys)"),
                {"keys": unique_keys}
            ).fetchall()
            found = {row[0]: row[1] for row in rows}
            return {raw: found.get(resolved[raw]) for raw in layer_keys}
