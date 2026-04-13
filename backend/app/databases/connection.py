from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from app.utils.logger import Logger

class PostgresConnection:
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.engine = create_engine(
            self.db_url,
            pool_pre_ping=True,
            pool_size=4,
            max_overflow=4,
        )
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    @contextmanager
    def get_session(self):
        session = self.SessionLocal()
        try:
            Logger.info(f"Conexión establecida con PostgreSQL: {self.db_url}")
            yield session
        except Exception as e:
            Logger.error(f"Error en la base de datos: {str(e)}")
            session.rollback()
            raise
        finally:
            session.close()
