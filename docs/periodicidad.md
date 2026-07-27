# Periodicidad

Sistema de filtrado temporal para capas WMS. Permite al usuario navegar por periodos (años, meses, días) y controla cómo las capas filtran sus datos en GeoServer.

## Tipos de periodicidad

### 1. Periodicidad vectorial (CQL_FILTER)

Capas vectoriales que filtran por columna `fecha` usando CQL_FILTER. La periodicidad viene del endpoint de metadata del backend.

**Flujo:**
1. Capa se activa
2. `LayerDetailModal` carga metadata vía `useLayerMetadata`
3. `metadata.periodicity` contiene la estructura de fechas disponibles
4. `SimpleDateSelector` permite navegar años/meses
5. Se genera CQL_FILTER y se aplica vía `useCQLFilter.applyFilter`
6. `useWMSFilterUpdater` actualiza los params WMS del source

**Estructura de periodicidad (del backend):**
```json
{
  "fecha": {
    "2025": {
      "1": null,
      "2": null,
      "6": null
    },
    "2024": {
      "1": null,
      "12": null
    }
  }
}
```

**CQL generado:**
- Año completo: `(fecha >= '2024-01-01' AND fecha < '2025-01-01')`
- Mes: `(fecha >= '2024-06-01' AND fecha < '2024-07-01')`
- Múltiples meses: `((fecha >= '2024-01-01' AND fecha < '2024-02-01') OR (fecha >= '2024-06-01' AND fecha < '2024-07-01'))`

**Archivos clave:**
- `frontend/src/pages/maps/helpers/dateFilterHelpers.js` — `generateCQLFilter`, `parseCQLToSelections`
- `frontend/src/pages/maps/components/LayerDetailModal/components/SimpleDateSelector.jsx`
- `frontend/src/pages/maps/components/LayerDetailModal/components/DateTreeSelector.jsx`

---

### 2. Periodicidad raster (TIME dimension)

Capas raster (ImageMosaic en GeoServer) que usan el parámetro WMS `TIME` en vez de CQL_FILTER.

**Configuración en definición de capa:**
```js
{
    id: 'temperatura_media_mensual',
    wmsConfig: createRasterLayer('temperaturas', {
        timeEnabled: true,
        wmsGroup: 'temp_mensual'
    }),
    rasterPeriodicity: buildMonthlyTime([2025])
}
```

**Propiedades WMS:**
- `timeEnabled: true` — indica que la capa usa TIME dimension
- `timeStylePattern` — patrón para STYLES dinámicos por TIME (ej: `lluvia_total_mensual_{year}_{month}`)
- `wmsGroup` — cada capa raster necesita un wmsGroup único para evitar merge de requests

**Flujo:**
1. Capa se activa → `useDateLoop` aplica TIME del último mes disponible del año más reciente
2. `useWMSFilterUpdater` detecta `timeEnabled` y usa `TIME` param en vez de `CQL_FILTER`
3. Si tiene `timeStylePattern`, resuelve el estilo dinámico con `resolveTimeStyle`
4. `SimpleDateSelector` muestra meses con botón play/pause para animación

**Estructura de rasterPeriodicity:**
```js
{
    2025: {
        1: "2025-01-01",   // valor TIME ISO
        2: "2025-02-01",
        // ...
        12: "2025-12-01"
    }
}
```

**Archivos clave:**
- `frontend/src/pages/maps/helpers/layers/definitions/recursos.js` — definiciones de capas raster
- `frontend/src/pages/maps/hooks/useDateLoop.js` — animación de loop temporal
- `frontend/src/pages/maps/hooks/useWMSFilterUpdater.js` — aplica TIME y STYLES
- `frontend/src/pages/maps/helpers/wmsConfig.js` — `resolveTimeStyle`

---

## defaultDate — Filtro por defecto al activar capa

Propiedad en la definición de capa que aplica un filtro CQL automáticamente cuando la capa se activa. Evita que GeoServer renderice toda la tabla sin filtro.

**Ubicación:** `frontend/src/pages/maps/hooks/useLayerToggle.js`

### Formato

```js
{
    id: 'tasa_feminicidio',
    wmsConfig: createSeguridadLayer('datos_delitos_feminicidio_secretariado'),
    defaultDate: { year: 2024 }
}
```

### Opciones disponibles

#### Por año
```js
defaultDate: { year: 2024 }
// CQL: (fecha >= '2024-01-01' AND fecha < '2025-01-01')
```

#### Por año y mes
```js
defaultDate: { year: 2024, month: 6 }
// CQL: (fecha >= '2024-06-01' AND fecha < '2024-07-01')
```

#### Por año, mes y día
```js
defaultDate: { year: 2024, month: 6, day: 15 }
// CQL: fecha = '2024-06-15'
```

#### Años agrupados
```js
defaultDate: { year: [2023, 2024] }
// CQL: ((fecha >= '2023-01-01' AND fecha < '2024-01-01') OR (fecha >= '2024-01-01' AND fecha < '2025-01-01'))
```

#### Meses agrupados
```js
defaultDate: { year: 2024, month: [1, 2, 3] }
// CQL: ((fecha >= '2024-01-01' AND ...) OR (fecha >= '2024-02-01' AND ...) OR (fecha >= '2024-03-01' AND ...))
```

#### Días agrupados
```js
defaultDate: { year: 2024, month: 6, day: [1, 15, 30] }
// CQL: (fecha = '2024-06-01' OR fecha = '2024-06-15' OR fecha = '2024-06-30')
```

#### Columna personalizada
```js
defaultDate: { year: 2024, column: 'fecha_evento' }
// CQL: (fecha_evento >= '2024-01-01' AND fecha_evento < '2025-01-01')
```

### Comportamiento

- Se aplica al **activar** la capa (en `useLayerToggle`)
- Se limpia al **desactivar** la capa
- El `SimpleDateSelector` lo detecta automáticamente (lee el filtro activo con `getSpecificFilter`)
- El usuario puede cambiar el periodo libremente después
- Solo aplica a capas vectoriales (no raster)

**Archivos clave:**
- `frontend/src/pages/maps/helpers/dateFilterHelpers.js` — `generateDefaultDateFilter`
- `frontend/src/pages/maps/hooks/useLayerToggle.js` — aplica/limpia el filtro

---

## Selectores de fecha en UI

### SimpleDateSelector (por defecto)

Selector simple con navegación año → meses. Soporta:
- Selección de año (muestra todos los meses disponibles)
- Selección de mes individual o múltiple
- Selección única forzada para capas de polígonos (`singleSelectOnly`)
- Botón play/pause para capas raster (animación de loop)

### DateTreeSelector (modo avanzado)

Selector en forma de árbol con navegación año → mes → día. Se activa con `Ctrl+Click` en "Periodicidad:".
- Permite selección granular por día
- Doble click para seleccionar
- Click en seleccionado para deseleccionar

---

## Loop de animación (raster y vectorial)

Desde v1.2.0 el loop (`useDateLoop`, antes `useRasterLoop`) es general: anima tanto capas raster (TIME dimension) como vectoriales (CQL_FILTER), en modo `year` o `month`.

### Controles en el header "Periodicidad:" del modal

| Control | Estilo | Función |
|---------|--------|---------|
| `LoopIntervalButton` | Morado en `1000` ms; naranja en cualquier otro preset | Velocidad del tick **per-layer**, cicla `250/500/1000/2000/3000` |
| `LoopDirectionButton` | Morado en LTR; naranja en RTL | Dirección del ciclo **per-layer** |
| `PlayPauseButton` | Morado detenido; naranja reproduciendo | Inicia/pausa el loop |
| Botón eliminar filtro | Ícono naranja | Limpia el filtro de fecha (detiene loop y resetea selector) |

### El color codifica estado (v1.93.0)

Desde v1.93.0 el color de los controles no es decorativo: **morado = valor por defecto, naranja = accionado o cambiado**. Aplica también a los años y meses del selector, que en reposo son morados y se ponen naranjas al seleccionarse. El tick del loop se distingue de una selección manual porque va relleno y sin borde.

En modo comparación esta regla cede: el color lo dicta el lado (A morado, B naranja), porque ahí identifica el panel y esa lectura es prioritaria.

La regla vive en `pages/maps/helpers/periodicityTones.js`:
- `toneStateFor(slot, changed)` → `{ tone, active }`, resolviendo la precedencia slot > estado.
- `toneClasses(tone, { active, disabled, idleBg, idleBorder })` → clases de superficie. El texto y el icono llevan el mismo color que el borde; en reposo el borde se pinta del color del propio fondo (`#F9FBFF`), no transparente, para que ocupe su píxel siempre y el botón no se perciba más chico que uno accionado.
- `toneButtonFor(slot, changed, options)` → atajo que combina ambas.

Radios: `rounded-full` (`RADIUS_ICON`) para los botones de solo icono y `rounded-[14px]` (`RADIUS_LABEL`) para los de acción con texto (velocidad, «Ver animación»), el radio de botón con label del resto del visor. Los años, los meses y el badge del año expandido conservan `rounded-[9px]`.

Los iconos de play y pausa viven en `Icon.jsx` (`play`, `pause`) con `currentColor`, para que hereden el tono del botón. Los cuatro SVG de `assets/icons/ico_play_*` e `ico_pause_*` se eliminaron: traían el naranja quemado en el `fill` y obligaban a duplicar cada icono para el hover. Por lo mismo se agregó `chevron`, porque el `downArrow` del botón de dirección se sirve como `<img>` desde un SVG con `stroke="#465055"` fijo y no admitía color.

`PeriodicitySection` acepta una prop opcional `trailingAction` que se renderiza al final de la barra de acciones, después del botón de eliminar filtro. La usa el catálogo para colocar ahí su botón de cerrar en escritorio; el modal del visor no la pasa.

### Regresar a la vista de años conserva la selección

La flecha de regreso (`handleBackToYears`) selecciona el año del que se venía y limpia los meses, en vez de dejar la capa sin filtro. En capas raster mensuales conserva el mes seleccionado: ahí el filtro es un valor `TIME` puntual y «todo el año» no es representable, así que vaciarlo dejaría la UI marcando el año mientras el WMS sigue pidiendo el mes anterior. Con `singleSelectOnly` la selección no se toca, como antes.

Cada capa mantiene sus propias preferencias de velocidad y dirección en runtime (no se persisten entre sesiones ni en backend). Se almacenan en `loopPrefs[layerId]` dentro de `useDateLoop`, con fallback a los defaults globales (`DEFAULT_LOOP_INTERVAL_MS = 500`, `DEFAULT_LOOP_DIRECTION = 'ltr'`) cuando el usuario aún no ha configurado nada. La preferencia se elimina automáticamente al desactivar la capa (`cleanupLoop`).

**Decisión:** la preferencia se borra en `cleanupLoop` (al desactivar la capa). Si en el futuro se quiere que sobreviva a un toggle off/on dentro de la misma sesión, basta con quitar el `delete prefsRef.current[layerId]` y el `setLoopPrefs(...)` dentro de `cleanupLoop` — el resto del sistema sigue funcionando igual.

El modal decide el modo del loop según la vista actual del selector (`onExpandedYearChange`):
- Vista de años (`expandedYear === null`) → `mode: 'year'`.
- Vista de meses (`expandedYear !== null`) → `mode: 'month'` para ese año.

Si el filtro actual ya corresponde a un mes/año concreto, `inferLoopConfig` lo detecta y el botón de play desde el `ActiveLayerItem` arranca en el modo adecuado.

### Estructura del loop

```js
startLoop(layerId, {
  mode: 'year' | 'month',
  year?: number,
  values: Array<{ key, filterValue }>   // valores pre-calculados por buildLoopValues
});
```

- Para raster: `filterValue` es el valor TIME ISO (`'2024-06-01'`).
- Para vectorial: `filterValue` es el CQL completo (`generateCQLFilter(...)`).

**Flujo:**
1. Usuario selecciona vista (años o meses).
2. Click en play: el modal construye `values` con `buildLoopValues({mode, year, rasterPeriodicity, periodicity, monthsSelection})`.
3. `startLoop` guarda el config en `loopDataRef` y arranca `setTimeout(doTick, intervalMs)` leyendo de `prefsRef.current[layerId]`.
4. Cada tick avanza `nextIdx = (currentIdx + step + values.length) % values.length` (step = +1 en LTR, -1 en RTL según `prefsRef.current[layerId].direction`) y aplica el `filterValue`.
5. El selector se sincroniza con `loopState.currentKey` (destaca en naranja el tick actual).
6. El carrusel de años auto-scrollea para mantener visible el año activo.

### Botones en `ActiveLayerItem`

Los controles están desacoplados en botones independientes, todos a la derecha del label de fecha:

- **Label de fecha** (naranja): `"2024"`, `"JUN 2024"`, `"3 MESES 2024"`, `"N AÑOS"`. Anchos fijos por tipo. Click abre el modal de detalle (no toggle del loop). Ancho estático — ya no crece con el ícono de pause, porque el play es un botón aparte. Pulsea (`animate-pulse`) cuando `isLooping && isLoading` para indicar que el siguiente tick está esperando que carguen los tiles.
- **Botón morado de velocidad**: visible siempre mientras hay loop; en desktop aparece también en hover sobre la tarjeta cuando no hay loop (para permitir configurar antes de arrancar). Cicla por `LOOP_INTERVAL_PRESETS`.
- **Botón morado de dirección**: misma regla de visibilidad. Alterna entre LTR y RTL con flecha animada.
- **Botón naranja de play/pausa**: círculo con ícono play o pause según estado. Visible cuando `canPlayLoop` (hay loop activo o `inferLoopConfig` encuentra valores). Es la única acción que dispara `toggleLoop(layerId)`.

Los botones llaman a `setLoopIntervalMs(layerId, ms)` y `setLoopDirection(layerId, dir)` → afectan solo a esa capa.

### Capa oculta → sin controles de periodicidad

Cuando el usuario oculta una capa (`hiddenLayerIds` incluye su id, bandera `layer.visible === false`), todo el bloque de periodicidad en `ActiveLayerItem` se oculta: label de fecha, play/pause, velocidad y dirección. El guard está en el contenedor padre (`{dateLabel && layer.visible && (...)}`).

Además, `useDateLoop` recibe `hiddenLayerIds` desde `MapsProvider` y en un `useEffect` detiene cualquier loop activo de capas recién ocultadas (`stopLoop(id)` + `trackRasterLoop(id, false)`). Esto evita gastar requests WMS mientras la capa no se ve en el mapa.

### Controles globales en el header de `ActiveLayersList`

- **Pausar animaciones** (ícono naranja): aparece solo cuando `hasActiveLoops === true`. Llama a `pauseAllLoops()` que itera `loopDataRef` y detiene cada loop activo (dispara también el analytics `trackRasterLoop(layerId, false)` por capa).
- Click en label: toggle loop si `inferLoopConfig` encuentra valores; si no, abre el modal.

### Orden visual

- Años en `buildLoopValues({mode:'year'})` se ordenan descendente (`[2024, 2023, ...]`) para coincidir con el orden del carrusel.
- Meses ascendente (`[1, 2, 3, ..., 12]`).
- Dirección LTR (default) avanza `+1` en index → visualmente de izquierda a derecha.

### Archivos clave

- `frontend/src/pages/maps/hooks/useDateLoop.js` — loop state, ticks, `inferLoopConfig`, `loopPrefs[layerId]`, `getLoopPrefs`, `setLoopIntervalMs(layerId, ms)`, `setLoopDirection(layerId, dir)`, `pauseAllLoops()`, `hasActiveLoops`
- `frontend/src/pages/maps/helpers/dateLoopHelpers.js` — `describeDateFilter`, `formatLoopLabel`, `buildLoopValues`, `computeSelectorInitialState`
- `frontend/src/pages/maps/components/LayerDetailModal/components/SimpleDateSelectorParts.jsx` — `PlayPauseButton`, `LoopIntervalButton`, `LoopDirectionButton`, `YearBadge`, `BackButton`, `CarouselArrow`

---

## Backend de periodicidad

### Endpoints

| Método | Ruta | Función |
|---|---|---|
| GET | `/periodicity/?workspace=X&layer=Y` | Periodicidad de una capa. Devuelve `{fecha: {year: {month: [days]}}}` o `null` |
| GET | `/periodicity/batch?layers=w1:l1,w2:l2,...` | Periodicidad de varias capas en un solo request. Devuelve `{layer_key: periodicity \| null}` |

Ambos leen de `public.layer_periodicity` (tabla autogenerada). Los días sólo se incluyen si la columna `fecha` es de tipo date/timestamp; meses sin días se devuelven como `null`.

### Schema y refresh

- `PeriodicityService.ensure_schema()` (en `backend/app/services/periodicity_service.py`) crea idempotentemente la tabla `public.layer_periodicity` y la función SQL `public.refresh_layer_periodicity()`. Si la tabla está vacía dispara el primer refresh. Se ejecuta vía leader-follower en el `lifespan` de `server.py`.
- La función `refresh_layer_periodicity()` recorre todas las tablas/vistas con columna `fecha` (excluyendo schemas internos) y construye el JSON `{year: {month: [days]}}` por `schema:tabla`.
- El refresh diario corre desde `dataengine-jobs` (cron 03:00) que sólo invoca `SELECT public.refresh_layer_periodicity()`. Mapalab backend ya no agenda este job.

### Cache en frontend

`usePeriodicityCache(activeLayerIds)` en `frontend/src/pages/maps/hooks/usePeriodicityCache.js` mantiene un cache en memoria de las periodicidades de las capas activas:

- Hace batch fetch (`/periodicity/batch`) cuando aparecen IDs nuevos en `activeLayerIds`.
- Expone `getPeriodicity(layerId)`, `isLoading(layerId)` y `ensureFetched(layerId)`.
- `fetchedRef` evita re-fetch de IDs ya pedidos. Si el request falla, el ID se libera para reintento futuro.
- Vive en `MapsProvider` y se usa para mostrar pills de fecha y alimentar selectores sin abrir el modal.

---

## Resumen de archivos

| Archivo | Responsabilidad |
|---------|----------------|
| `dateFilterHelpers.js` | Generación de CQL, parseo de selecciones, `generateDefaultDateFilter` |
| `dateLoopHelpers.js` | `describeDateFilter`, `formatLoopLabel`, `buildLoopValues`, `computeSelectorInitialState` |
| `SimpleDateSelector.jsx` | UI de selección año/mes (modo simple) |
| `SimpleDateSelectorParts.jsx` | Sub-componentes reutilizables del selector y controles de loop |
| `DateTreeSelector.jsx` | UI de selección año/mes/día (modo avanzado) |
| `useLayerToggle.js` | Aplica `defaultDate` al activar/desactivar capas |
| `useCQLFilter.js` | Estado global de filtros CQL por capa |
| `useWMSFilterUpdater.js` | Sincroniza filtros CQL/TIME con los sources WMS |
| `useDateLoop.js` | Animación temporal generalizada (year/month, LTR/RTL, interval configurable) |
| `usePeriodicityCache.js` | Cache batch en memoria de periodicidades por capa activa |
| `useCarouselOverflow.js` | Scroll del carrusel de años con `canScrollLeft`/`canScrollRight` |
| `wmsConfig.js` | `resolveTimeStyle` para estilos dinámicos por TIME |
| `recursos.js` | Definiciones de capas raster con `timeEnabled` y `rasterPeriodicity` |
| `seguridad.js` | Ejemplo de capas con `defaultDate` |
| `backend/app/routers/periodicity.py` | Endpoints `/periodicity/` y `/periodicity/batch` |
| `backend/app/services/periodicity_service.py` | `ensure_schema`, `refresh`, `get_periodicity`, `get_periodicities_batch` |
