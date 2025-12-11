from app.databases.factory import DatabaseFactory
from app.consts.databases import DatabaseType
from app.repositories.mapalab_repository import MapalabRepository
from app.utils.logger import Logger
from datetime import date

def test_get_all_layers():
    Logger.info("Test 1: Get all layers (page 1)")
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        results, total = MapalabRepository.get_layers(session, page=1, size=10)
        Logger.info(f"Total layers: {total}")
        for layer in results:
            Logger.info(f"- {layer.nombre} ({layer.municipio})")

def test_pagination():
    Logger.info("Test 2: Pagination (page 2, size 5)")
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        results, total = MapalabRepository.get_layers(session, page=2, size=5)
        Logger.info(f"Total: {total}, Page 2 results: {len(results)}")
        for layer in results:
            Logger.info(f"- ID: {layer.id} - {layer.nombre}")

def test_filter_by_keyword():
    Logger.info("Test 3: Filter by keyword 'forestal'")
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        results, total = MapalabRepository.get_layers(
            session,
            keyword="forestal"
        )
        Logger.info(f"Results found: {total}")
        for layer in results:
            Logger.info(f"- {layer.nombre}")

def test_filter_by_municipality():
    Logger.info("Test 4: Filter by municipality 'Guadalajara'")
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        results, total = MapalabRepository.get_layers(
            session,
            municipality="Guadalajara"
        )
        Logger.info(f"Results found: {total}")
        for layer in results:
            Logger.info(f"- {layer.nombre} - {layer.municipio}")

def test_filter_by_date_range():
    Logger.info("Test 5: Filter by date range (2024-01-01 to 2024-06-30)")
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        results, total = MapalabRepository.get_layers(
            session,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 6, 30)
        )
        Logger.info(f"Results found: {total}")
        for layer in results:
            Logger.info(f"- {layer.nombre} - {layer.fecha_publicacion}")

def test_combined_filters():
    Logger.info("Test 6: Combined filters (keyword='ambiente' + municipality='Zapopan')")
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        results, total = MapalabRepository.get_layers(
            session,
            keyword="ambiente",
            municipality="Zapopan"
        )
        Logger.info(f"Results found: {total}")
        for layer in results:
            Logger.info(f"- {layer.nombre} - {layer.tematica} - {layer.municipio}")

def test_get_layer_by_id():
    Logger.info("Test 7: Get layer by ID (id=1)")
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer = MapalabRepository.get_layer_by_id(session, layer_id=1)
        if layer:
            Logger.info(f"Layer found: {layer.nombre}")
            Logger.info(f"- URL: {layer.url}")
            Logger.info(f"- Theme: {layer.tematica}")
            Logger.info(f"- Municipality: {layer.municipio}")
        else:
            Logger.warning("Layer not found")

def test_get_layer_by_invalid_id():
    Logger.info("Test 8: Get layer by invalid ID (id=99999)")
    conn = DatabaseFactory.get_connection(DatabaseType.MAPALAB)
    with conn.get_session() as session:
        layer = MapalabRepository.get_layer_by_id(session, layer_id=99999)
        if layer:
            Logger.error("Layer should not exist!")
        else:
            Logger.info("Correctly returned None for non-existent layer")

if __name__ == "__main__":
    test_get_all_layers()
    test_pagination()
    test_filter_by_keyword()
    test_filter_by_municipality()
    test_filter_by_date_range()
    test_combined_filters()
    test_get_layer_by_id()
    test_get_layer_by_invalid_id()
