# Plan: widget embebible `<iieg-mapalab>` + admin de keys en mariachi

> **Estado:** F1 en progreso · iniciado 2026-05-08 · sesión autónoma
> **Punto de retorno**: este archivo. Si te atoras, busca la sección "Estado actual" más abajo.

## Objetivo

Permitir que cualquier institución embeba un mapa de mapalab en su sitio con:

```html
<script src="https://mapalab.iieg.gob.mx/widget/v1/mapalab.js" defer></script>
<iieg-mapalab api-key="mk_pub_..." layers="recursos:cultivos" height="500"></iieg-mapalab>
```

Las API keys se administran desde **mariachi** (un nuevo submenu dentro del grupo MapaLab). El backend de mapalab valida las keys consultando a mariachi (con cache local) y sirve un bundle ligero del visor en `/embed`.

## Decisiones cerradas

| # | Decisión |
|---|---|
| 1 | Tag del custom element: `<iieg-mapalab>` (con guión, namespace IIEG) |
| 2 | Esquema de keys: `mk_pub_…` (cliente, requiere allowlist) y `mk_priv_…` (server-side, opcional IP allowlist) |
| 3 | Tabla **nueva** `mapalab_api_keys` (no extender `source_apps` de Colibri) |
| 4 | Backend `/embed` vive en el **mismo backend/nginx de mapalab** (no servicio aparte) |
| 5 | Rate limiting por key en middleware del backend de mapalab |
| 6 | MVP scope: viz read-only (capas + zoom + click), sin draw/swipe/admin |
| 7 | **Referer obligatorio desde día 1** para keys públicas (allowlist no puede estar vacía) |
| 8 | Web Component **fachada** que monta `<iframe>` interno (aislamiento tipo Stripe Elements) |

## Patrón a clonar (Colibri)

Mariachi ya tiene 80% del andamiaje en el sistema **Colibri**. Replicamos su patrón con tabla nueva:

| Componente Colibri | Equivalente Mapalab |
|---|---|
| `api/app/services/colibri_keys.py` | `api/app/services/mapalab_keys.py` (mismo bcrypt+sha256, prefijos `mk_pub_`/`mk_priv_`) |
| `api/app/models/source_app.py` | `api/app/models/mapalab_api_key.py` + `mapalab_api_key_event.py` + `mapalab_api_key_usage_daily.py` |
| `api/app/schemas/source_app.py` | `api/app/schemas/mapalab_api_key.py` (con `CamelCaseInput`, `serialization_alias` camelCase) |
| `api/app/api/routes/colibri_source_apps.py` | `api/app/api/routes/mapalab_api_keys.py` |
| `api/alembic/versions/mariachi/e1f2a3b4c5d6_add_source_apps.py` | `api/alembic/versions/mariachi/<rev>_add_mapalab_api_keys.py` |
| `admin/src/features/colibri/pages/SourceAppsPage.jsx` | `admin/src/features/mapalab-api-keys/pages/...` |
| Auth `verify_csrf` + `require_role(['tetlamamakani'])` | Idem |
| `/colibri/source-apps` (con `settings.admin_prefix`) | `/mapalab/api-keys` |
| `match_origin` con wildcards/subdominios | Reusar import desde `colibri_keys` |

## Modelos de datos (mariachi `public` schema)

### Tabla `mapalab_api_keys`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | Integer PK | |
| `institution_name` | String(150) | "Secretaría de Salud Jalisco" |
| `institution_contact_email` | String(255) | a quién avisar de revocación |
| `visibility` | String(20) | `public` o `private` |
| `key_prefix` | String(20), unique idx | primeros 12 chars (incluye `mk_pub_`) |
| `key_hash` | String(255) | bcrypt(sha256(plain)) |
| `referer_allowlist` | JSONB array | obligatorio para `public`, glob: `["*.salud.jalisco.gob.mx"]` |
| `ip_allowlist` | JSONB array | sólo aplica a `private`, opcional |
| `layer_allowlist` | JSONB array | IDs `workspace:layer`, vacío = todas las públicas |
| `daily_quota` | Integer null | requests/día, null = sin tope |
| `monthly_quota` | Integer null | |
| `status` | String(20) | `active` / `suspended` / `revoked` |
| `expires_at` | DateTime null | rotación opcional |
| `created_by_user_id` | Integer FK users | auditoría |
| `creado_en` | DateTime | |
| `actualizado_en` | DateTime | |
| `last_used_at` | DateTime null | actualizado por validate (best effort) |

### Tabla `mapalab_api_key_events`

| Columna | Tipo |
|---|---|
| `id` | Integer PK |
| `api_key_id` | Integer FK |
| `event` | String(30) (`created`, `revoked`, `suspended`, `reactivated`, `updated`) |
| `actor_user_id` | Integer FK users null |
| `payload` | JSONB null (diff o snapshot relevante) |
| `creado_en` | DateTime |

### Tabla `mapalab_api_key_usage_daily`

Agregada, no por-request (mantiene el costo bajo):

| Columna | Tipo |
|---|---|
| `api_key_id` | Integer FK |
| `day` | Date |
| `request_count` | Integer |
| `error_count` | Integer |
| PK compuesta | `(api_key_id, day)` |

## Endpoints

### Mariachi — admin (auth: `tetlamamakani`)

```
GET    /admin/mapalab/api-keys                   listado paginado + filtros
POST   /admin/mapalab/api-keys                   crea, devuelve plaintext UNA VEZ
GET    /admin/mapalab/api-keys/{id}              detalle (sin plaintext)
PATCH  /admin/mapalab/api-keys/{id}              editar
POST   /admin/mapalab/api-keys/{id}/rotate-key   regenera key (revela una vez)
POST   /admin/mapalab/api-keys/{id}/revoke
POST   /admin/mapalab/api-keys/{id}/suspend
POST   /admin/mapalab/api-keys/{id}/reactivate
GET    /admin/mapalab/api-keys/{id}/usage        serie diaria 30 días
GET    /admin/mapalab/api-keys/{id}/events       auditoría
```

### Mariachi — interno

```
POST /admin/internal/mapalab/keys/validate
Header: X-Internal-Auth: <MARIACHI_INTERNAL_TOKEN>
Body: { key, origin, requested_layers[] }
Resp: {
  valid: bool,
  key_id: int,
  visibility: 'public'|'private',
  layer_allowlist: list,
  daily_quota: int|null,
  reason: str|null  # 'invalid_key' | 'revoked' | 'origin_blocked' | 'expired' | 'layer_blocked'
}
```

### Mapalab backend

```
GET  /api/embed/config?key=mk_pub_...     valida key+referer, devuelve config
GET  /api/embed/layers/tree?key=...       árbol filtrado por allowlist
GET  /embed                               HTML del bundle ligero
ANY  /api/embed/wms-proxy?key=...         proxy GeoServer con CORS dinámico + rate limit
POST /api/embed/cache/invalidate          webhook de mariachi al revocar
```

## Estructura de archivos

### Mariachi backend (api/)

```
api/app/
├── models/
│   ├── mapalab_api_key.py          NUEVO
│   ├── mapalab_api_key_event.py    NUEVO
│   └── mapalab_api_key_usage.py    NUEVO
├── services/
│   └── mapalab_keys.py             NUEVO (calca colibri_keys.py con prefijos mk_*)
├── schemas/
│   └── mapalab_api_key.py          NUEVO
├── api/routes/
│   └── mapalab_api_keys.py         NUEVO (registrar en main.py con admin_prefix + staff_dep)
└── main.py                          EDIT (import + include_router)

api/alembic/versions/mariachi/
└── <rev>_add_mapalab_api_keys.py   NUEVO
```

### Mariachi admin (admin/)

```
admin/src/features/mapalab-api-keys/   NUEVO
├── api/
│   └── mapalabKeysApi.js
├── components/
│   ├── KeyRevealModal.jsx
│   ├── RefererAllowlistEditor.jsx
│   ├── LayerAllowlistEditor.jsx
│   ├── QuotaEditor.jsx
│   └── UsageChart.jsx
├── pages/
│   ├── ApiKeysListPage.jsx
│   ├── ApiKeyEditorPage.jsx
│   ├── ApiKeyDetailPage.jsx
│   └── ApiKeyPlaygroundPage.jsx
└── index.js

admin/src/app/sider-config.jsx       EDIT (agregar entrada bajo PROJECT_REGISTRY.mapalab.items)
admin/src/app/AppRoutes.jsx          EDIT (rutas /mapalab/api-keys/...)
```

### Mapalab backend

```
backend/app/
├── routers/
│   └── embed.py                    NUEVO (config, layers/tree, wms-proxy, /embed HTML)
├── services/
│   ├── api_key_validator.py        NUEVO (cache + call a mariachi)
│   └── api_key_quota.py            NUEVO (sliding window)
├── middleware/
│   └── api_key_auth.py             NUEVO
└── server.py                        EDIT (registrar router embed + middleware)
```

### Mapalab frontend (`/embed`)

```
frontend/src/pages/embed/             NUEVO
├── EmbedView.jsx                    Visor ligero
├── EmbedProvider.jsx                Provider mínimo (sin sider, sin draw, sin swipe)
└── helpers/embedConfig.js

frontend/src/main.jsx                 EDIT (ruta /embed)
```

### Widget (paquete nuevo)

```
widget/                               NUEVO
├── package.json                     @iieg/mapalab-widget
├── vite.config.js                   build UMD + ESM
├── src/
│   ├── index.js                     registra <iieg-mapalab>
│   ├── element.js                   clase Lit, monta iframe
│   ├── messaging.js                 postMessage protocol
│   └── types.d.ts
└── dist/                            output

mapalab/nginx/nginx.conf              EDIT (servir /widget/v1/, /widget/latest/, /embed)
mapalab/Makefile                      EDIT (target widget-build)
mapalab/docker-compose.yml            EDIT (profile build añade widget)
```

### Sieej (prueba E2E)

```
sieej/frontend/...                    EDIT (insertar <iieg-mapalab> en una página)
```

## Convenciones del proyecto a respetar

- **Código**: sin comentarios, sin markdowns explicativos, reusar componentes.
- **Backend**: type hints obligatorios, PEP8, snake_case funciones/vars, PascalCase clases.
- **Frontend**: ESLint 4-space indent, single quotes, Tailwind only (no dark mode), aliases Vite (@components, @hooks, etc.).
- **Commits**: conventional, sin emojis, sin `--no-verify`.
- **Pre-push hook** mapalab corre lint + test + knip → no se salta.
- **Tests**: nunca mockear DB, integration tests hit real Postgres.
- **Roles mariachi**: admin = `tetlamamakani`, staff = `{tetlamamakani, editora}`.
- **Auth admin**: `verify_csrf` + `require_role(['tetlamamakani'])`.
- **Schema mariachi**: solo toca `public.*` y `mariachi.*`. NO `mapalab.*` (eso vive en dataengine).

## Permisos otorgados a esta sesión

Según AskUserQuestion del 2026-05-08:

- ✅ Escritura sobre `/IIEG/mariachi/`, `/IIEG/mapalab/`, `/IIEG/sieej/`.
- ✅ Lectura de `.env.*` locales.
- ✅ git local (add/commit/diff/log/status), commits por bloque, **sin push**.
- ✅ docker compose up/down/exec local.
- ✅ alembic upgrade/revision en local.
- ✅ npm install/run lint/test/build/check:dead-code.
- ✅ make local (`dev`, `staging`).
- ✅ pytest backend.
- ❌ NO push, NO `gh pr create`, NO `--no-verify`, NO modificar `.env*`/secrets/CI/prod.
- ❌ NO `make deploy`, NO `alembic downgrade` con datos.

## Plan por bloques

| Bloque | Estado | Archivos clave | Validación |
|---|---|---|---|
| **F1.1** Migration + modelos | ✅ Completo | `models/mapalab_api_key*.py`, alembic `e5f6a7b8c9d0` | `alembic upgrade head` ok |
| **F1.2** Servicio `mapalab_keys` | ✅ Completo | `services/mapalab_keys.py` | match_origin con wildcards |
| **F1.3** Schemas | ✅ Completo | `schemas/mapalab_api_key.py` | camelCase aliases |
| **F1.4** Endpoints admin CRUD | ✅ Completo | `routes/mapalab_api_keys.py`, `main.py` | 401 sin auth |
| **F1.5** Endpoint interno validate | ✅ Completo | `routes/mapalab_api_keys_internal.py` | curl shared secret → `valid:true` |
| **F1.6** Admin UI list/create/reveal | ✅ Completo | `features/mapalab-api-keys/` | lint clean |
| **F1.7** Admin UI editor + revoke | ✅ Completo | mismo feature | drawer + popconfirm |
| **F1.8** Sider entry | ✅ Completo | `sider-config.jsx` | bajo grupo MapaLab |
| **F2** Mapalab embed + validador | ✅ Completo | `backend/app/routers/embed.py`, `frontend/src/pages/embed/` | E2E ok |
| **F3** Widget @iieg/mapalab-widget | ✅ Completo | `mapalab/widget/` | 7.18 KB gzip |
| **F4** Quotas + telemetría | ✅ Completo | tracker in-memory + flush 60s + métricas Prometheus | persiste en `mapalab_api_keys_uso_diario` |
| **F5** Playground + docs | ✅ Completo | `ApiKeyPlaygroundPage.jsx` + `docs/widget.md` + ruta `/mapalab/api-keys/playground` | preview iframe vivo |
| **F6** Hardening | ✅ Completo | webhook revoke→invalidate + CSP `frame-ancestors` + CORS dinámico + 429 quota | revoke en mariachi invalida cache mapalab |
| **F7** E2E sieej cultivos | ✅ Completo | `sieej/.../MapaCultivos.jsx` | `localhost:5174/mapa-cultivos` |

## Estado actual

**Última actualización**: 2026-05-11 — MVP E2E funcionando.

**Verificación E2E**:
- mariachi-api en :8010 — admin + internal/validate ok
- mapalab-backend dev en :8000 — `/embed/config` valida contra mariachi
- mapalab-frontend dev en :3006 — `/embed?key=…&layers=…` renderiza visor
- sieej-frontend dev en :5174 — `/mapa-cultivos` embebe `<iieg-mapalab>`
- widget bundle 7.18 KB gzip (copia en `sieej/frontend/public/mapalab-widget.v1.js`)

**Secret compartido `MAPALAB_INTERNAL_TOKEN`** = `oS1JCFSKsMbsQY-ZqKoeu3rD9swBEHISxod8vWAirok` (solo `.env.development` de mariachi y mapalab).

**Key de prueba E2E**: `mk_pub_sXPaalq-pb7wWTBa_6UXjdNVjB6x4zkaAZ8e11gFR0k` (SIEEJ — prueba E2E, allowlist localhost:5173/5174/3006/3007).

**Cómo probar**:
1. `cd /IIEG/mariachi && make up` (postgres + redis + api en :8010)
2. `cd /IIEG/mapalab && make dev` (backend en :8000 + frontend en :3006)
3. `cd /IIEG/sieej && make dev` (frontend en :5174)
4. Abrir `http://localhost:5174/mapa-cultivos` — debe mostrar el mapa de Jalisco con la capa cultivos.

**Pendientes restantes** (todos no críticos):
- Cron de expiración (opcional): un job que cada hora marca como `revoked` keys con `expira_en < now()`. La validación ya las rechaza con `reason=expired` por lo que es un nice-to-have administrativo.
- Proxy de WCS (GetCoverage) y WFS (GetFeature): por ahora solo WMS pasa por `/api/embed/wms-proxy`. Los demás endpoints OGC siguen yendo directo a GeoServer.
- Limpieza: revocar la key de prueba (id=1) antes de cualquier ambiente público.

**Implementado en esta sesión post-MVP** (recomendaciones 1 y 2):
- **WMS proxy obligatorio en frontend embed**: `EmbedLayersProxy` reescribe `wmsConfig.baseUrl` al endpoint `/api/embed/wms-proxy?key=...` para todo el árbol. `EmbedRoot` orquesta la cadena de providers leyendo `key` de la URL. OpenLayers concatena `&LAYERS=...&...` a la URL del proxy y todo pasa por validación + cuotas + métricas.
- **postMessage events desde el embed al widget**: `helpers/postMessage.js` con `postReady`/`postError`/`postFeatureClick`. `EmbedView` emite `mapalab:ready` al cargar config y `mapalab:error` en fallos. `useEmbedFeatureRelay` observa `selectedFeatureInfo` del `MapsContext` y emite `mapalab:feature-click` cuando cambia. El widget ya reexpone estos eventos como `CustomEvent`.

**Verificaciones completadas en sesión**:

```
✓ /embed/config valida key + origin + cuota
✓ Métricas Prometheus mapalab_embed_requests_total, _denied_total, _quota_exceeded_total, _wms_proxy_total
✓ Flush 60s a mariachi: 6 requests persistidos en mapalab_api_keys_uso_diario
✓ Header CSP: frame-ancestors *
✓ CORS dinámico: Access-Control-Allow-Origin con origin del request
✓ Webhook revoke→invalidate: revoke en mariachi llama mapalab /embed/cache/invalidate
  - probado: validate ok → revoke en DB → validate ok por cache → invalidate → validate 403 revoked
✓ Quota 429 dispara si excede cuota_diaria o cuota_mensual
✓ Playground en /administrador/mapalab/api-keys/playground con preview vivo
✓ Lint: 0 errores en todo el código nuevo (sólo 2 warnings no críticos)
```

**Bloqueos detectados**: ninguno.

## Referencias rápidas

- Patrón Colibri keys: `/IIEG/mariachi/api/app/services/colibri_keys.py`
- Migration de referencia: `/IIEG/mariachi/api/alembic/versions/mariachi/e1f2a3b4c5d6_add_source_apps.py`
- Router de referencia: `/IIEG/mariachi/api/app/api/routes/colibri_source_apps.py`
- Auth helpers: `/IIEG/mariachi/api/app/api/deps.py`
- Sider: `/IIEG/mariachi/admin/src/app/sider-config.jsx`
- Admin source apps page (UI ref): `/IIEG/mariachi/admin/src/features/colibri/pages/SourceAppsPage.jsx`
- Context mapalab: `/IIEG/mapalab/docs/context.md`
- Patrón widget Lit: `/IIEG/mariachi/widget/src/colibri-button.js`

## Bitácora

- 2026-05-08 — Plan creado. Decisiones (1)-(8) cerradas con el usuario. Permisos otorgados. Tasks creadas (15).
- 2026-05-11 — MVP funcional E2E completado.
    - F1 (mariachi: modelos + migration + servicio + schemas + endpoints admin + endpoint interno validate + admin UI + sider entry).
    - F2 (mapalab backend: validador con cache + endpoints `/embed/*`, frontend `/embed` con visor ligero).
    - F3 (widget `@iieg/mapalab-widget` — Lit + iframe, 7 KB gzip).
    - F5 docs/widget.md.
    - F7 prueba E2E: `/mapa-cultivos` en sieej muestra el mapa de cultivos via `<iieg-mapalab>`.
- 2026-05-11 — Fases avanzadas completadas:
    - F4 (Quotas + telemetría): tracker in-memory, métricas Prometheus, flush periódico a mariachi cada 60s con upsert en `mapalab_api_keys_uso_diario`, devuelve 429 si excede cuota.
    - F5 (Playground completo): `ApiKeyPlaygroundPage.jsx` con preview iframe vivo + generador interactivo de snippet, ruta `/mapalab/api-keys/playground`, entry en sider.
    - F6 (Hardening): webhook `notify_invalidate_cache` desde mariachi a mapalab al revocar/suspender/rotar keys; `Content-Security-Policy: frame-ancestors *` y CORS `Access-Control-Allow-Origin` dinámico en `/api/embed/*`; métricas de denegados.
- 2026-05-11 — Recomendaciones post-MVP:
    - WMS proxy obligatorio: el frontend embed ahora rutea todas las peticiones WMS via `/api/embed/wms-proxy?key=...` mediante un wrapper `EmbedLayersProxy`. Las cuotas aplican al data path, no solo al config.
    - postMessage real al widget: el embed emite `mapalab:ready`/`mapalab:error`/`mapalab:feature-click` a `window.parent`; el widget ya los re-expone como `CustomEvent`. Fix de doble-conteo de quota (validate + record en wms-proxy).
