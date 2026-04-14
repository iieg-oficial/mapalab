from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
from app.utils.logger import Logger

class PostgresConnection:
    def __init__(self, db_url: str, pool_size: int = 8, max_overflow: int = 8):
        self.db_url = db_url
        self.engine = create_engine(
            self.db_url,
            pool_pre_ping=True,
            pool_size=pool_size,
            max_overflow=max_overflow,
        )
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    @contextmanager
    def get_session(self):
        session = self.SessionLocal()
        try:
            yield session
        except Exception as e:
            Logger.error(f"Error en la base de datos: {str(e)}")
            session.rollback()
            raise
        finally:
            session.close()
