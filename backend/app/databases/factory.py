import os
from app.databases.connection import PostgresConnection
from app.consts.databases import DatabaseType
from app.config import settings

class DatabaseFactory:

    @staticmethod
    def _resolve_db_name(db_type: DatabaseType) -> str:
        override = os.getenv(f"{db_type.name}_DB_NAME")
        if override:
            return override

        if settings.DB_NAME:
            return settings.DB_NAME

        return db_type.value

    @staticmethod
    def _build_db_url(db_type: DatabaseType) -> str:
        user = settings.DB_USER
        password = settings.DB_PASSWORD
        host = settings.DB_HOST
        port = settings.DB_PORT
        db_name = DatabaseFactory._resolve_db_name(db_type)
        return f"postgresql://{user}:{password}@{host}:{port}/{db_name}"

    @staticmethod
    def get_connection(db_type: DatabaseType) -> PostgresConnection:
        db_url = DatabaseFactory._build_db_url(db_type)
        return PostgresConnection(db_url)
