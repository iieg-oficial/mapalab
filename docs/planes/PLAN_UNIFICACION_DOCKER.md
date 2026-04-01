# Plan de Unificacion: Docker Compose, Variables de Entorno y Documentacion

## Aclaraciones del Equipo

Antes del analisis, estas son decisiones ya tomadas:

- **GeoServer:** No se maneja en este repositorio. El proxy a `/geoserver/` lo maneja el **gateway en produccion** y funciona correctamente. No se necesita agregar al `nginx.conf` de este proyecto.
- **`network_mode: host`:** Se mantiene en dev. Todos los desarrolladores usan Linux.
- **CORS `["*"]`:** Es para testing/staging, no para produccion real. En produccion real se configura en el gateway.
- **Credenciales en `.env`:** Son credenciales de dev/testing. El entorno de "produccion" en este repo es realmente staging para aprobar el despliegue antes del deploy final.
- **`backend/.gitignore` con `*.txt`:** `requirements.txt` ya esta versionado (se agrego con force). Se agregara `!requirements.txt` para dejarlo explicito y protegido.

---

## Estado Actual

### Estructura de archivos distribuida

```
mapalab/
├── Makefile                          # Orquestador principal
├── .gitignore                        # Ignora *.env* excepto .env.example
│
├── frontend/
│   ├── docker-compose.dev.yml        # Solo frontend dev (Vite)
│   ├── Dockerfile.dev
│   ├── .env.example                  # Template produccion
│   ├── .env.development.example      # Template desarrollo
│   ├── .env.development              # (gitignored) Valores dev reales
│   ├── .env.production               # (gitignored) Valores prod reales
│   ├── README.md                     # 312 lineas, incluye info de backend y nginx
│   └── .gitignore
│
├── backend/
│   ├── docker-compose.yaml           # Solo backend dev (Uvicorn --reload)
│   ├── docker-compose.prod.yaml      # Solo backend prod (Gunicorn)
│   ├── Dockerfile                    # Dev
│   ├── Dockerfile.prod               # Prod
│   ├── .env.example                  # Template unico
│   ├── .env.development              # (gitignored)
│   ├── .env.production               # (gitignored)
│   ├── .env                          # (gitignored) Copia activa de dev o prod
│   ├── README.md                     # 199 lineas
│   └── .gitignore
│
├── nginx/
│   ├── docker-compose.yml            # Solo nginx (produccion/staging)
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   ├── .env                          # (gitignored)
│   └── README.md                     # 198 lineas
│
└── (No existe README raiz, CONTRIBUTING, CHANGELOG, ni CODE_OF_CONDUCT)
```

**Total: 4 docker-compose files, 8 archivos .env (entre examples y reales), 3 READMEs separados, 0 documentos de proyecto raiz.**

---

## Problemas Identificados

### 1. Docker Compose fragmentado (4 archivos en 3 directorios)

| Archivo | Servicio | Modo |
|---------|----------|------|
| `frontend/docker-compose.dev.yml` | frontend | dev |
| `backend/docker-compose.yaml` | backend | dev |
| `backend/docker-compose.prod.yaml` | backend | staging/prod |
| `nginx/docker-compose.yml` | nginx | staging/prod |

**Problemas:**
- El Makefile debe hacer `cd` a cada directorio para levantar cada servicio por separado.
- No hay una vista unica de todos los servicios. Cada compose define su propia red `mapalab-network` como `external: true`, lo cual requiere crearla manualmente antes (via `make network-create`).
- Los nombres de archivo son inconsistentes: `docker-compose.dev.yml` vs `docker-compose.yaml` vs `docker-compose.prod.yaml` vs `docker-compose.yml`.
- No se puede hacer `docker compose ps` para ver todos los servicios juntos.
- `docker compose logs -f` en el Makefile combina archivos con `-f` flag pero desde directorios distintos, lo cual es fragil.

### 2. Variables de entorno dispersas y con patron fragil

**Patron actual del backend (fragil):**
```
make dev  → cp .env.development .env → docker compose up (lee .env)
make prod → cp .env.production .env  → docker compose up (lee .env)
```
- Se copia el archivo correcto a `.env` cada vez que se cambia de modo. Si alguien olvida hacer `make` y levanta manualmente, puede usar el `.env` del modo anterior.
- El `docker-compose.yaml` del backend usa `env_file: .env` sin distinguir entorno.

**Variables duplicadas entre servicios:**
- `NETWORK_NAME` aparece en: `backend/.env.*`, `nginx/.env`, `frontend/.env.development`
- `BACKEND_PORT` en backend env, pero tambien referenciado indirectamente en frontend como `BACKEND_DEV_TARGET`

**Inconsistencia de templates .env.example:**
- Frontend tiene 2 examples: `.env.example` (prod) y `.env.development.example` (dev)
- Backend tiene 1 example: `.env.example` (generico)
- Nginx tiene 1 example: `.env.example`
- No hay un `.env.example` raiz que muestre todas las variables del sistema

### 3. Inconsistencia de networking entre dev y staging

| Aspecto | Desarrollo | Staging/Prod |
|---------|------------|--------------|
| Backend network | `network_mode: host` | `mapalab-network` (bridge) |
| Backend port | 8001 (en .env) | 8000 (hardcoded en Dockerfile) |
| Frontend acceso a backend | `host.docker.internal:8001` via proxy Vite | Nginx proxy `/api/` → `backend:8000` |
| GeoServer | `host.docker.internal:8080` via proxy Vite | Manejado por gateway externo |

### 4. READMEs con informacion duplicada y sin documentos de proyecto

- `frontend/README.md` (312 lineas): Incluye instrucciones de configuracion del backend y nginx.
- `backend/README.md` (199 lineas): Repite info de Docker y estructura.
- `nginx/README.md` (198 lineas): Documenta rutas que maneja el gateway, no este nginx.
- No hay un README raiz que de una vision general del proyecto.
- No existen: `CONTRIBUTING.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`.

**Duplicacion:** Las instrucciones de `make dev` y `make prod` estan tanto en `frontend/README.md` como implicitas en cada README individual.

### 5. Puerto por defecto de Nginx inconsistente

- `nginx/.env.example`: `NGINX_PORT=3006`
- `nginx/.env` (actual): `NGINX_PORT=8081`
- Makefile default: `3006`
- `docker-compose.yml` default: `${NGINX_PORT:-3006}`

### 6. Backend .gitignore con patron demasiado amplio

```gitignore
*.sh
*.txt
```

`requirements.txt` esta versionado via `git add -f`, pero el patron `*.txt` podria causar que futuros archivos `.txt` se ignoren silenciosamente. Se necesita agregar `!requirements.txt` explicitamente.

---

## Plan de Unificacion

### Fase 1: Docker Compose unico en la raiz

**Objetivo:** Un solo `docker-compose.yml` en la raiz con profiles para dev/staging.

**Resultado esperado:**
```
mapalab/
├── docker-compose.yml          # NUEVO: Todos los servicios
├── docker-compose.override.yml # NUEVO: Overrides para desarrollo (auto-loaded)
├── .env.example                # NUEVO: Todas las variables del sistema
├── .env                        # (gitignored) Variables activas
```

**Estructura propuesta de `docker-compose.yml`:**

```yaml
name: mapalab

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    profiles: ["dev"]
    volumes:
      - ./frontend/src:/app/src:ro
      - ./frontend/public:/app/public:ro
      - ./frontend/index.html:/app/index.html:ro
      - ./frontend/vite.config.js:/app/vite.config.js:ro
      - ./frontend/vitest.config.js:/app/vitest.config.js:ro
      - frontend-node-modules:/app/node_modules
    ports:
      - "${FRONTEND_PORT:-5173}:${VITE_PORT:-5173}"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: ${BACKEND_DOCKERFILE:-Dockerfile}
    extra_hosts:
      - "host.docker.internal:host-gateway"
    restart: unless-stopped

  nginx:
    build:
      context: ./nginx
    profiles: ["staging"]
    ports:
      - "${NGINX_PORT:-3006}:80"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  frontend-node-modules:

networks:
  default:
    name: mapalab-network
```

**`docker-compose.override.yml` (auto-cargado en dev):**

```yaml
services:
  backend:
    command: uvicorn app.server:app --host 0.0.0.0 --port ${BACKEND_PORT:-8000} --reload
    network_mode: host
    volumes:
      - ./backend/app:/app/app
    tty: true
```

**Ventajas:**
- `docker compose --env-file .env.development --profile dev up` levanta frontend + backend con hot-reload
- `docker compose --env-file .env.staging --profile staging up` levanta nginx + backend con Gunicorn
- Ambos entornos pueden correr simultaneamente (puertos distintos)
- `docker compose ps` muestra todo
- `docker compose logs -f` funciona sin hacks
- Red se crea automaticamente (ya no necesita `make network-create` previo)

**Tareas:**
- [ ] Crear `docker-compose.yml` raiz con profiles
- [ ] Crear `docker-compose.override.yml` para dev overrides (mantener `network_mode: host`)
- [ ] Actualizar Makefile para usar compose raiz en vez de `cd` por directorio
- [ ] Eliminar los 4 docker-compose antiguos una vez validado
- [ ] Actualizar `.dockerignore` en cada subdirectorio si es necesario

### Fase 2: Variables de entorno centralizadas

**Objetivo:** Un `.env.example` raiz como template y archivos `.env.development` / `.env.staging` separados para poder correr ambos entornos simultaneamente.

**Archivos resultantes:**
```
mapalab/
├── .env.example          # Template versionado con placeholders
├── .env.development      # (gitignored) Valores de desarrollo
├── .env.staging          # (gitignored) Valores de staging
├── .env.production       # (gitignored) Valores de produccion real
```

**Propuesta de `.env.example` raiz:**

```env
# ============================================
# MapaLab - Variables de Entorno
# ============================================
# Copia este archivo segun tu entorno:
#   cp .env.example .env.development   (y ajusta valores de dev)
#   cp .env.example .env.staging       (y ajusta valores de staging)
#   cp .env.example .env.production    (y ajusta valores de produccion real)

# --- General ---
NETWORK_NAME=mapalab-network

# --- Frontend ---
VITE_PORT=<5173|3006>
FRONTEND_PORT=<5173|3006>
VITE_BACKEND_API_HOST=</api/|/mapalab/api/>
VITE_GEOSERVER_URL=/geoserver/
VITE_BASE_PATH=</|/mapalab/>
VITE_SITE_URL=<http://localhost:5173|https://dominio>
VITE_NODE_ENV=<development|production>
VITE_APP_ENV=<dev|beta>
# VITE_GTM_ID=                          # Solo produccion real
# VITE_GOOGLE_ANALYTICS_ID=             # Solo produccion real

# Proxies de desarrollo (solo Vite dev server, no se exponen al browser)
# Dejar vacias o eliminar en staging
GEOSERVER_DEV_TARGET=http://host.docker.internal:8080
BACKEND_DEV_TARGET=http://host.docker.internal:8001

# --- Backend ---
ENVIRONMENT=<development|production>
DEBUG=<True|False>
CORS_ORIGINS=["*"]
LOG_LEVEL=<DEBUG|INFO>
BACKEND_PORT=<8001|8000>
BACKEND_DOCKERFILE=<Dockerfile|Dockerfile.prod>

GEOSERVER_URL=<http://localhost:8080/geoserver/|http://host.docker.internal:8080/geoserver/>
GEOSERVER_USER=<YOUR_GEOSERVER_USER>
GEOSERVER_PASSWORD=<YOUR_GEOSERVER_PASSWORD>

DB_USER=<YOUR_DB_USER>
DB_PASSWORD=<YOUR_DB_PASSWORD>
DB_HOST=<localhost|host.docker.internal>
DB_PORT=5432
DB_NAME=<YOUR_DB_NAME>

ACERVO_PUBLIC_URL=https://<APP_DOMAIN>/acervo

# --- Nginx (solo staging) ---
NGINX_PORT=3006
```

**Uso en Makefile (ya no se copia a .env):**
```makefile
dev:
	docker compose --env-file .env.development --profile dev up -d

staging:
	docker compose --env-file .env.staging --profile staging up -d

prod:
	docker compose --env-file .env.production --profile staging up -d
```

> Nota: `staging` y `prod` usan el mismo profile de compose (mismos servicios: nginx + backend gunicorn), solo cambian las variables de entorno (URLs, credenciales, CORS, etc.).

**Tareas:**
- [ ] Crear `.env.example` raiz consolidado con opciones dev|staging documentadas
- [ ] Verificar que el backend lee variables con los mismos nombres (o adaptar `app/config.py`)
- [ ] Verificar que `--env-file` en compose alimente correctamente a cada servicio
- [ ] Frontend: ajustar `Dockerfile.dev` y vite config para usar variables del `.env` raiz
- [ ] Validar que las variables `VITE_*` se inyectan correctamente al frontend container
- [ ] Eliminar `.env.example` de cada subdirectorio una vez validado
- [ ] Actualizar `.gitignore` raiz para ignorar `.env.development`, `.env.staging` y `.env.production`

### Fase 3: Documentacion unificada del proyecto

**Objetivo:** Crear documentos de proyecto estandar en la raiz, reducir READMEs de subdirectorio a detalles tecnicos especificos.

#### 3.1 README.md (raiz) - Punto de entrada

```markdown
# MapaLab

Interfaz web para la creacion, gestion y visualizacion de mapas interactivos
con datos geoespaciales del IIEG Jalisco.

## Requisitos
- Docker >= v28.2.2
- Docker Compose >= v2.36.2
- Git >= 2.48

## Inicio rapido

### 1. Clonar y configurar
git clone <repo-url>
cd mapalab
cp .env.example .env
# Editar .env con tus valores (DB, GeoServer, etc.)

### 2. Desarrollo
make dev
# Frontend (Vite):  http://localhost:5173
# Backend API:      http://localhost:8001
# Backend Docs:     http://localhost:8001/docs

### 3. Staging (simula produccion)
make prod
# App: http://localhost:3006

## Comandos disponibles
(Tabla de make commands)

## Variables de entorno
(Referencia a .env.example con explicacion de cada seccion)

## Arquitectura
(Diagrama simplificado dev vs staging)

## Stack tecnologico
- Frontend: React 19, Vite, Tailwind CSS 4, OpenLayers
- Backend: FastAPI, SQLModel, PostgreSQL
- Infra: Docker, Nginx, GeoServer (externo)

## Estructura del proyecto
(Arbol simplificado de directorios principales)

## Testing
(Como correr tests de frontend y backend)

## Documentacion adicional
- [Guia de contribucion](CONTRIBUTING.md)
- [Registro de cambios](CHANGELOG.md)
- [Codigo de conducta](CODE_OF_CONDUCT.md)
- [Frontend - detalles tecnicos](frontend/README.md)
- [Backend - detalles tecnicos](backend/README.md)
```

#### 3.2 CONTRIBUTING.md - Guia de contribucion

Contenido propuesto:

```markdown
# Guia de Contribucion

## Configuracion del entorno
1. Clonar el repo
2. Configurar git hooks: `make setup-hooks`
3. Copiar variables de entorno: `cp .env.example .env`
4. Levantar servicios: `make dev`

## Flujo de trabajo con Git

### Ramas
- `main` / `develop`: rama principal
- `feature/<nombre>`: nuevas funcionalidades
- `fix/<nombre>`: correccion de bugs
- `refactor/<nombre>`: refactorizaciones

### Convencion de commits
Formato: `<tag>: <descripcion concisa>`

Tags disponibles:
| Tag | Uso |
|-----|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Correccion de bug |
| `refactor` | Reestructuracion sin cambio funcional |
| `docs` | Documentacion |
| `test` | Tests |
| `chore` | Tareas de mantenimiento |

Ejemplo: `feat: add layer download in GeoJSON format`

### Pull Requests
- Describir que cambia y por que
- Asegurar que los tests pasan: `npm test` (frontend)
- Asegurar que el linter pasa: `npm run lint` (frontend)
- Revisar que `make dev` y `make prod` funcionan correctamente

## Estructura de directorios
(Referencia breve al arbol del proyecto)

## Convenciones de codigo

### Frontend
- Componentes React funcionales
- Tailwind CSS para estilos
- Aliases de importacion (@components, @hooks, @services, etc.)
- Tests con Vitest + Testing Library

### Backend
- Endpoints con FastAPI
- Modelos con SQLModel
- Variables de entorno via pydantic Settings

## Reporte de bugs
Abrir un issue con:
- Descripcion del problema
- Pasos para reproducir
- Comportamiento esperado vs actual
- Screenshots si aplica
```

#### 3.3 CHANGELOG.md - Registro de cambios

```markdown
# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Versionado Semantico](https://semver.org/lang/es/).

## [No publicado]

### Agregado
- (Listar features nuevas pendientes de release)

### Cambiado
- (Listar cambios en funcionalidades existentes)

### Corregido
- (Listar bugs corregidos)

### Eliminado
- (Listar funcionalidades removidas)

## [1.0.1] - YYYY-MM-DD

### Cambiado
- Mejora en servicio de descarga de capas con resolucion WMS dinamica
- Refactorizacion de validacion de capas y documentacion de migracion

### Eliminado
- Servicio de busqueda y utilidades de texto removidos

## [1.0.0] - YYYY-MM-DD
- Release inicial de MapaLab
```

#### 3.4 CODE_OF_CONDUCT.md - Codigo de conducta

```markdown
# Codigo de Conducta

## Nuestro compromiso

Como miembros, contribuyentes y administradores del proyecto MapaLab del IIEG,
nos comprometemos a hacer de la participacion en nuestro proyecto una experiencia
libre de acoso para todos.

## Nuestros estandares

Ejemplos de comportamiento que contribuyen a un ambiente positivo:
- Usar lenguaje inclusivo y respetuoso
- Respetar puntos de vista y experiencias diferentes
- Aceptar critica constructiva
- Enfocarse en lo mejor para el equipo y el proyecto

Ejemplos de comportamiento inaceptable:
- Uso de lenguaje o imagenes sexualizadas
- Insultos o ataques personales
- Acoso publico o privado
- Publicar informacion privada de otros sin permiso

## Alcance

Este codigo de conducta aplica dentro del repositorio y en espacios publicos
cuando un individuo representa al proyecto o su equipo.

## Aplicacion

Reportar comportamiento inaceptable al responsable del proyecto.
Todas las quejas seran revisadas e investigadas de manera justa.
```

**Tareas de Fase 3:**
- [ ] Crear `README.md` raiz como punto de entrada (incluir seccion de arquitectura con info de nginx: servir estaticos, proxy a backend, caching, headers)
- [ ] Crear `CONTRIBUTING.md` con flujo de trabajo, convenciones de commits y codigo
- [ ] Crear `CHANGELOG.md` con formato Keep a Changelog (poblar con historial de git relevante)
- [ ] Crear `CODE_OF_CONDUCT.md` adaptado al contexto IIEG
- [ ] Reducir `frontend/README.md` a detalles especificos: aliases de importacion, z-index schema, componentes
- [ ] Reducir `backend/README.md` a detalles especificos: endpoints, modelos, configuracion de FastAPI
- [ ] Eliminar `nginx/README.md` (su contenido relevante se fusiona en el README raiz, seccion de arquitectura)
- [ ] Eliminar de sub-READMEs: instrucciones de `make`, setup de Docker, configuracion de `.env`
- [ ] Verificar que los links entre documentos funcionen

### Fase 4: Limpiar backend/.gitignore

**Cambio puntual:**

```gitignore
# Agregar al backend/.gitignore:
!requirements.txt
```

Esto deja explicito que `requirements.txt` debe mantenerse versionado aunque `*.txt` este en el ignore.

**Tareas:**
- [ ] Agregar `!requirements.txt` al `backend/.gitignore`

---

## Otras Recomendaciones

### A. Healthchecks en Docker Compose

Agregar healthchecks para que `depends_on` sea mas robusto:

```yaml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 10s
    timeout: 5s
    retries: 3
```

### B. Build multi-stage para frontend prod

En vez de correr `docker run node:24-alpine ... npm run build` en el Makefile, usar un Dockerfile multi-stage:

```dockerfile
# frontend/Dockerfile (NUEVO - para staging/prod)
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_BASE_PATH=/mapalab/
ARG VITE_BACKEND_API_HOST=/mapalab/api/
ARG VITE_GEOSERVER_URL=/geoserver/
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

Esto elimina la necesidad del paso de build manual en el Makefile y hace el deploy mas reproducible. Las variables de build se pasan como `build.args` en el compose.

### C. Considerar un solo Dockerfile por servicio con targets

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000

FROM base AS development
CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

FROM base AS production
CMD ["gunicorn", "app.server:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

Uso en compose: `build: { target: development }` o `build: { target: production }`.
Esto elimina la necesidad de tener `Dockerfile` + `Dockerfile.prod` separados.

### D. Validar variables de entorno al arrancar

Agregar validacion en el backend (probablemente ya lo hace via pydantic Settings) de que todas las variables requeridas estan presentes al arrancar, en vez de fallar silenciosamente con valores `None`.

### E. Estandarizar puerto default de Nginx

Decidir un valor unico para `NGINX_PORT` y usarlo consistentemente:
- `nginx/.env.example` → `3006`
- `nginx/.env` actual → `8081`
- Makefile fallback → `3006`
- Recomendacion: unificar a `3006` en todos lados

---

## Decisiones Tomadas

### Variables de entorno: Multiples archivos por entorno

**Decision:** Usar `.env.development` y `.env.staging` en la raiz, seleccionados por Makefile.

**Razon:** Con un solo `.env` no se pueden tener dev y staging corriendo simultaneamente en la misma maquina. Tener archivos separados permite levantar ambos entornos a la vez si es necesario.

**Implementacion:**
- `.env.example` en el repo como template con placeholders (versionado)
- `.env.development` con valores de desarrollo (gitignored)
- `.env.staging` con valores de staging (gitignored)
- `make dev` → `docker compose --env-file .env.development --profile dev up`
- `make prod` → `docker compose --env-file .env.staging --profile staging up`
- Ya no se necesita el patron fragil de `cp .env.X .env`

### Docs API: No en staging

**Decision:** `/docs` y `/redoc` no deben estar accesibles en staging.

**Implementacion:** Verificar que el backend desactive la documentacion cuando `ENVIRONMENT=production` o `DEBUG=false`. Si no lo hace, agregarlo.

### nginx/README.md: Fusionar en README raiz

**Decision:** Eliminar `nginx/README.md` como archivo separado. La informacion relevante de nginx (servir estaticos + proxy a backend) se integra en la seccion de arquitectura del README raiz. El contenido sobre rutas del gateway se elimina ya que no pertenece a este repo.

---

## Resultado Final Esperado

```
mapalab/
├── docker-compose.yml              # Servicios unificados con profiles
├── docker-compose.override.yml     # Overrides de desarrollo
├── .env.example                    # Template versionado con placeholders
├── .env.development                # (gitignored) Valores de desarrollo
├── .env.staging                    # (gitignored) Valores de staging
├── .env.production                 # (gitignored) Valores de produccion real
├── Makefile                        # Actualizado para compose raiz
├── README.md                       # NUEVO: Punto de entrada del proyecto
├── CONTRIBUTING.md                 # NUEVO: Guia de contribucion
├── CHANGELOG.md                    # NUEVO: Registro de cambios
├── CODE_OF_CONDUCT.md              # NUEVO: Codigo de conducta
│
├── frontend/
│   ├── Dockerfile.dev              # (sin cambios)
│   ├── Dockerfile                  # NUEVO: Multi-stage para staging
│   └── README.md                   # Reducido: solo detalles de frontend
│
├── backend/
│   ├── Dockerfile                  # Unificado con targets (dev + prod)
│   ├── .gitignore                  # Corregido: !requirements.txt
│   └── README.md                   # Reducido: solo detalles de backend
│
├── nginx/
│   ├── Dockerfile                  # (sin cambios)
│   └── nginx.conf                  # (sin cambios, GeoServer va en gateway)
│
└── (Eliminados: docker-compose de subdirectorios, .env.example duplicados, nginx/README.md)
```

## Orden de Ejecucion Sugerido

1. **Fase 4** - Corregir `backend/.gitignore` (cambio puntual, sin riesgo)
2. **Fase 1** - Docker Compose unificado (mayor impacto en DX)
3. **Fase 2** - Variables de entorno centralizadas (depende de Fase 1)
4. **Fase 3** - Documentacion unificada (documentar el estado final)
5. **Recomendaciones** - Aplicar mejoras incrementales (healthchecks, multi-stage, etc.)

## Riesgos

- **Romper el deploy actual:** Mantener los archivos antiguos hasta validar completamente la nueva estructura. Hacer la migracion en una rama separada y probar `make dev` + `make prod` antes de mergear.
- **Variables de entorno con nombres conflictivos:** Al centralizar en un solo `.env`, variables como `NETWORK_NAME` que antes estaban en archivos separados podrian colisionar (en este caso no, porque tienen el mismo valor).
- **Docker Compose profiles:** Requiere Docker Compose v2.x (ya lo tienen segun requisitos del proyecto).
- **Makefile:** El refactor del Makefile es el paso mas delicado. Si algo falla, `make dev` y `make prod` dejan de funcionar. Probar exhaustivamente.
