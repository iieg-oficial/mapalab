# Plan: Slugs públicos + Shares hasheados (URL state v2)

> **Estado:** Diseño, sin iniciar implementación. Sustituye al sistema actual de `?layers=id1,id2,...` por slugs públicos (deeplinks por capa, ocultar IDs internos de GeoServer) y agrega un sistema de snapshots persistidos en DB para casos donde la URL viva resulta impráctica (comparador, CQL pesado, share permanente).

## 1. Contexto y objetivos

### Pain points actuales

1. **URL larga**: con varias capas activas + filtros CQL la URL crece rápidamente. Para el comparador (dos estados side-by-side) excedería límites prácticos de navegadores y clientes de correo (>2KB).
2. **Exposición de IDs**: los `id` internos de capas (que coinciden con nombres de GeoServer) van expuestos en `?layers=tasa_feminicidios,...`. No es secreto crítico, pero es información de infraestructura interna que no necesita salir al cliente.
3. **Sin deeplinks por capa**: no existe forma de teclear `/establecimientos-salud` y aterrizar con esa capa activa. Todos los links requieren conocer el formato `?layers=...`.
4. **Sin snapshots persistentes**: si una capa se renombra o se elimina, los links viejos quedan rotos. No hay forma de "fijar" un estado a un momento en el tiempo.

### Objetivos

- Slugs descriptivos públicos que reemplacen los IDs internos en la URL viva (`?layers=establecimientos-salud,...`).
- Aliases cortos opcionales por capa (`?layer=esalud` resuelve igual que `?layer=establecimientos-salud`).
- Endpoint de snapshots: `POST /shares` mintea un hash corto que persiste el estado completo del mapa en DB.
- Comparador por fecha (axis = periodicidad) reusa la misma infraestructura de snapshots.
- Política de retención automática (sliding window 30 días) + opción de "fijar" un share por 1 año.
- Sin clonar rutas: la UI de comparador vive en la misma `/mapa` con render condicional.

### Decisiones lockeadas

| Decisión | Valor | Razón |
|---|---|---|
| Slugs en estado vivo | Siempre | URL legible, indexable, sin roundtrip |
| Hash | Sólo en click "Compartir" o entrar a comparador | El estado vivo cubre el 95% de los casos |
| Aliases | Desde v1 | Permite `/esalud` (corto) sin perder el slug canónico (descriptivo) |
| Hashes | Anónimos | Login ciudadano viene en v1.9, no bloquear esta feature |
| Comparador | Misma ruta `/mapa`, render condicional | Reutiliza `MapsProvider` y todos sus hooks |
| Retención default | Sliding 30 días desde `last_accessed_at` | Estándar para shortlinks no permanentes |
| Pinning | Opcional, 1 año desde `pinned_at` | UI muestra botón "fijar este enlace" |
| `urlshiquititas` | Fuera de scope | Schema-aware vs. blob genérico — problemas distintos |

## 2. Sintaxis de slugs

### Reglas

- Sólo `[a-z0-9-]`, lowercase, ASCII puro
- Sin acentos ni ñ (transliterate: `economia`, `ensenanza`)
- Sin underscores ni espacios — kebab-case (`-`)
- Máximo 60 chars
- Único por capa en `mapalab.layers.slug`
- Mariachi sugiere automáticamente desde `name` con un slugifier; usuario puede editarlo

### Aliases

- Tabla `mapalab.layer_aliases (alias, layer_id, created_by, created_at)`
- Mismas reglas de sintaxis que slug
- Único globalmente (un alias resuelve a una sola capa)
- Al chocar alias con un slug canónico existente, gana el slug
- Mariachi tiene UI para administrar aliases (lista por capa, agregar/quitar)

### Ejemplos

| Capa | Slug canónico | Aliases sugeridos |
|---|---|---|
| Establecimientos de salud | `establecimientos-salud` | `esalud`, `salud` |
| Escuelas públicas | `escuelas-publicas` | `escuelas` |
| Tasa de feminicidios | `tasa-feminicidios` | `feminicidios` |
| Carreteras estatales | `carreteras` | — |

## 3. Forma del JSON persistido

El JSON guardado en `mapalab.map_shares.payload` debe capturar **todo** el estado reproducible del mapa: orden, visibilidad, opacidad, filtros, periodicidad, loop, basemap, vista. Lo que se excluye queda explicitado al final.

### 3.1 `kind: "single"`

```json
{
  "version": 1,
  "kind": "single",
  "payload": {
    "view": {
      "zoom": 12.50,
      "lat": 20.659698,
      "lon": -103.348236,
      "rotation": 0
    },
    "basemap": "osm-standard",
    "selected": "establecimientos-salud",
    "layers": [
      {
        "slug": "establecimientos-salud",
        "visible": true,
        "opacity": 1.0,
        "filters": {
          "date": "2024-01-01",
          "tipo": "publico"
        }
      },
      {
        "slug": "carreteras",
        "visible": false,
        "opacity": 0.65,
        "filters": {}
      }
    ],
    "loop": {
      "layerSlug": "establecimientos-salud",
      "mode": "year",
      "intervalMs": 1000,
      "direction": "ltr",
      "playing": true,
      "currentValue": "2023-01-01"
    }
  }
}
```

**Notas de campos:**
- `layers[]` — el orden del array es el z-order de renderizado (primero = abajo). No hay campo `order` separado.
- `visible: false` — capa cargada pero oculta vía toggle de simbología (lo que hoy vive en `hiddenLayerIds`).
- `opacity` — 0.0 a 1.0, dos decimales.
- `filters` — los CQL por nombre lógico (`date`, `tipo`, etc.). Las keys con prefijo `_` (internas) NO se persisten.
- `loop` — `null` si no hay loop activo. Sólo una capa puede estar en loop a la vez (matches behavior actual de `useDateLoop`).
- `selected` — slug de la capa con simbología abierta. `null` si ninguna.
- `view.rotation` — para futuro; hoy siempre 0.

### 3.2 `kind: "compare"`

```json
{
  "version": 1,
  "kind": "compare",
  "payload": {
    "base": {
      "view": { "zoom": 12.5, "lat": 20.65, "lon": -103.34, "rotation": 0 },
      "basemap": "osm-standard",
      "selected": "tasa-feminicidios",
      "layers": [
        { "slug": "tasa-feminicidios", "visible": true, "opacity": 1.0, "filters": {} }
      ],
      "loop": null
    },
    "axis": "date",
    "panes": [
      { "value": "2020-01-01", "label": "Antes" },
      { "value": "2024-01-01", "label": "Después" }
    ]
  }
}
```

**Notas:**
- `base.payload` tiene exactamente la misma forma que `single.payload` → reutiliza serializer/deserializer.
- `axis: "date"` deja la puerta abierta para `"filter"`, `"geo"` u otros sin migración del shape.
- `panes[].value` se aplica a **todas** las capas con `timeEnabled` o filter `date` en `base.layers`. Capas sin componente temporal renderizan idénticas en ambos paneles.
- `panes[].label` opcional; UI muestra el `value` formateado si falta.
- 2+ paneles soportados por shape, aunque la UI v1 sólo renderiza 2.
- En modo compare, `base.loop` se ignora — no tiene sentido animar mientras comparas frames específicos.

### 3.3 Lo que NO se persiste (explícito)

- Mediciones y dibujos transientes (`useMapDrawing`) — lifecycle de UI, no de mapa
- Edición en-mapa (`useMapEditing`) — misma razón
- InfoBox abierto / posición de popups — UI transient
- Estado de búsqueda (`SearchContext`) — UI transient
- Estado del Sider (collapsed, hover, lockMode) — preferencia de UI por sesión
- Caché en memoria de periodicidad (`usePeriodicityCache`) — derivado, no estado

Si en el futuro se decide persistir alguno (drawings serían los primeros candidatos), se versiona a `version: 2` con campo opcional sin migración destructiva.

## 4. Migraciones de DB

Se aplican en `mapalab-dataengine` vía Alembic.

### 4.1 Schema `mapalab`

```sql
ALTER TABLE mapalab.layers
    ADD COLUMN slug VARCHAR(60) UNIQUE;

CREATE INDEX idx_layers_slug ON mapalab.layers(slug);

CREATE TABLE mapalab.layer_aliases (
    alias VARCHAR(60) PRIMARY KEY,
    layer_id VARCHAR NOT NULL REFERENCES mapalab.layers(id) ON DELETE CASCADE,
    created_by VARCHAR,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT alias_format CHECK (alias ~ '^[a-z0-9-]+$' AND length(alias) <= 60)
);

CREATE INDEX idx_layer_aliases_layer_id ON mapalab.layer_aliases(layer_id);

CREATE TABLE mapalab.map_shares (
    id VARCHAR(10) PRIMARY KEY,            -- hash corto base32, 8-10 chars
    payload JSONB NOT NULL,
    kind VARCHAR(16) NOT NULL,             -- "single" | "compare"
    schema_version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    access_count INT NOT NULL DEFAULT 0,
    pinned_until TIMESTAMPTZ NULL,         -- si NOT NULL, exento de cleanup hasta esa fecha
    created_ip_hash VARCHAR(64) NULL,      -- SHA256(ip + salt) para rate limiting básico
    CONSTRAINT kind_valid CHECK (kind IN ('single', 'compare'))
);

CREATE INDEX idx_map_shares_last_accessed ON mapalab.map_shares(last_accessed_at) WHERE pinned_until IS NULL;
CREATE INDEX idx_map_shares_pinned ON mapalab.map_shares(pinned_until) WHERE pinned_until IS NOT NULL;
```

### 4.2 Generación del hash

- Algoritmo: SHA-256 del JSON canonicalizado, truncado a 50 bits → base32 → 10 chars
- Canonicalización: keys ordenadas alfabéticamente, sin whitespace, números con precisión fija (zoom 2 decimales, lat/lon 6, opacity 2)
- Beneficio: dos usuarios que arman exactamente el mismo mapa producen el mismo hash → deduplicación automática (`INSERT ... ON CONFLICT (id) DO UPDATE SET last_accessed_at = NOW()`)
- Colisiones a 50 bits: cumple paradoja del cumpleaños con margen para >1M shares

## 5. Backend (mapalab)

### 5.1 Endpoints nuevos

| Método | Ruta | Función |
|---|---|---|
| `POST` | `/shares` | Recibe JSON del estado, valida shape, mintea/devuelve hash |
| `GET` | `/shares/{id}` | Devuelve payload, bumpea `last_accessed_at` y `access_count` |
| `POST` | `/shares/{id}/pin` | Setea `pinned_until = NOW() + 1 year` |
| `DELETE` | `/shares/{id}/pin` | Limpia `pinned_until` (vuelve a sliding window) |

### 5.2 Endpoints modificados

| Método | Ruta | Cambio |
|---|---|---|
| `GET` | `/layers/tree` | Cada nodo leaf incluye `slug` además de `id`. Backend mantiene mapa interno `slug → id` para resolver requests. |
| `GET` | `/layers/search` | Resultados incluyen `slug`. |
| `GET` | `/layers/resolve?ref=<slug-or-alias>` | Nuevo: dado slug o alias, devuelve metadata de capa (id, slug canónico, nombre, workspace). Útil para deeplink `?layer=<slug>`. |

### 5.3 Validación del payload de `POST /shares`

- JSON Schema validation contra el shape de la sección 3
- Todos los `slug` referenciados deben existir en `mapalab.layers.slug` (rechaza si no)
- `view.zoom` en rango configurado (typically 2-22)
- `opacity` en [0, 1]
- Tamaño máximo del payload: 64 KB (defensivo; un mapa típico es <2 KB)

### 5.4 Rate limiting

- `POST /shares`: 10 req/min por `created_ip_hash`
- `GET /shares/{id}`: sin límite (cacheable, idempotente)
- Implementación: in-memory token bucket por IP hash (mismo patrón que el rate limiter en memoria de v1.6.0)

### 5.5 Cron de cleanup

Vive en `dataengine-jobs` (no en mapalab backend), nuevo script `run_cleanup_shares.py`:

```sql
DELETE FROM mapalab.map_shares
WHERE pinned_until IS NULL
  AND last_accessed_at < NOW() - INTERVAL '30 days';

DELETE FROM mapalab.map_shares
WHERE pinned_until IS NOT NULL
  AND pinned_until < NOW();
```

Ejecutar diario a las 04:45 (después de los otros refresh jobs). Loggear cantidad eliminada a Loki.

## 6. Frontend

### 6.1 `useUrlSync.js` y `useInitializeFromUrl.js`

**Cambio principal:** operar en `slug` en lugar de `id`. La conversión `slug ↔ id` ocurre al cruzar la frontera con el árbol de capas.

```javascript
// Lookup helpers (LayersProvider)
const layerBySlug = (slug) => layerTree.find(l => l.slug === slug || l.aliases?.includes(slug));
const slugById = (id) => layerTree.find(l => l.id === id)?.slug;
```

`useUrlSync` cambia:
- `?layers=<slug>,...&filter_<slug>=...` (en lugar de `<id>`)
- Selección: `?layers=...,*<slug>,...`

`useInitializeFromUrl` cambia:
- Resuelve cada slug a id antes de aplicar `setActiveLayerIds`
- Si un slug no resuelve, lo ignora con warning (link viejo a capa eliminada)
- Soporta `?layer=<slug-or-alias>` (singular) como deeplink que activa esa única capa con su `defaultDate`

### 6.2 Nuevo hook `useShareSerializer`

Centraliza la serialización del estado actual del mapa al shape JSON de la sección 3:

```javascript
// frontend/src/pages/maps/hooks/useShareSerializer.js
export const useShareSerializer = () => {
    const { activeLayerIds, filters, hiddenLayerIds, opacities, selectedLayerForSymbology } = useMaps();
    const { loop } = useDateLoop();
    const { view } = useMapView();
    const { basemap } = useBasemap();
    const { layerTree } = useLayers();

    return useMemo(() => buildSinglePayload({...}), [...]);
};
```

Output: el `payload` listo para `POST /shares`.

### 6.3 Nuevo hook `useShareDeserializer`

Inverso: dado un `payload` (resuelto desde `GET /shares/{id}`), aplica todo el estado al mapa.

Reutiliza la lógica de `useInitializeFromUrl` pero parte de un objeto en memoria, no de query params.

### 6.4 Modal "Compartir"

Componente nuevo `<ShareModal>`:
- Botón principal "Crear enlace" → `POST /shares` → muestra URL `?s=<id>`
- Botón "Copiar"
- Botón "Fijar por 1 año" → `POST /shares/<id>/pin`
- Indica visualmente si el share está pinned o no
- Texto explicativo: "Los enlaces se conservan 30 días desde el último uso. Fija el enlace para garantizar 1 año."

Se monta como acción del menú principal del Sider, junto al export del mapa actual.

### 6.5 Detección de hash en `useInitializeFromUrl`

Orden de precedencia al inicializar:
1. Si hay `?s=<id>` → fetch `GET /shares/<id>` → si `kind: "compare"` activa modo comparador → aplica payload
2. Si hay `?layer=<slug>` → resolve via `/layers/resolve` → activa única capa
3. Si hay `?layers=<slug>,...` → ruta actual con slugs (estado vivo)
4. Sin params → home del mapa (capas iniciales)

Si el hash no resuelve (404), mostrar toast "Este enlace ya no está disponible" y caer a default (sin params).

### 6.6 Comparador

**No se crea ruta nueva.** El componente raíz de `<Maps>` decide qué renderizar:

```jsx
const Maps = () => {
    const { mode } = useMapMode(); // 'single' | 'compare'
    return mode === 'compare' ? <CompareView /> : <MapView />;
};
```

`<CompareView>` (nuevo, ~150 líneas):
- Split horizontal/vertical configurable
- Renderiza dos `<MapView>` instances internamente
- Cada panel recibe un `paneIndex` por context
- Sincroniza pan/zoom entre paneles (mover uno mueve el otro)
- Header de cada panel muestra el `label` y un selector de fecha (cambia `pane.value`)

Nuevo hook `useDateOverride(paneIndex)`:
- Lee `panes[paneIndex].value` del estado de comparador
- Inyecta ese valor a `applyFilter(layerId, 'date', value)` para todas las capas con componente temporal
- Funciona como override transient — no muta el state base, sólo lo overlaying al renderizar

`MapsProvider` extiende su contrato con un campo `compareMode: { active: bool, axis, panes }`. Default `active: false` para no afectar el caso normal.

### 6.7 Botón "Comparar fechas"

- Se monta en el panel de simbología cuando la capa seleccionada tiene `timeEnabled` o filter `date`
- Click abre modal de selección de dos fechas → al confirmar, mintea share con `kind: "compare"` y navega a `?s=<id>`
- Alternativamente, "Comparar" sin mintar hash todavía (transient): activa compare mode con valores en memoria; sólo al click "Compartir" se mintea

## 7. Cambios en mariachi (CMS)

Mariachi vive fuera de este repo (`/IIEG/mariachi`), pero necesita cambios coordinados:

1. **Form de capa:** campo `slug` con sugerencia automática desde `name`, validación contra regex, check de unicidad en blur.
2. **Form de aliases por capa:** lista CRUD bajo cada capa (agregar/eliminar aliases).
3. **Validación cross-capa:** un alias no puede colisionar con un slug canónico existente ni con otro alias.
4. **Bulk slug generator:** acción para auto-generar slugs faltantes en capas existentes (útil para el seed inicial — ver sección 8).

## 8. Seed inicial (250 capas existentes)

### 8.1 Estrategia

1. **Pre-migración:** correr script Python en mariachi que para cada capa sin `slug` genera uno desde `name` usando `python-slugify` (transliterate, lowercase, kebab).
2. **Resolver colisiones:** si dos capas generan el mismo slug, agregar sufijo numérico (`-2`, `-3`).
3. **Review humano:** mariachi muestra dashboard con los slugs generados; equipo IIEG revisa y ajusta los que se vean raros antes del cutover.
4. **Cutover:** hacer `slug` NOT NULL una vez todas las capas tengan valor. Antes de cutover, frontend y backend siguen aceptando `id` legacy (ver 8.2).

### 8.2 Compatibilidad legacy durante migración

Por ~2 releases, frontend/backend aceptan tanto `slug` como `id` en query params:

```javascript
// useInitializeFromUrl
const ref = params.get('layer'); // could be slug, alias, or legacy id
const layer = layerBySlug(ref) || layerById(ref);
```

`useUrlSync` siempre escribe slug. Eventualmente (v1.9+) se elimina la rama de fallback a id.

## 9. Política de retención (resumen)

| Caso | Retención | Cómo se extiende |
|---|---|---|
| Share normal | 30 días desde último acceso | `GET /shares/{id}` bumpea `last_accessed_at` |
| Share pinned | 1 año desde `pinned_at` | Click "Fijar" en modal |
| Share huérfano (capa eliminada) | Igual que normal | Se devuelve con flag `partial: true` y lista de slugs no resueltos; UI advierte al usuario |

## 10. Métricas y observabilidad

Agregar a `/metrics` (Prometheus):
- `mapalab_shares_created_total{kind}` — counter por kind
- `mapalab_shares_accessed_total` — counter
- `mapalab_shares_pinned_total` — counter
- `mapalab_shares_active_gauge{kind, pinned}` — gauge actual
- `mapalab_shares_payload_bytes` — histogram

Loggear a Loki:
- Cleanup diario (cantidad eliminada por categoría)
- Shares con payload >32 KB (señal de algo raro en serialización)
- 404s en `GET /shares/{id}` (link rot)

Eventos analytics (`window.dataLayer`):
- `share_create { kind }`
- `share_open { kind, age_days }`
- `share_pin`
- `compare_open`

## 11. Plan de rollout

### Fase 1 — Slugs (sin shares)
- Migración DB: agregar `slug` y `layer_aliases`, seed de slugs
- Backend: `slug` en `/layers/tree`, endpoint `/layers/resolve`
- Frontend: `useUrlSync`/`useInitializeFromUrl` operan en slugs, soporte de `?layer=<slug>`
- Mariachi: form de slug + aliases
- Compatibilidad legacy con `id`
- **Entregable:** deeplinks por capa funcionan; URL viva muestra slugs; no hay shares todavía

### Fase 2 — Shares single-state
- Migración DB: tabla `map_shares`, índices
- Backend: endpoints `POST /shares`, `GET /shares/{id}`, `POST /shares/{id}/pin`
- Frontend: `useShareSerializer`, `useShareDeserializer`, modal Compartir
- Cron de cleanup en `dataengine-jobs`
- Métricas Prometheus + analytics
- **Entregable:** botón Compartir funcional con persistencia y pinning

### Fase 3 — Comparador
- Frontend: `<CompareView>`, `useDateOverride`, botón "Comparar fechas"
- Backend: validación adicional para `kind: "compare"`
- **Entregable:** comparador por fecha en producción

Cada fase es shippeable independientemente; entre fases la versión sigue siendo funcional.

## 12. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Slug colisiona con alias | Alias no funciona | Constraint en DB + validación en mariachi al crear |
| Capa renombrada/eliminada con shares apuntando a ella | Link roto | Devolver `partial: true` con slugs no resueltos; UI advierte |
| Hash duplicado por colisión SHA truncado | Pisar share existente | Probabilidad astronómica a 50 bits; mitigación: el ON CONFLICT actualiza `last_accessed_at`, no destruye payload (idempotente porque inputs iguales = output igual) |
| Crecimiento descontrolado de la tabla | Storage | Cron diario + alerta Prometheus si >1M filas activas |
| Abuso del endpoint para storage gratis | Spam | Rate limiting + tamaño máximo de payload (64 KB) |
| Mariachi tarda en agregar form de aliases | Bloquea fase 1 | Fase 1 puede shippear con sólo slug auto-generado; aliases se agregan después |

## 13. Pendientes / fuera de scope

- **Login ciudadano + shares por usuario** — viene en v1.9. Hoy todos los shares son anónimos.
- **Listado de "mis shares"** — depende del login.
- **Drawings/mediciones en payload** — postpuesto a v2 del schema. El campo se reserva opcional.
- **Comparador por axis distinto a date** (filter, geo) — el shape lo soporta; UI viene después.
- **Sincronización pan/zoom desacoplada en comparador** — v1 los liga; "desligar" viene como toggle en versión posterior.
- **Preview del share antes de copiar** — nice to have, no v1.

## 14. Archivos afectados (resumen)

### mapalab-dataengine
- `alembic/versions/<new>_add_slugs_and_shares.py`
- `dataengine_jobs/run_cleanup_shares.py`
- `dataengine_jobs/cron.d/mapalab` — agregar línea para `04:45`

### mapalab backend
- `app/routers/shares.py` — nuevo
- `app/routers/layers.py` — endpoint `/layers/resolve`, incluir `slug` en tree
- `app/repositories/share_repository.py` — nuevo
- `app/models/share.py` — nuevo (SQLAlchemy)
- `app/services/share_validator.py` — nuevo
- `app/server.py` — registrar nuevo router

### mapalab frontend
- `src/pages/maps/hooks/useUrlSync.js` — operar en slugs
- `src/pages/maps/hooks/useInitializeFromUrl.js` — slugs + detección de `?s=` y `?layer=`
- `src/pages/maps/hooks/useShareSerializer.js` — nuevo
- `src/pages/maps/hooks/useShareDeserializer.js` — nuevo
- `src/pages/maps/hooks/useDateOverride.js` — nuevo
- `src/pages/maps/components/ShareModal.jsx` — nuevo
- `src/pages/maps/components/CompareView.jsx` — nuevo
- `src/pages/maps/Maps.jsx` — render condicional
- `src/services/shareService.js` — nuevo
- `src/providers/MapsProvider.jsx` — extender con `compareMode`

### mariachi (repo aparte)
- Form de capa: campo `slug` + sugerencia automática
- Form de aliases por capa
- Bulk slug generator
