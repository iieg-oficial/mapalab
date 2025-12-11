# Nginx - Servidor Web y Reverse Proxy

Servidor web que sirve archivos estáticos del frontend y actúa como reverse proxy para el backend API y GeoServer externo.

## Configuración

### Variables de Entorno

Configura el archivo `.env` con los valores de tu GeoServer:

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores
NGINX_PORT=80
GEOSERVER_HOST=localhost  # O tu IP/dominio de GeoServer
GEOSERVER_PORT=8080
```

## Rutas Configuradas

| Ruta | Tipo | Destino | Descripción |
|------|------|---------|-------------|
| `/` | Static | `/usr/share/nginx/html` | Archivos estáticos del frontend (React compilado) |
| `/api/` | Proxy | backend:8000 | API REST del backend |
| `/docs` | Proxy | backend:8000 | Documentación Swagger (controlado por backend) |
| `/redoc` | Proxy | backend:8000 | Documentación ReDoc (controlado por backend) |
| `/geoserver/` | Proxy | GeoServer externo | Proxy a GeoServer (WMS, WFS, WCS, OWS) |
| `/health` | Static | nginx | Health check endpoint |

### Frontend - Archivos Estáticos

El frontend **NO corre como contenedor**. Los archivos compilados (`frontend/dist/`) se montan en nginx mediante volumen:

```yaml
volumes:
  - ../frontend/dist:/usr/share/nginx/html:ro
```

**Ventajas:**
- ✅ Rendimiento: nginx sirve archivos directamente (sin proxy extra)
- ✅ Caché optimizado: JS/CSS cacheados por 1 año, index.html sin caché
- ✅ Menos recursos: solo 2 contenedores (backend + nginx)

**Configuración de caché:**
```nginx
# Archivos estáticos (JS, CSS, imágenes, fuentes)
expires 1y;
add_header Cache-Control "public, immutable";

# index.html (sin caché para deployments)
add_header Cache-Control "no-cache, no-store, must-revalidate";
```

## GeoServer

El proxy de GeoServer maneja **todos** los servicios a través de una sola ruta `/geoserver/`:

- **WMS** (Web Map Service): `/geoserver/wms?request=GetMap`
- **WFS** (Web Feature Service): `/geoserver/wfs?request=GetFeature`
- **WCS** (Web Coverage Service): `/geoserver/wcs?request=GetCoverage`
- **OWS** (OGC Web Services): `/geoserver/ows`
- **REST API**: `/geoserver/rest/`
- **Web Admin**: `/geoserver/web/`

### ¿Por qué una sola ruta `/geoserver/`?

✅ **Buena práctica**: Una ruta base `/geoserver/` que proxea todo.

**Ventajas:**
- GeoServer funciona como espera (rutas internas preservadas)
- Acceso completo a todos los servicios (WMS, WFS, admin, etc.)
- Configuración más simple y mantenible
- No rompe links internos ni referencias

❌ **Mala práctica**: Rutas separadas `/wfs`, `/wms`, etc.

**Problemas:**
- Rompe la estructura interna de GeoServer
- Pierde funcionalidad (admin, REST, OWS)
- Más complejo de configurar
- Links internos dejan de funcionar

## Documentación API (/docs y /redoc)

El acceso a la documentación FastAPI se **controla desde el backend**, no desde nginx:

- **Desarrollo** (`ENVIRONMENT=development` en backend):
  - `/docs` → Swagger UI activa
  - `/redoc` → ReDoc activa

- **Producción** (`ENVIRONMENT=production` en backend):
  - `/docs` → 404 (deshabilitado en backend)
  - `/redoc` → 404 (deshabilitado en backend)

Nginx simplemente proxea estas rutas al backend, donde se decide si se sirven o no.

## Configuración de Timeouts

Para GeoServer, los timeouts están configurados para peticiones de larga duración:

- `proxy_connect_timeout: 600s` (10 minutos)
- `proxy_send_timeout: 600s` (10 minutos)
- `proxy_read_timeout: 600s` (10 minutos)

Esto permite operaciones pesadas como:
- WFS GetFeature con muchas features
- WMS GetMap de áreas grandes
- Procesamiento de datos complejos

## Headers de Seguridad

Se incluyen headers de seguridad básicos:

```nginx
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: no-referrer-when-downgrade
```

## Buffering para Respuestas Grandes

Configurado para manejar respuestas grandes de GeoServer:

```nginx
proxy_buffering on
proxy_buffer_size 4k
proxy_buffers 24 4k
proxy_max_temp_file_size 2048m
```

## Levantar el Servicio

**Importante:** El frontend debe estar compilado antes de levantar nginx.

```bash
# Opción 1: Desde raíz (recomendado - compila frontend automáticamente)
make dev   # o make prod

# Opción 2: Manual
cd ../frontend
npm run build   # Genera dist/
cd ../nginx
docker compose up -d
```

## Verificar Funcionamiento

```bash
# Health check
curl http://localhost/health

# Frontend (debe servir index.html)
curl http://localhost/

# Backend API
curl http://localhost/api/

# GeoServer (si está configurado)
curl http://localhost/geoserver/web/
```

## Troubleshooting

### Error: Nginx muestra página vacía o 403

**Causa:** El directorio `frontend/dist/` no existe o está vacío.

**Solución:**
```bash
# Compilar frontend
cd ../frontend
npm run build

# Reiniciar nginx
cd ../nginx
docker compose restart
```

### Cambios en frontend no se reflejan

**Causa:** El navegador tiene archivos cacheados o no se recompiló el frontend.

**Solución:**
```bash
# 1. Recompilar frontend
cd ../frontend
npm run build

# 2. Reiniciar nginx (opcional, automáticamente detecta cambios)
cd ../nginx
docker compose restart

# 3. Limpiar caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)
```
