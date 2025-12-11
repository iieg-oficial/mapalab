from app.databases.factory import DatabaseFactory
from app.consts.databases import DatabaseType
from sqlalchemy import text

def test_query():
    conn = DatabaseFactory.get_connection(DatabaseType.ENOE)
    with conn.get_session() as session:
        result = session.execute(text("SELECT NOW()"))
        for row in result:
            print("Hora actual en PostgreSQL:", row)