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

_CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS public.layer_periodicity (
    layer_key TEXT PRIMARY KEY,
    periodicity JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
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
        periodicity JSONB NOT NULL
    ) ON COMMIT DROP;

    FOR rec IN
        SELECT n.nspname AS schema_name, c.relname AS table_name,
               t.typname AS col_type
        FROM pg_attribute a
        JOIN pg_class c ON c.oid = a.attrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_type t ON t.oid = a.atttypid
        WHERE a.attname = 'fecha'
          AND a.attnum > 0
          AND c.relkind IN ('r', 'm', 'v')
          AND n.nspname != ALL(exclude_schemas)
        ORDER BY n.nspname, c.relname
    LOOP
        BEGIN
            IF rec.col_type IN ('date', 'timestamp', 'timestamptz') THEN
                fecha_expr := 'fecha';
            ELSE
                fecha_expr := 'fecha::date';
            END IF;

            dyn_sql := format(
                'WITH dates AS (
                    SELECT DISTINCT
                        EXTRACT(YEAR FROM %s)::int AS y,
                        EXTRACT(MONTH FROM %s)::int AS m,
                        EXTRACT(DAY FROM %s)::int AS d
                    FROM %I.%I
                    WHERE fecha IS NOT NULL
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
                rec.schema_name, rec.table_name
            );

            EXECUTE dyn_sql INTO result;

            IF result IS NOT NULL THEN
                INSERT INTO _periodicity_batch (layer_key, periodicity)
                VALUES (rec.schema_name || ':' || rec.table_name, result);
            END IF;

        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Error processing %.%: %', rec.schema_name, rec.table_name, SQLERRM;
        END;
    END LOOP;

    DELETE FROM public.layer_periodicity;
    INSERT INTO public.layer_periodicity (layer_key, periodicity, updated_at)
    SELECT layer_key, periodicity, now()
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
