# MapaLab Backend

<img src="logo.svg" width="512"/>

## 📋 Descripción del Proyecto
Este proyecto pertenece al **Instituto de Información Estadística y Geográfica del Estado de Jalisco (IIEG)** y consiste en el **Backend API REST** para **MapaLab**.

La API está diseñada para proporcionar acceso programático a las bases de datos generadas en el IIEG, permitiendo que diversos productos como análisis estadísticos, páginas web, tableros interactivos y aplicaciones puedan consumir información de manera eficiente y estandarizada.

El sistema está construido con **FastAPI**, garantizando alto rendimiento, documentación automática y validación de datos mediante schemas tipados.

## 🚀 Tecnologías Utilizadas
- **[FastAPI](https://fastapi.tiangolo.com/)** - Framework web moderno y de alto rendimiento
- **[Uvicorn](https://www.uvicorn.org/)** - Servidor ASGI de alto rendimiento
- **[SQLModel](https://sqlmodel.tiangolo.com/)** - ORM con validación de tipos (SQLAlchemy + Pydantic)
- **[PostgreSQL](https://www.postgresql.org/)** - Base de datos principal
- **[Docker](https://www.docker.com/)** - Containerización y despliegue
- **[Python 3.12+](https://www.python.org/)** - Lenguaje de programación principal
- **[Pytest](https://pytest.org/)** - Framework de testing

## 📋 Prerrequisitos
Antes de comenzar, asegúrate de tener instalado:

1. **Python 3.12+** - [Descargar](https://www.python.org/downloads/)
2. **Conda** - [Descargar Miniconda](https://docs.conda.io/en/latest/miniconda.html) o [Anaconda](https://www.anaconda.com/products/distribution)
3. **Docker** - [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)
4. **Docker Compose** - (Incluido con Docker Desktop)
5. **PostgreSQL** - Requerido solo para desarrollo local sin Docker

## �️ Instalación

### Entorno de Desarrollo (Conda)

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd mapalab/backend
```

2. **Crear y activar ambiente virtual con Conda:**
```bash
# Crear ambiente con Python 3.12
conda create -n mapalab-backend python=3.12 -y

# Activar el ambiente
conda activate mapalab-backend
```

3. **Instalar dependencias:**
```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno:**
```bash
# Crear archivo .env en la raíz del proyecto
cp .env.example .env

# Editar .env con tus credenciales de base de datos
```

5. **Ejecutar el servidor de desarrollo:**
```bash
# Opción 1: Usar uvicorn directamente
uvicorn app.server:app --reload --host 0.0.0.0 --port 8000

# Opción 2: Usar fastapi dev (desarrollo)
fastapi dev app/server.py
```

6. **Acceder a la API:**
- API: http://localhost:8000
- Documentación interactiva (Swagger): http://localhost:8000/docs
- Documentación alternativa (ReDoc): http://localhost:8000/redoc

### Entorno de Producción/Pruebas (Docker)

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd mapalab/backend
```

2. **Configurar variables de entorno:**
```bash
# Crear archivo .env con las credenciales de la base de datos de producción
cp .env.example .env

# Editar .env con las credenciales de acceso a la base de datos del IIEG
# La API se conectará a la base de datos existente en modo solo lectura
```

3. **Construir la imagen Docker:**
```bash
# Construir la imagen
docker build -t mapalab-backend .
```

4. **Ejecutar el contenedor:**
```bash
# Ejecutar la API (asegúrate de tener configurado el archivo .env)
docker run -d \
  --name mapalab-backend \
  -p 8000:8000 \
  --env-file .env \
  mapalab-backend

# Ver logs del contenedor
docker logs -f mapalab-backend

# Detener el contenedor
docker stop mapalab-backend

# Eliminar el contenedor
docker rm mapalab-backend
```

5. **Acceder a la API:**
- API: http://localhost:8000
- Documentación interactiva: http://localhost:8000/docs

> **Nota:** Esta API se conecta a la base de datos de producción del IIEG en modo **solo lectura** para consultar indicadores. No es necesario levantar una base de datos de pruebas ya que el propósito es consumir datos existentes.

### Ejecución Simplificada con Docker Compose

#### 1. Desarrollo (Hot Reload)
```bash
docker compose up
```

#### 2. Producción (Optimizado)
```bash
docker compose -f docker-compose.prod.yaml up -d
```
> **Nota:** En producción, la documentación (`/docs`) está deshabilitada por defecto.

## 🏗️ Estructura del Proyecto
```
backend/
├── 📁 app/                      # Aplicación principal
│   ├── server.py                # Punto de entrada FastAPI
│   ├── config.py                # Configuraciones y variables de entorno
│   ├── 📁 consts/               # Constantes del proyecto
│   ├── 📁 databases/            # Conexiones a bases de datos
│   ├── 📁 exceptions/           # Excepciones personalizadas
│   ├── 📁 routes/               # Endpoints de la API
│   ├── 📁 schemas/              # Modelos Pydantic/SQLModel
│   ├── 📁 services/             # Lógica de negocio
│   └── 📁 utils/                # Utilidades comunes
│       └── logger.py            # Configuración de logging
├── 📁 test/                     # Pruebas unitarias y de integración
├── Dockerfile                   # Imagen Docker de la aplicación
├── requirements.txt             # Dependencias Python
├── .env.example                 # Variables de entorno (ejemplo)
└── README.md                    # Este archivo
```

## 🔌 Endpoints Principales
La API proporciona los siguientes endpoints base:

- `GET /` - Información de la API
- `GET /health` - Estado de salud del servicio
- `GET /docs` - Documentación interactiva Swagger UI
- `GET /redoc` - Documentación alternativa ReDoc

## 📝 Convención de Commits

Para mantener un historial de cambios limpio y consistente, sigue esta convención al hacer commits:

### Formato
```
[TAG] Mensaje descriptivo del commit.
```

### Tags Disponibles

| Tag | Descripción | Ejemplo |
|-----|-------------|---------|
| `[FEAT]` | Nueva funcionalidad o característica | `[FEAT] Agregar endpoint para consulta de indicadores económicos.` |
| `[FIX]` | Corrección de errores o bugs | `[FIX] Corregir validación de parámetros en endpoint de municipios.` |
| `[REFACTOR]` | Refactorización de código sin cambiar funcionalidad | `[REFACTOR] Reorganizar estructura de servicios de base de datos.` |
| `[DOCS]` | Cambios en documentación | `[DOCS] Actualizar README con instrucciones de despliegue.` |
| `[TEST]` | Agregar o modificar pruebas | `[TEST] Agregar pruebas unitarias para servicio de indicadores.` |
| `[CHORE]` | Tareas de mantenimiento, configuración, dependencias | `[CHORE] Actualizar dependencias en requirements.txt.` |

### Ejemplos de Buenos Commits
```bash
git commit -m "[FEAT] Implementar endpoint GET /api/v1/indicadores/economicos."
git commit -m "[FIX] Resolver error 500 en consulta de datos municipales."
git commit -m "[DOCS] Agregar documentación de endpoints."
git commit -m "[REFACTOR] Separar lógica de negocio en capa de servicios."
git commit -m "[TEST] Agregar pruebas para validación de datos de salida."
git commit -m "[CHORE] Actualizar FastAPI a versión x.yyy.zz."
```

---

**Desarrollado con ❤️ por el equipo de Desarrollo del IIEG**
