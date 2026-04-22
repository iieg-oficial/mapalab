import os
from unittest.mock import MagicMock, patch

import pytest

os.environ.setdefault('ENVIRONMENT', 'testing')
os.environ.setdefault('DB_USER', 'test')
os.environ.setdefault('DB_PASSWORD', 'test')
os.environ.setdefault('DB_HOST', 'localhost')
os.environ.setdefault('DB_PORT', '5432')
os.environ.setdefault('DB_NAME', 'test_db')
os.environ.setdefault('CORS_ORIGINS', '[]')


@pytest.fixture
def mock_mapalab_db(monkeypatch):
    from app.databases.factory import DatabaseFactory

    mock_conn = MagicMock()
    session = MagicMock()
    mock_conn.get_session.return_value.__enter__.return_value = session
    mock_conn.get_session.return_value.__exit__.return_value = None
    monkeypatch.setattr(DatabaseFactory, 'get_connection', lambda _: mock_conn)
    return session


@pytest.fixture
def client():
    with patch('app.services.scheduler_service.SchedulerService.start_scheduler'), \
         patch('app.services.periodicity_service.PeriodicityService.ensure_schema'), \
         patch('app.databases.factory.DatabaseFactory.get_connection'):
        from fastapi.testclient import TestClient
        from app.server import app
        with TestClient(app) as c:
            yield c
