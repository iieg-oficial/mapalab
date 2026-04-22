import os
import threading
from typing import Iterator, Optional

from psycopg2 import sql
from sqlalchemy import text
from sqlalchemy.orm import Session

CHUNK_SIZE = 65536


class DownloadRepository:

    @staticmethod
    def resolve_db_name(session: Session, geoserver_key: str) -> Optional[tuple[str, str]]:
        result = session.execute(
            text(
                'SELECT layer_name_db FROM mapalab.layer_metadata '
                'WHERE layer_key = :key AND layer_name_db IS NOT NULL '
                "AND layer_name_db != '' LIMIT 1"
            ),
            {'key': geoserver_key},
        )
        row = result.scalar()
        if not row or '.' not in row:
            return None
        schema, table = row.split('.', 1)
        return (schema, table)

    @staticmethod
    def validate_table_exists(session: Session, schema: str, table: str) -> bool:
        result = session.execute(
            text(
                'SELECT 1 FROM pg_class c '
                'JOIN pg_namespace n ON n.oid = c.relnamespace '
                "WHERE c.relkind IN ('r','v','m') "
                'AND n.nspname = :schema AND c.relname = :table'
            ),
            {'schema': schema, 'table': table},
        )
        return result.scalar() is not None

    @staticmethod
    def stream_csv(
        session: Session,
        schema: str,
        table: str,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None,
    ) -> Iterator[bytes]:
        sa_conn = session.connection()
        raw_conn = sa_conn.connection.dbapi_connection
        cursor = raw_conn.cursor()

        query = sql.SQL('SELECT * FROM {}.{}').format(
            sql.Identifier(schema),
            sql.Identifier(table),
        )

        conditions = []
        if date_from:
            conditions.append(sql.SQL('fecha >= {}').format(sql.Literal(date_from)))
        if date_to:
            conditions.append(sql.SQL('fecha <= {}').format(sql.Literal(date_to)))

        if conditions:
            query = sql.SQL('{} WHERE {}').format(query, sql.SQL(' AND ').join(conditions))

        copy_sql = sql.SQL('COPY ({}) TO STDOUT WITH CSV HEADER').format(query)
        copy_str = copy_sql.as_string(cursor)

        read_fd, write_fd = os.pipe()
        read_file = os.fdopen(read_fd, 'rb')
        write_file = os.fdopen(write_fd, 'wb')
        error_holder = [None]

        def copy_worker():
            try:
                cursor.copy_expert(copy_str, write_file, size=CHUNK_SIZE)
            except Exception as e:
                error_holder[0] = e
            finally:
                write_file.close()
                cursor.close()

        thread = threading.Thread(target=copy_worker, daemon=True)
        thread.start()

        try:
            while True:
                chunk = read_file.read(CHUNK_SIZE)
                if not chunk:
                    break
                yield chunk
        finally:
            read_file.close()
            thread.join(timeout=10)

        if error_holder[0]:
            raise error_holder[0]
