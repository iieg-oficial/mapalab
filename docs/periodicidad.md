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
1. Capa se activa → `useRasterLoop` aplica TIME del mes 1 por defecto
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
- `frontend/src/pages/maps/hooks/useRasterLoop.js` — animación de loop temporal
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
| `LoopIntervalButton` | Morado, cicla `250/500/1000/2000/3000` ms | Velocidad del tick |
| `LoopDirectionButton` | Morado, flecha `←` / `→` | Dirección del ciclo (LTR / RTL) |
| `PlayPauseButton` | Naranja (acción principal) | Inicia/pausa el loop |
| Botón eliminar filtro | Ícono naranja | Limpia el filtro de fecha (detiene loop y resetea selector) |

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
3. `startLoop` guarda el config en `loopDataRef` y arranca `setTimeout(doTick, intervalRef.current)`.
4. Cada tick avanza `nextIdx = (currentIdx + step + values.length) % values.length` (step = +1 en LTR, -1 en RTL) y aplica el `filterValue`.
5. El selector se sincroniza con `loopState.currentKey` (destaca en naranja el tick actual).
6. El carrusel de años auto-scrollea para mantener visible el año activo.

### Botones en `ActiveLayerItem`

- **Label de fecha**: `"2024"`, `"JUN 2024"`, `"3 MESES 2024"`, `"N AÑOS"`. Anchos fijos por tipo (estático vs con loop) para evitar rebote.
- **Hover** sobre el label expone:
  - Botón morado de velocidad (si `loopIntervalMs !== DEFAULT_LOOP_INTERVAL_MS`).
  - Botón morado de dirección.
- Click en label: toggle loop si `inferLoopConfig` encuentra valores; si no, abre el modal.

### Orden visual

- Años en `buildLoopValues({mode:'year'})` se ordenan descendente (`[2024, 2023, ...]`) para coincidir con el orden del carrusel.
- Meses ascendente (`[1, 2, 3, ..., 12]`).
- Dirección LTR (default) avanza `+1` en index → visualmente de izquierda a derecha.

### Archivos clave

- `frontend/src/pages/maps/hooks/useDateLoop.js` — loop state, ticks, `inferLoopConfig`, `loopIntervalMs`, `loopDirection`
- `frontend/src/pages/maps/helpers/dateLoopHelpers.js` — `describeDateFilter`, `formatLoopLabel`, `buildLoopValues`, `computeSelectorInitialState`
- `frontend/src/pages/maps/components/LayerDetailModal/components/SimpleDateSelectorParts.jsx` — `PlayPauseButton`, `LoopIntervalButton`, `LoopDirectionButton`, `YearBadge`, `BackButton`, `CarouselArrow`

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
| `useCarouselOverflow.js` | Scroll del carrusel de años con `canScrollLeft`/`canScrollRight` |
| `wmsConfig.js` | `resolveTimeStyle` para estilos dinámicos por TIME |
| `recursos.js` | Definiciones de capas raster con `timeEnabled` y `rasterPeriodicity` |
| `seguridad.js` | Ejemplo de capas con `defaultDate` |
