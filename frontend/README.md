# FRONTEND MAPALAB
<div align="center">
    <img src="./public/logo_iieg.svg" width="512" alt="Logo IIEG"/>
</div>
<br>
<br>
<div align="center">

![build succeeded](https://img.shields.io/badge/Application-MAPALAB-blue?style=for-the-badge)
![build succeeded](https://img.shields.io/badge/Version-1.0.0-yellow?style=for-the-badge)
![Static Badge](https://img.shields.io/badge/React-19.2.4-brightgreen?style=for-the-badge)
![build succeeded](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)

</div>

[[_TOC_]]

## Overview
MapaLab es una aplicación web para crear, gestionar y visualizar mapas interactivos utilizando datos geográficos del IIEG. Proporciona herramientas para análisis de datos y visualización cartográfica.

## Requisitos
- Docker >= v28.2.2
- Docker Compose >= v2.36.2
- Node/npm >= v22.22.0 (LTS)
- Git >= 2.48.1
- Navegador web (Firefox, Chrome, Brave, etc.)

## Estructura del proyecto
```
mapalab/
├── frontend/          # Aplicación React (Vite + TailwindCSS + OpenLayers)
├── backend/           # API REST (FastAPI + SQLAlchemy)
├── nginx/             # Reverse proxy (producción/SSL)
├── .githooks/         # Git hooks del proyecto
└── Makefile           # Comandos de automatización
```

## Configuración inicial

### 1. Clonar el repositorio
```bash
git clone https://iieg-app.jalisco.gob.mx/iieg/mapalab-frontend.git
cd mapalab
```

### 2. Configurar git hooks
```bash
make setup-hooks
```

### 3. Configurar variables de entorno
Copiar los archivos de ejemplo y completar con los valores requeridos:

**Frontend (desarrollo):**
```bash
cd frontend
cp .env.development.example .env.development
```

Variables principales:
| Variable | Descripción |
| --- | --- |
| `VITE_BACKEND_API_HOST` | URL del backend API |
| `VITE_GEOSERVER_URL` | Path al GeoServer |
| `VITE_HOST_FRONTEND` | Host del frontend (default: 0.0.0.0) |
| `VITE_PORT` | Puerto del dev server (default: 5173) |
| `GEOSERVER_DEV_TARGET` | Target del proxy a GeoServer en desarrollo |

**Frontend (producción):**
```bash
cp .env.example .env.production
```

Variables principales:
| Variable | Descripción |
| --- | --- |
| `VITE_GTM_ID` | ID de Google Tag Manager |
| `VITE_SITE_URL` | URL pública del sitio |
| `VITE_BACKEND_API_HOST` | Path al backend API |
| `VITE_BASE_PATH` | Ruta base de la app (/ o /mapalab/) |
| `MAPALAB_BACKEND_URL` | URL interna del backend para Nginx |
| `CORS_ALLOWED_ORIGIN` | Origen permitido para CORS |

**Backend:**
```bash
cd backend
cp .env.example .env.development
```

Variables principales:
| Variable | Descripción |
| --- | --- |
| `ENVIRONMENT` | development / production |
| `DEBUG` | True / False |
| `CORS_ORIGINS` | Orígenes permitidos (JSON array) |
| `GEOSERVER_URL` | URL del GeoServer |
| `GEOSERVER_USER` / `GEOSERVER_PASSWORD` | Credenciales GeoServer |
| `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` / `DB_NAME` | Conexión PostgreSQL |
| `ACERVO_PUBLIC_URL` | URL pública del acervo de metadatos |

**Nginx:**
```bash
cd nginx
cp .env.example .env
```

Variables principales:
| Variable | Descripción |
| --- | --- |
| `NGINX_PORT` | Puerto de Nginx |
| `BACKEND_HOST` | Host del backend |
| `GEOSERVER_HOST` | Host del GeoServer |
| `APP_DOMAIN` | Dominio o IP de la aplicación |
| `SSL_EMAIL` | Email para certificado Let's Encrypt |

## Desarrollo

```bash
make dev
```

Levanta los servicios en modo desarrollo con hot-reload:

| Servicio | URL | Descripción |
| --- | --- | --- |
| Frontend | http://localhost:5173 | Vite dev server con HMR |
| Backend API | http://localhost:8000 | FastAPI con --reload |
| Backend Docs | http://localhost:8000/docs | Swagger UI |
| Backend ReDoc | http://localhost:8000/redoc | ReDoc |

Nginx **no** se usa en desarrollo. El frontend hace proxy directo al backend y GeoServer vía Vite.

### Logs de desarrollo
```bash
make logs-dev
```

## Testing

### Ejecutar tests
```bash
cd frontend
npm test              # Modo watch
npm run test:ui       # Interfaz visual de Vitest
npm run test:coverage # Reporte de cobertura
```

### Ejecutar linter
```bash
npm run lint
```

## Producción

### Modo administración (subruta /mapalab/)
```bash
make prod
```

| Servicio | URL |
| --- | --- |
| Aplicación | http://localhost/mapalab/ |
| Backend API | http://localhost/api |
| GeoServer | http://localhost/geoserver/ |

Frontend servido como estáticos desde Nginx. `/docs` y `/redoc` están deshabilitados.

### Modo SSL con Let's Encrypt (GCP)
```bash
make ssl
```
Requiere `APP_DOMAIN` y `SSL_EMAIL` configurados en `nginx/.env`. Obtiene certificado de Let's Encrypt automáticamente.

| Servicio | URL |
| --- | --- |
| Aplicación | https://\<APP_DOMAIN\> |
| Backend API | https://\<APP_DOMAIN\>/api |

### Modo SSL local (certificado autofirmado)
```bash
make ssl-local
```
Genera un certificado autofirmado. Útil para pruebas locales de HTTPS.

### Deploy (rebuild + restart)
```bash
make deploy
```
Detecta automáticamente el modo (SSL o administración) y reconstruye frontend + reinicia servicios.

### Logs de producción
```bash
make logs-prod
```

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `make dev` | Modo desarrollo (Vite dev server + Backend con /docs) |
| `make prod` | Modo producción (subruta /mapalab/, Nginx + estáticos) |
| `make ssl` | Modo HTTPS GCP (Let's Encrypt) |
| `make ssl-local` | Modo HTTPS local (certificado autofirmado) |
| `make deploy` | Rebuild + restart (detecta modo automáticamente) |
| `make build-prod` | Construir imágenes de producción |
| `make down` | Detener todos los servicios |
| `make clean` | Detener servicios y limpiar todo (dist, node_modules, volúmenes) |
| `make status` | Ver estado de los servicios |
| `make setup-hooks` | Configurar git hooks del proyecto |
| `make logs-dev` | Ver logs de desarrollo |
| `make logs-prod` | Ver logs de producción |
| `make logs-backend` | Ver logs del backend |
| `make logs-frontend` | Ver logs del frontend |
| `make logs-nginx` | Ver logs de Nginx |

## Documentación

- [Arquitectura del proyecto](./ARCHITECTURE.md)
- [Código de conducta](./CODE_OF_CONDUCT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Changelog](./CHANGELOG)
- [Variables de entorno](./.env.example)
- [Licencia](./LICENSE)

## Styling
Este proyecto usa [Tailwind CSS](https://tailwindcss.com/) para estilos y [OpenLayers](https://openlayers.org/) para renderizado de mapas.

# Esquema Completo de z-index del Mapa

  ## Componentes de UI (Interfaz de Usuario)

  | z-index | Componente                    | Ubicación           | Descripción                                    |
  |---------|-------------------------------|---------------------|------------------------------------------------|
  | **50**  | FeatureInfoPanel              | Flotante            | Panel de información de features (más arriba)  |
  | **30**  | MeasurementConfigPanel        | Flotante            | Panel de configuración de mediciones           |
  | **30**  | LayerDetailModal              | Centro inferior     | Modal de detalle de capas                      |
  | **20**  | MapSider                      | Lateral izquierdo   | Menú lateral de capas                          |
  | **11**  | Barra de búsqueda             | Superior derecho    | Búsqueda y descarga                            |
  | **10**  | ActiveLayersList              | Superior derecho    | Lista de capas activas                         |
  | **10**  | SymbologyPanel                | Superior derecho    | Panel de simbología                            |
  | **10**  | ScaleLineControl              | Inferior centro     | Control de escala                              |
  | **10**  | MapControls                   | Inferior derecho    | Controles del mapa (zoom, ubicación, etc.)     |
  | **10**  | MeasurementControls           | Inferior izquierdo  | Herramientas de medición                       |

  ## Capas del Mapa (OpenLayers)

  ### Capas vectoriales y de dibujo
  | z-index  | Tipo de Capa                    | Descripción                                          |
  |----------|---------------------------------|------------------------------------------------------|
  | **1000** | Capas vectoriales (dibujo)      | Herramientas de medición, anotaciones, dibujos       |

  ### Capas temáticas WMS
  | z-index    | Tipo de Capa                  | Descripción                                          |
  |------------|-------------------------------|------------------------------------------------------|
  | **100-999**| Capas temáticas WMS           | Capas de datos (seguridad, salud, economía, etc.)    |

  ### Capas base del GeoServer (siempre visibles)

  | zIndex | Capa                    | Layer GeoServer         | Descripción                  |
  |--------|-------------------------|-------------------------|------------------------------|
  | **1**  | Curvas de nivel         | `curvas_de_nivel`       | Curvas de nivel (más abajo)  |
  | **2**  | Cuerpos de agua         | `cuerpos_de_agua_250k`  | Lagos, ríos                  |
  | **3**  | Límites municipales     | `limite_municipal`      | Límites municipales          |
  | **4**  | Caminos                 | `caminos_2012`          | Caminos                      |
  | **5**  | Cabeceras municipales   | `cabeceras_municipales` | Cabeceras municipales        |
  | **6**  | Aeropuertos             | `aeropuertos`           | Aeropuertos                  |
  | **7**  | Carreteras              | `carretera_2012`        | Atlas de carreteras          |
  | **8**  | Regiones                | `regiones`              | Regiones del estado          |

  ### Capas base dinámicas (según `base`)

  | zIndex | Capa                              | Layer GeoServer                  | Visible cuando   |
  |--------|-----------------------------------|----------------------------------|------------------|
  | **9**  | Límite estatal secundario IIEG    | `limite_estatal_secundario`      | `base = 'iieg'`  |
  | **10** | Límite estatal secundario INEGI   | `limite_estatal_inegi_secundario`| `base = 'inegi'` |
  | **11** | Límite estatal IIEG               | `limite_estatal`                 | `base = 'iieg'`  |
  | **12** | Límite estatal INEGI              | `limite_estatal_inegi`           | `base = 'inegi'` |

  ### Mapa base
  | z-index | Tipo de Capa                    | Descripción                                          |
  |---------|---------------------------------|------------------------------------------------------|
  | **-1**  | Mapa base (Carto/OSM)           | Fondo del mapa (Carto Light, Voyager, etc.)          |

  ## Diagrama Visual Completo

  ┌─────────────────────────────────────────────────────────────┐
  │  UI: FeatureInfoPanel                         [50]          │  ← Más arriba
  ├─────────────────────────────────────────────────────────────┤
  │  UI: MeasurementConfigPanel, LayerDetailModal [30]          │
  │  UI: MapSider                                 [20]          │
  │  UI: Barra de búsqueda                        [11]          │
  │  UI: Paneles y Controles                      [10]          │
  │      (ActiveLayersList, SymbologyPanel, MapControls, etc.)  │
  ├─────────────────────────────────────────────────────────────┤
  │  Capas vectoriales (dibujo)                   [1000+]       │  ← Herramientas de medición
  ├─────────────────────────────────────────────────────────────┤
  │  Capas temáticas (WMS)                        [100-999]     │  ← Seguridad, salud, etc.
  ├─────────────────────────────────────────────────────────────┤
  │  Límites estatales (IIEG/INEGI)               [11/12]       │  ← Dinámicos según base
  │  Límites estatales secundarios (IIEG/INEGI)   [9/10]        │  ← Dinámicos según base
  │  Regiones                                     [8]           │
  │  Carreteras                                   [7]           │
  │  Aeropuertos                                  [6]           │
  │  Cabeceras municipales                        [5]           │
  │  Caminos                                      [4]           │
  │  Límites municipales                          [3]           │
  │  Cuerpos de agua                              [2]           │
  │  Curvas de nivel                              [1]           │  ← Más abajo de capas base
  ├─────────────────────────────────────────────────────────────┤
  │  Mapa base (Carto/OSM)                        [-1]          │  ← Fondo
  └─────────────────────────────────────────────────────────────┘
