# Widget embebible `<iieg-mapalab>`

> Versión actual: **`1.1.0`** · Bundle ~23 KB / **8.4 KB gzip**

Web Component que permite a otras instituciones embeber el visor MapaLab en sus sitios mediante una API key administrada en mariachi. Monta un `<iframe>` aislado que renderiza el visor en `/embed` y captura métricas de Core Web Vitals desde el navegador del visitante.

## Quickstart en 30 segundos

```html
<!-- 1. Carga el widget -->
<script src="https://iieg.gob.mx/mapalab/widget/v1/mapalab.js" defer></script>

<!-- 2. Usa el custom element -->
<iieg-mapalab
    api-key="mk_pub_..."
    layers="economia:cultivos"
    height="500">
</iieg-mapalab>
```

Eso es todo. El widget se monta automáticamente cuando el navegador parsea el tag y carga el visor en un iframe.

## Obtener una API key

1. Pide acceso de administrador IIEG (rol `tetlamamakani`).
2. En el panel admin abre `/administrador/mapalab/api-keys`.
3. Click **"Nueva API key"** → llena institución, dominios permitidos y capas opcionales.
4. **Copia la key inmediatamente** — no se vuelve a mostrar. Solo queda el prefijo `mk_pub_xxxx…` en la BD.

El **panel administrativo** `/administrador/mapalab/api-keys` permite armar mapas inline con un selector visual de capas, previsualizar antes de entregar, guardar configuraciones como mapas permanentes (no expiran) y consultar el historial de accesos para auditoría. Las contraseñas de cada llave solo aparecen una vez al crearla o regenerarla.

## Atributos

| Atributo | Tipo | Default | Descripción |
|---|---|---|---|
| `api-key` | string | **requerido** | Key pública `mk_pub_…` emitida desde el admin. |
| `share` | string | `""` | Hash corto de un share guardado en mapalab (ej. `zoqpv4eu2t`). Si está presente, **ignora** `layers`/`center`/`zoom` y recrea el estado completo del share: capas, opacidades, filtros CQL, vista y simbología. |
| `layers` | string | `""` | Lista separada por comas de capas en formato `workspace:layer` o por id interno. Ej: `economia:cultivos,salud:hospitales`. Sólo se usa si **no** se pasó `share`. |
| `center` | string | "" | Coordenadas iniciales `lat,lng`. Si vacío, usa el centro default de Jalisco. |
| `zoom` | string | "" | Zoom inicial (1–20). |
| `basemap` | string | `osm` | Identificador del basemap. |
| `controls` | string | `zoom` | Controles a mostrar separados por coma: `zoom`, `fullscreen`, `search`. |
| `height` | string | — | Altura del componente. Acepta `500`, `100%`, `60vh`, etc. |
| `width` | string | `100%` | Ancho del componente. |
| `base-url` | string | `https://iieg.gob.mx` | Override del base URL — útil sólo para entornos locales/staging. En producción **no lo uses**. |
| `title` | string | `"Mapa MapaLab"` | Atributo `title` del iframe (accesibilidad). |
| `ready-timeout-ms` | number | `8000` | Milisegundos a esperar a que el visor emita `mapalab:ready` antes de mostrar el fallback. |

## Usar un share (recomendado para combinaciones complejas)

El visor full de mapalab tiene un botón **"Compartir"** que serializa el estado actual del mapa (capas activas, opacidades, filtros CQL aplicados, simbología, vista) y lo guarda en el backend con un hash corto.

Ese hash funciona directo en el widget:

```html
<iieg-mapalab
    api-key="mk_pub_…"
    share="zoqpv4eu2t"
    height="500">
</iieg-mapalab>
```

Ventajas frente a listar `layers`:

- **Configuración compleja sin construir URL**: opacidades, filtros, orden de pintado, simbología.
- **Validado por humanos**: el usuario que crea el share ya vio que las capas se ven bien juntas.
- **Inmutable**: el hash siempre devuelve el mismo estado.
- **Compartible**: el mismo hash funciona en `https://iieg.gob.mx/mapalab/mapa?s=<hash>` para visualizar en el visor full.

### Generar un share desde el admin

1. Abrir `/mapalab/mapa` (visor full).
2. Activar las capas, aplicar filtros, mover el mapa al área de interés.
3. Click en el botón **"Compartir"** → modal con la URL.
4. Copiar el `hash` del final de la URL (`?s=<hash>`) y pegarlo en el atributo `share` del widget.

Los shares creados desde la UI son **temporales** (90 días). Para que un embed funcione indefinidamente, un admin debe **anclar** (pin) el share desde el endpoint interno `POST /shares/{id}/pin-permanent` para que no expire.

## Identificar capas: formato `workspace:layer`

El sistema acepta capas en dos formatos:

1. **`workspace:geoserverLayer`** — busca **todos** los nodos del árbol cuyo wmsConfig tenga ese workspace y geoserverLayer. Activa todas las subcapas que compartan ese layer (típico para datasets clasificados como cultivos o delitos).
2. **`id_interno`** — activa una capa específica por su `id` exacto del árbol (ej. `agave`, `homicidio_doloso`).

Para ver las capas disponibles, consulta `/mapalab/api/layers/tree` o usa el Playground del admin.

### Ejemplos

```html
<!-- Una sola capa: clasificador completo de cultivos (activa 8 subcapas) -->
<iieg-mapalab api-key="mk_pub_…" layers="economia:cultivos" height="500"></iieg-mapalab>

<!-- Múltiples capas: indicadores sociales combinados -->
<iieg-mapalab
    api-key="mk_pub_…"
    layers="general:limite_municipal,desarrollo:rezago_educativo,desarrollo:carencia_acceso_servicios_salud"
    height="600">
</iieg-mapalab>

<!-- Capa individual por id, centrado y zoom específico -->
<iieg-mapalab
    api-key="mk_pub_…"
    layers="agave"
    center="20.5,-103.5"
    zoom="9"
    height="500">
</iieg-mapalab>
```

## Eventos (postMessage → CustomEvent)

El iframe del embed emite mensajes al `window.parent` y el widget los reexpone como eventos custom del elemento:

| Evento | Cuándo | Payload |
|---|---|---|
| `mapalab:ready` | Visor montado y key validada | `{ institucion, visibility, requestedLayers, capasPermitidas }` |
| `mapalab:error` | Validación falla o key inválida | `{ code, message }` |
| `mapalab:timeout` | El iframe no emitió `mapalab:ready` antes del límite (`ready-timeout-ms`) | `{ ms, reason: 'no_ready_received' }` |
| `mapalab:feature-click` | Usuario hace click en una feature | `{ layerId, featureId, properties }` |

```javascript
const el = document.querySelector('iieg-mapalab');

el.addEventListener('mapalab:ready', (e) => {
    console.log('Mapa listo para:', e.detail.institucion);
});

el.addEventListener('mapalab:feature-click', (e) => {
    const { layerId, featureId, properties } = e.detail;
    // Mostrar info del feature en tu UI propia, integrar con analytics, etc.
});

el.addEventListener('mapalab:error', (e) => {
    console.error('Error en widget:', e.detail.code, e.detail.message);
});
```

## Routing y validación

Cada request del visor pasa por el backend de mapalab con la API key:

```
1. Widget (host externo)
   └── monta <iframe src="https://iieg.gob.mx/mapalab/embed?key=...&layers=...">
2. Iframe carga el SPA ligero del visor
3. SPA hace GET /mapalab/api/embed/config?key=...
   └── backend valida key + origin + cuota → responde 200 o 4xx
4. Por cada tile WMS, SPA hace GET /mapalab/api/embed/wms-proxy?LAYERS=...&key=...&...
   └── backend valida key + capa allowlist + cuota
   └── reenvía al GeoServer interno y devuelve el PNG
```

**Cuotas y restricciones** se aplican al **data path completo** (no sólo al config), así que un cliente que exceda su cuota diaria deja de recibir tiles.

## Restricciones de la API key

Cuando creas o editas una key, configuras:

- **Dominios permitidos** (`dominios_permitidos`): allowlist de orígenes. Para keys públicas **es obligatorio** tener al menos uno. Soporta wildcards: `*.iieg.gob.mx`, `https://mi-app.dependencia.gob.mx`.
- **IPs permitidas** (sólo keys privadas `mk_priv_…`): allowlist de IPs server-to-server.
- **Capas permitidas** (`capas_permitidas`): si vacío, permite todas las capas públicas. Si tiene entradas, sólo se pueden pedir esas capas (`workspace:layer`).
- **Cuota diaria** (`cuota_diaria`): max requests/día. Excedidas → `429`.
- **Cuota mensual** (`cuota_mensual`): max requests/mes.
- **Estado** (`active` / `suspended` / `revoked`): controla si la key se acepta.
- **Expiración** (`expira_en`): timestamp opcional para rotación automática.

## CSP y headers de seguridad

El backend envía:

- `Content-Security-Policy: frame-ancestors *` en `/embed` y `/api/embed/*` → permite que **cualquier sitio** monte el iframe (la restricción real está en `dominios_permitidos`).
- `Access-Control-Allow-Origin: <origen específico>` en respuestas — refleja exactamente el origin del request, nunca `*`.
- `X-Frame-Options` **no se setea** en `/embed` (sustituido por `frame-ancestors`).

Si tu host tiene un CSP estricto, asegúrate de permitir `frame-src https://iieg.gob.mx` o el dominio real desde el que se sirve el widget.

## Versionado

Servimos el bundle con URL versionada en el path:

- `https://iieg.gob.mx/mapalab/widget/v1/mapalab.js` → **inmutable**, cache 1 año. Pega esta URL en producción.
- `https://iieg.gob.mx/mapalab/widget/latest/mapalab.js` → rolling release, cache corto. Sólo para desarrollo o si quieres seguir mejoras automáticas.

Cuando salga `v2` con breaking changes, `v1` seguirá funcionando indefinidamente para clientes que no quieran actualizar.

## Fallback y degradación elegante

Cuando algo falla, el widget no se queda en blanco. Hay tres caminos:

1. **Falta `api-key`** → overlay con mensaje al administrador del sitio.
2. **El visor emite `mapalab:error`** (key inválida, sitio no autorizado, capa fuera de allowlist, cuota agotada) → overlay con el mensaje específico devuelto por el backend.
3. **No se recibe `mapalab:ready` antes de `ready-timeout-ms`** → overlay "El mapa está tardando en cargar" y se dispara `mapalab:timeout`.

En los tres casos el overlay incluye:

- Botón **Reintentar** (recarga el iframe).
- Link **Abrir el mapa en MapaLab** (visor completo del IIEG en pestaña nueva, con los mismos `share` o `layers`).

El widget también pinta un footer pequeño "Fuente: IIEG" en la esquina inferior derecha mientras el mapa está cargado, como atribución obligatoria (no se puede ocultar).

## Métricas y administración

Backend (Prometheus en `/api/metrics`):

- `mapalab_embed_requests_total{endpoint, prefix}` — peticiones permitidas.
- `mapalab_embed_denied_total{endpoint, reason}` — rechazadas (sitio no autorizado, capa no permitida, etc.).
- `mapalab_embed_quota_exceeded_total{prefix}` — llaves que alcanzaron su tope.
- `mapalab_embed_wms_proxy_total{prefix}` — proxy de tiles WMS.
- `mapalab_embed_telemetry_total{prefix}` — payloads de telemetría recibidos.
- `mapalab_embed_vital_ms{metric, prefix}` — histograma de Core Web Vitals (`LCP`, `CLS` (×1000), `INP`, `FCP`, `TTFB`, `IFRAME_READY`).
- `mapalab_embed_js_errors_total{prefix}` — errores JavaScript reportados desde el visor embebido.

Auditoría detallada en mariachi (tabla `mapalab_api_keys_accesos`, retención 90 días):

- Cada acceso se registra con `(timestamp, api_key_id, origin, capas, ip_hash, resultado, motivo)`.
- Consultable desde el admin: tab **Auditoría** dentro del panel de cada llave con filtros (rango de fechas, sitio, capa, resultado).
- Pensada para responder solicitudes de jurídico/transparencia: "¿quién embebió la capa X desde el dominio Y en el periodo Z?".

Operación cotidiana desde el admin (`/administrador/mapalab/api-keys`):

- Crear/editar llaves con sitios autorizados, capas permitidas y cuotas.
- Generar contraseña nueva (rotar) cuando una llave se compromete.
- Pausar/reactivar/cancelar llaves.
- Guardar mapas como permanentes (no expiran) eligiendo capas + vista o pegando un código existente.
- Previsualizar el mapa con la contraseña real antes de entregarlo.

Al rotar/cancelar/pausar, mariachi llama a `POST /embed/cache/invalidate` para purgar el cache de validación de mapalab-backend al instante.

## Limitaciones conocidas

- WCS (GetCoverage) y WFS (GetFeature) **no pasan** por el proxy todavía — están planeados para una versión siguiente. Las capas raster y descargas vectoriales no aplican cuotas por key.
- El visor del embed es **read-only**: no incluye herramientas de dibujo, medición, swipe ni edición. Para esos casos usa el visor full en `/mapa`.
- La expiración automática de keys (`expira_en < now()`) **no marca** la key como revocada; sólo se rechaza con `reason=expired` al validar. La key queda en estado `active` en la BD.

## Demo en vivo

Si tienes acceso al panel admin del IIEG, puedes ver dos instancias del widget funcionando juntas en `https://iieg.gob.mx/sieej/mapa-cultivos`:

1. **Una sola capa**: clasificador completo de cultivos.
2. **Múltiples capas combinadas**: límites municipales + rezago educativo + carencia de acceso a salud.
