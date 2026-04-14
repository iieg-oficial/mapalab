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
│   ├── routes/            # Endpoints de la API
│   ├── schemas/           # Modelos Pydantic/SQLModel
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
