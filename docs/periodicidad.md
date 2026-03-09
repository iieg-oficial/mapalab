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

## Loop de animación raster

Para capas raster mensuales, el `SimpleDateSelector` muestra un botón play/pause que cicla automáticamente por los meses.

**Flujo:**
1. Usuario hace click en play
2. `useRasterLoop.startLoop(layerId, year, periodicityData)` inicia el ciclo
3. Cada tick aplica `applyFilter(id, 'date', timeValue)` con el siguiente mes
4. `useWMSFilterUpdater` detecta el cambio y actualiza TIME + STYLES
5. El loop espera a que la capa termine de cargar antes del siguiente tick
6. Se detiene con stop o al desactivar la capa

**Archivos clave:**
- `frontend/src/pages/maps/hooks/useRasterLoop.js`
- `frontend/src/pages/maps/components/LayerDetailModal/components/SimpleDateSelector.jsx`

---

## Resumen de archivos

| Archivo | Responsabilidad |
|---------|----------------|
| `dateFilterHelpers.js` | Generación de CQL, parseo de selecciones, `generateDefaultDateFilter` |
| `SimpleDateSelector.jsx` | UI de selección año/mes (modo simple) |
| `DateTreeSelector.jsx` | UI de selección año/mes/día (modo avanzado) |
| `useLayerToggle.js` | Aplica `defaultDate` al activar/desactivar capas |
| `useCQLFilter.js` | Estado global de filtros CQL por capa |
| `useWMSFilterUpdater.js` | Sincroniza filtros CQL/TIME con los sources WMS |
| `useRasterLoop.js` | Animación temporal para capas raster mensuales |
| `wmsConfig.js` | `resolveTimeStyle` para estilos dinámicos por TIME |
| `recursos.js` | Definiciones de capas raster con `timeEnabled` y `rasterPeriodicity` |
| `seguridad.js` | Ejemplo de capas con `defaultDate` |
