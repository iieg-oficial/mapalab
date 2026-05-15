# Backend - Detalles Tecnicos

## Stack

- **[FastAPI](https://fastapi.tiangolo.com/)** - Framework web
- **[Uvicorn](https://www.uvicorn.org/)** - Servidor ASGI (desarrollo)
- **[Gunicorn](https://gunicorn.org/)** - Servidor WSGI (produccion)
- **[SQLModel](https://sqlmodel.tiangolo.com/)** - ORM (SQLAlchemy + Pydantic)
- **[PostgreSQL](https://www.postgresql.org/)** - Base de datos
- **[Python 3.12+](https://www.python.org/)**

## Estructura del Proyecto

```
backend/
├── app/
│   ├── server.py          # Punto de entrada FastAPI
│   ├── config.py          # Configuraciones y variables de entorno
│   ├── consts/            # Constantes del proyecto
│   ├── databases/         # Conexiones a bases de datos
│   ├── exceptions/        # Excepciones personalizadas
│   ├── routers/           # Endpoints de la API
│   ├── schemas/           # Modelos Pydantic/SQLModel
│   ├── models/            # Modelos SQLAlchemy
│   ├── repositories/      # Acceso a datos
│   ├── services/          # Logica de negocio
│   └── utils/             # Utilidades comunes
│       └── logger.py      # Configuracion de logging
├── test/                  # Pruebas unitarias y de integracion
├── Dockerfile             # Imagen Docker (targets: development/production)
└── requirements.txt       # Dependencias Python
```

## Endpoints Principales

- `GET /` - Informacion de la API
- `GET /health` - Estado de salud del servicio
- `GET /docs` - Swagger UI (solo en desarrollo)
- `GET /redoc` - ReDoc (solo en desarrollo)

### Capas (v1.4.0+)

- `GET /layers/tree` - Arbol completo, ETag, 304 con If-None-Match
- `GET /layers/initial-order` - Capas activas al cargar
- `GET /layers/workspaces` - Lista de workspaces
- `GET /layers/search?q=X` - Busqueda por tags/label/id
- `POST /layers/refresh-cache` - Reconstruye materializacion. **Requiere `X-Internal-Token` desde 1.28.5** (`MAPALAB_INTERNAL_TOKEN`, ver `app/auth/internal_token.py`). Usado por mariachi al editar capas via `iieg-network`.
- `POST /layers/invalidate-cache` - Solo invalida cache de memoria del proceso. **Requiere `X-Internal-Token` desde 1.28.5**.

### Metadata (v1.4.0+)

- `GET /metadata/?workspace=X&layer=Y` - Lee exclusivamente de `mapalab.layer_metadata` + `mapalab.layer_stats` (fallback legacy `public.mapalab_card` eliminado en v1.7.0).
- `GET /metadata/sources?layers=w:l,w:l` - Fuentes por lotes.

Edicion de metadata: via mariachi `/administrador/mapalab/layers` → `PUT /api/administrador/layer-metadata/{layer_key}`.

### Observabilidad (v1.7.0+)

- `GET /metrics` - Formato Prometheus plain text. Contadores: `mapalab_tree_requests_total`, `mapalab_tree_cache_hits_total`, `mapalab_tree_refresh_total`, `mapalab_search_requests_total`, `mapalab_download_requests_total`.
- Consumido por `huachicol` (stack IIEG de monitoreo) vía target `MAPALAB_BACKEND_TARGET`.
- Implementacion: `app/metrics.py` (`defaultdict[str, int]` + `threading.Lock`, sin dependencias nuevas).

## Desarrollo Local sin Docker

```bash
# Crear ambiente con Conda
conda create -n mapalab-backend python=3.12 -y
conda activate mapalab-backend

# Instalar dependencias
cd backend
pip install -r requirements.txt

# Configurar variables de entorno
# Crear backend/.env con las variables necesarias (ver .env.example raiz)

# Ejecutar servidor
uvicorn app.server:app --reload --host 0.0.0.0 --port 8000

# Acceder a:
# API:  http://localhost:8000
# Docs: http://localhost:8000/docs
```

## Dockerfile con Targets

El Dockerfile usa multi-stage builds con dos targets:

- **development**: Uvicorn con `--reload` para hot-reload
- **production**: Gunicorn con workers UvicornWorker (configurable via `GUNICORN_WORKERS`, default 8)

El target se selecciona via la variable `BACKEND_TARGET` en el docker-compose.
Pool de conexiones configurable via `DB_POOL_SIZE` y `DB_MAX_OVERFLOW` (default 8 cada uno).
