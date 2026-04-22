# Plan: GlitchTip (Error Tracking) self-hosted sobre infra IIEG

> **Estado:** Diseño, sin iniciar implementación. Se entrega como plan para decidir si se ejecuta. Alternativa a integrar Sentry SaaS en el frontend de MapaLab.

## 1. Contexto

Hoy MapaLab no tiene observabilidad de errores en producción:
- Si el frontend truena en el navegador de un usuario, nos enteramos cuando alguien se queja por Discord o por mail.
- El backend loggea a Loki (huachicol), pero no hay agrupación ni fingerprinting de errores.
- No hay historial por release ni forma de saber si un bug nuevo es regresión.

Para una herramienta pública del IIEG esto es frágil. La idea es meter un error tracker con:
- **Stack traces deofuscados** (sourcemaps del bundle de Vite).
- **Agrupación por fingerprint** — un mismo bug con N ocurrencias se ve como 1 issue.
- **Release tracking** — saber en qué versión apareció cada bug.
- **Contexto de usuario/ruta/navegador** sin loggear manualmente.
- **Alertas por regresión** (error nuevo en el último release).

## 2. Por qué GlitchTip (y no otros)

| Opción | Pro | Contra |
|---|---|---|
| **Sentry SaaS free** | Zero infra, 5min setup | Datos salen de IIEG, 5K errors/mes, features extra detrás de paywall |
| **Sentry self-hosted full** | Feature completo | 8+ GB RAM, Redis, Kafka, ClickHouse, Snuba — complejo de operar |
| **GlitchTip self-hosted** | API-compatible con Sentry SDK, ~1 GB RAM, solo Django+Postgres+Redis, mantenido activamente, AGPL | Sin session replay, sin performance tracing avanzado |

**GlitchTip** cubre 90% de lo que MapaLab necesita (errores con stack trace, releases, contexto) con 10% del costo operacional de Sentry self-hosted. El SDK del frontend es `@sentry/react` sin cambios — apunta al DSN de GlitchTip y funciona.

## 3. Arquitectura propuesta

### 3.1 Ubicación física

Va en **S1 (Gateway + Huachicol + Acervo)**, junto a Grafana/Prometheus/Loki. Es el servidor natural para observabilidad y tiene recursos:
- S1: 8 cores, 15 GB RAM, 637 GB disco
- Huachicol actual ocupa ~3 GB RAM → queda margen

### 3.2 Componentes (docker-compose)

```
glitchtip-web         — Django app (uWSGI, puerto interno 8000)
glitchtip-worker      — Celery worker (procesa eventos entrantes)
glitchtip-postgres    — PostgreSQL 15 (base de datos propia, NO reutilizar dataengine)
glitchtip-redis       — Redis (broker de Celery)
```

Imagen oficial: `glitchtip/glitchtip:latest` (mismo image para web y worker, diferente comando).

Recursos estimados:
| Servicio | RAM | CPU | Disco |
|---|---|---|---|
| glitchtip-web | 300 MB | 0.2 | — |
| glitchtip-worker | 200 MB | 0.2 | — |
| glitchtip-postgres | 300 MB | 0.2 | 5-20 GB (crece con eventos) |
| glitchtip-redis | 100 MB | 0.1 | — |
| **Total** | **~900 MB** | **~0.7 cores** | **~20 GB** |

### 3.3 Red Docker

Se une a `iieg-network` (la red externa compartida que ya usan MapaLab, huachicol y demás):

```yaml
networks:
  iieg-network:
    external: true
  glitchtip-internal:
    driver: bridge
```

- `glitchtip-web` y `glitchtip-worker` en ambas (iieg-network para ser alcanzable por gateway-hub, interna para DB/Redis).
- `glitchtip-postgres` y `glitchtip-redis` solo en `glitchtip-internal` (no expuestos fuera).

### 3.4 Routing via gateway-hub

Agregar en `nginx/templates/gateway.conf.template` de gateway-hub:

```nginx
location /glitchtip/ {
    proxy_pass http://glitchtip-web:8000/;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto https;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    client_max_body_size 50M;  # sourcemaps pueden ser grandes
}
```

Acceso:
- **UI de admin**: `https://iieg.app/glitchtip/` (proteger con VPN si se quiere, igual que `/huachicol/` y `/mariachi/`)
- **DSN endpoint**: mismo dominio público (necesita serlo para que el SDK del navegador pueda enviar eventos desde clientes públicos)

> ⚠️ Decisión pendiente: ¿el panel UI se restringe a VPN? Los eventos entrantes desde los navegadores públicos son por HTTPS POST a rutas específicas (`/api/*/store/`, `/api/*/envelope/`), mientras que la UI web es para admins. Se pueden separar a nivel nginx con dos `location` — uno abierto para ingest, otro con VPN-only para UI.

## 4. Cambios requeridos en repositorios

### 4.1 huachicol / infra compartida

Agregar `glitchtip` al docker-compose del servidor S1. Probablemente ya existe un `docker-compose.yml` para Grafana/Loki/Prometheus — es el mismo archivo. Necesita `.env` con:

```
GLITCHTIP_SECRET_KEY=<generado con openssl rand -hex 32>
GLITCHTIP_DATABASE_URL=postgres://glitchtip:***@glitchtip-postgres:5432/glitchtip
GLITCHTIP_REDIS_URL=redis://glitchtip-redis:6379/0
GLITCHTIP_EMAIL_URL=smtp://user:pass@host:587  # opcional, para notificaciones
GLITCHTIP_DEFAULT_FROM_EMAIL=no-reply@iieg.gob.mx
GLITCHTIP_ENABLE_USER_REGISTRATION=false  # crear cuentas manual
GLITCHTIP_PORT=8000
GLITCHTIP_EXTERNAL_URL=https://iieg.app/glitchtip
```

### 4.2 gateway-hub

Dos cambios:
1. Agregar `location /glitchtip/` al template de nginx.
2. Si se separa UI vs ingest por VPN, duplicar location con distintas restricciones.

### 4.3 MapaLab frontend

El código para integrar se aplica igual sea Sentry SaaS o GlitchTip — el SDK es el mismo (`@sentry/react`). Solo cambia el DSN.

**Paquetes:**
```bash
npm i @sentry/react
npm i -D @sentry/vite-plugin
```

**`frontend/src/main.jsx`** — init al arranque:
```js
import * as Sentry from '@sentry/react';

if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.VITE_NODE_ENV || 'development',
        release: `mapalab@${APP_VERSION}`,
        integrations: [
            Sentry.browserTracingIntegration(),
        ],
        tracesSampleRate: import.meta.env.VITE_NODE_ENV === 'production' ? 0.1 : 1.0,
        // No queremos rastrear eventos de GeoServer / gateway-hub / terceros
        denyUrls: [/youtubei\/v1/, /google-analytics/, /googletagmanager/],
    });
}
```

**`frontend/vite.config.js`** — sourcemap upload en build:
```js
import { sentryVitePlugin } from '@sentry/vite-plugin';

// dentro de plugins:
env.VITE_SENTRY_AUTH_TOKEN && sentryVitePlugin({
    org: 'iieg',
    project: 'mapalab',
    url: 'https://iieg.app/glitchtip/',
    authToken: env.VITE_SENTRY_AUTH_TOKEN,
    release: { name: `mapalab@${pkg.version}` },
    sourcemaps: { assets: './dist/**' },
}),

// y en build.sourcemap:
build: {
    sourcemap: true,  // genera sourcemaps para subir
    // ... resto
}
```

**`frontend/.env.example`** — nuevas variables:
```
# Error tracking (opcional — si vacío, Sentry no se inicializa)
VITE_SENTRY_DSN=
# Solo para CI/CD de producción (subir sourcemaps, NO incluir en .env de cliente)
SENTRY_AUTH_TOKEN=
```

**`.github/workflows/test-frontend.yml`** — pasar el auth token durante el build de prod:
```yaml
- name: Build
  working-directory: ./frontend
  env:
    VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
    SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
  run: npm run build
```

**Error boundary** en el árbol React (wrapper de `App`):
```jsx
import { ErrorBoundary } from '@sentry/react';

<ErrorBoundary fallback={<ErrorFallback />}>
    <App />
</ErrorBoundary>
```

## 5. Pasos de implementación (orden recomendado)

### Fase 1 — Infra (huachicol / S1)
1. Crear `glitchtip/` en el repo de infra compartida con `docker-compose.yml` y `.env.example`.
2. Generar `SECRET_KEY` con `openssl rand -hex 32`.
3. Levantar servicios: `docker compose up -d glitchtip-postgres glitchtip-redis glitchtip-web glitchtip-worker`.
4. Correr migraciones: `docker compose exec glitchtip-web ./manage.py migrate`.
5. Crear superuser: `docker compose exec glitchtip-web ./manage.py createsuperuser`.
6. Verificar UI local: `curl -I http://localhost:8000/`.

### Fase 2 — Gateway
7. Agregar `location /glitchtip/` a `nginx/templates/gateway.conf.template` de gateway-hub.
8. Reload nginx: `docker compose exec gateway-nginx nginx -s reload`.
9. Verificar: `curl -I https://iieg.app/glitchtip/`.

### Fase 3 — Onboarding en GlitchTip
10. Login en `https://iieg.app/glitchtip/` con el superuser.
11. Crear organización `IIEG`.
12. Crear proyecto `mapalab` (platform: JavaScript / React).
13. Copiar el DSN que aparece (`https://<public_key>@iieg.app/glitchtip/<project_id>`).
14. Generar auth token para sourcemaps upload (Settings → Account → API tokens, scopes: `project:write`, `release:admin`).

### Fase 4 — MapaLab frontend (PR separado)
15. `npm i @sentry/react @sentry/vite-plugin`.
16. Agregar init en `main.jsx` (gated por `VITE_SENTRY_DSN`).
17. Agregar plugin en `vite.config.js`.
18. Actualizar `.env.example` con las nuevas variables.
19. Agregar secrets `SENTRY_DSN` y `SENTRY_AUTH_TOKEN` en GitHub Actions.
20. Agregar ErrorBoundary alrededor de `App`.
21. Documentar en `docs/context.md` y `docs/ci-cd.md`.
22. Deploy y disparar un error de prueba desde consola: `Sentry.captureException(new Error('test'))`.

### Fase 5 — Alertas (opcional)
23. Configurar webhooks de GlitchTip a Discord (mismo webhook que CI/CD).
24. Reglas de alerta: "nuevo issue en release X" o "issue con >N eventos en 1h".

## 6. Tradeoffs y decisiones pendientes

### ¿VPN-only para la UI de GlitchTip?
- **Sí**: coherente con `/huachicol/` y `/mariachi/`, menos superficie expuesta.
- **No**: más fácil compartir con colaboradores externos (ej. contratistas).
- **Intermedio**: auth SSO con el portal IIEG. GlitchTip soporta OIDC.

### ¿Retención de eventos?
- GlitchTip permite configurar retención (ej. 30 días, 90 días). Eventos viejos se borran automáticamente.
- Defecto razonable: 90 días en producción, 30 en staging.
- Considerar tamaño: con ~100 errores/día y sourcemaps, puede crecer a 5-10 GB/mes. Planear rotación.

### ¿Samplear traces o solo errores?
- `tracesSampleRate: 0` en prod = solo errores, no performance. Lo más barato.
- `0.1` = 10% de sesiones con traces de performance. Útil para ver páginas lentas.
- Para MapaLab arrancar con `0` y subir si surge la necesidad.

### ¿Qué NO trackear?
- Errores de terceros (GTM, YouTube embed, adblockers) — se filtran con `denyUrls` e `ignoreErrors`.
- Errores de GeoServer (ya los ve el backend).
- Rechazos de promesas de extensiones de Chrome.

### ¿Backup de glitchtip-postgres?
- Automatizable con el mismo flujo que dataengine (dump a MinIO/Acervo).
- Prioridad baja: los datos son reemplazables; si se pierden, solo se pierde historial.

## 7. Criterios de éxito

- UI accesible en `https://iieg.app/glitchtip/` con latencia < 500ms.
- Un error lanzado desde el frontend aparece en el panel en < 30s con stack trace deofuscado.
- Releases del CI/CD aparecen automáticamente en GlitchTip con su commit hash.
- Memoria del servidor S1 se mantiene bajo el 80% tras 1 semana.
- Al menos 1 regresión real atrapada por GlitchTip antes de que un usuario la reporte (validación práctica a 1-2 meses).

## 8. Alternativas si esto no avanza

Si no hay ancho de banda para self-hostear:
1. **Sentry SaaS free tier** — integración idéntica del frontend, cambia solo el DSN. Pros: 5 min setup. Contras: datos salen del gobierno, 5K errores/mes.
2. **Rollbar / Bugsnag free tiers** — similar a Sentry SaaS pero distintas políticas de datos.
3. **No hacer nada y confiar en reportes de usuarios** — barato pero implica flying blind en producción.

La recomendación es no dejar esto "para después" indefinido — el momento en que cuesta más es cuando ya se acumularon bugs silenciosos que afectan usuarios.

## 9. Documentación afectada (al implementar)

- `docs/context.md` — agregar GlitchTip a la lista de servicios IIEG
- `docs/ci-cd.md` — documentar sourcemap upload en pipeline
- `docs/arquitectura.md` — actualizar diagrama con glitchtip-*
- `docs/CHANGELOG.md` — entrada en release notes cuando se deploye
- Nuevo `docs/observabilidad.md` (opcional) — runbook para cuando algo truene

## 10. Nota sobre el SDK del frontend

El plan en `frontend/src/main.jsx` se puede aplicar sin GlitchTip listo: si `VITE_SENTRY_DSN` está vacío el init no corre. Esto permite:
- Mergear el código de integración ahora y activar después con solo setear el env var.
- Testear contra Sentry SaaS free tier primero (con un DSN de prueba), y migrar a GlitchTip self-hosted cambiando solo el DSN.

Este "feature flag" vía env var es el enfoque recomendado para no bloquear el frontend mientras se decide la infra.
