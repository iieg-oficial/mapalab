# URL sync

Sistema bidireccional que sincroniza el estado del mapa con query params. Permite compartir URLs con capas activas, filtros CQL, posicion y zoom. Es la base del futuro "Compartir estado del mapa" (v1.5.0).

## Parametros soportados

```
?layers=<id1>,<id2>,*<selectedId>&filter_<layerId>=<CQL>&zoom=<n>&lat=<n>&lon=<n>
```

| Param | Formato | Proposito |
|---|---|---|
| `layers` | `id1,id2,*id3` | IDs de capas activas separados por coma. Prefijo `*` marca la capa seleccionada para simbologia. |
| `filter_<layerId>` | CQL url-encoded | Filtro CQL por capa. Multiples filtros sobre la misma capa se combinan con `AND`. |
| `zoom` | numero (2 decimales) | Zoom del mapa. |
| `lat`, `lon` | numero (6 decimales) | Centro en coordenadas geograficas (EPSG:4326). Se convierten a EPSG:3857 internamente. |

**No se persisten en URL:** opacidad (`useLayerOpacity`), seleccion de simbologia, mediciones/dibujos, estado de loop, InfoBox abierto.

---

## Flujo URL -> State (inicializacion)

```
1. MapView monta -> useMapInitialization lee zoom/lat/lon (solo si hay `layers`)
2. useInitializeFromUrl parsea `layers` y `filter_*`
3. Expande IDs de categorias a hijos -> setActiveLayerIds(allIds)
4. Si `*<id>` presente -> setSelectedLayerForSymbology
5. Por cada capa SIN filtro URL -> applyDefaultDate (si la definicion lo tiene)
6. Por cada capa CON filtro URL -> applyFilter(layerId, 'date', cqlFromUrl)
7. filtersInitializationComplete.value = true (desbloquea escritura)
```

**Archivo:** `frontend/src/pages/maps/hooks/useInitializeFromUrl.js:8-95`

### Precedencia URL filter vs defaultDate

Si la URL trae `filter_<layerId>`, el `defaultDate` de la definicion se ignora. Garantiza que al compartir un link con fecha especifica, esa fecha se respete.

### Restauracion de la capa seleccionada (`restoreSelectedById`)

Al restaurar (URL con `*<id>`, share por `?s=`, o sesion desde `sessionStorage` en un refresh), la seleccion no se puede aplicar sólo con `setSelectedLayerForSymbology`: el efecto de auto-seleccion de `useSymbology` corre **despues** (vive en `MapsProvider`, padre de `Maps`) con `activeLayerIds` aún stale, hace `setSelected(null)` y luego auto-elige la primera capa, pisando la restauracion. Por eso los tres puntos de restauracion llaman también `restoreSelectedById(id)`, que deja el id en un `useRef`; cuando el efecto va a auto-seleccionar, primero consume ese ref y respeta la capa restaurada si sigue activa. Sin esto, un refresh siempre regresaba a la primera capa de la lista.

```javascript
const filterLayerIds = new Set(filterParams.map(f => f.layerId));
allIds.forEach(id => {
    if (!filterLayerIds.has(id)) applyDefaultDate(id);
});
```

### Resolucion de `'latest'`

Cuando `defaultDate: 'latest'` se aplica sin filtro URL:
1. `resolveDefaultDate` consulta `usePeriodicityCache` (o fetch si falta).
2. Toma el año mas reciente y, si hay meses, el mes mas reciente.
3. Fallback: si la periodicidad no llega, usa el valor literal de `defaultDate` si es un objeto.

**Archivo:** `frontend/src/pages/maps/hooks/useLayerToggle.js:24-71`

---

## Flujo State -> URL (escritura)

```
cambio en activeLayerIds | filters | selectedLayerForSymbology
    -> debounce 500ms (useDebounce)
    -> useMemo recalcula expectedParams
    -> compara con previousState.current
    -> si cambio Y filtersInitializationComplete.value
        -> setSearchParams(newParams, { replace: true })
```

**Archivo:** `frontend/src/pages/maps/hooks/useUrlSync.js:8-102`

### Vista del mapa (pan/zoom)

Hook separado (`useMapViewUrlSync`) escucha `moveend` de OpenLayers con debounce 300ms. Convierte el centro a `lon/lat` con `toLonLat`.

**Archivo:** `frontend/src/pages/maps/hooks/useMapViewUrlSync.js:16-53`

### Combinacion de filtros por capa

Multiples filtros sobre la misma capa se combinan con `AND` al serializar:

```javascript
const combinedFilter = filterExpressions.length === 1
    ? filterExpressions[0]
    : filterExpressions.map(f => `(${f})`).join(' AND ');
result[`filter_${layerId}`] = combinedFilter;
```

En memoria los filtros viven como `{ [layerId]: { [filterName]: cql } }` (ej: `{ tasa_feminicidio: { date: '...', _meta: '...' } }`). Keys con prefijo `_` se ignoran en la URL.

### Exclusiones al escribir

- Capas `isLabel: true` nunca se serializan.
- Capas `isCategory: true` solo aparecen si son la seleccionada (`id === selectedId`).
- IDs vacios/falsy se filtran.

```javascript
const validLayerIds = debouncedActiveLayerIds.filter(id => {
    if (!id || id.trim().length === 0) return false;
    const layer = findLayerById(id);
    if (!layer || layer.isLabel) return false;
    if (layer.isCategory && id !== debouncedSelectedId) return false;
    return true;
});
```

---

## Flag `filtersInitializationComplete`

Boolean de modulo que actua como lock durante la inicializacion. Evita que `useUrlSync` escriba la URL mientras `useInitializeFromUrl` aun esta aplicando cambios (que dispararian escrituras intermedias con estado parcial).

- Valor inicial: `false`
- Se setea `true` al final de `useInitializeFromUrl`
- `useUrlSync` retorna early si es `false`

---

## Quirks y edge cases

| Quirk | Comportamiento |
|---|---|
| **URL filter > defaultDate** | El filtro URL gana; `defaultDate` se omite. |
| **Categorias no seleccionadas** | No aparecen en `layers=...` aunque esten activas. |
| **Orden de capas** | El orden en la URL se preserva al leer. La reordenacion via drag del usuario actualiza state pero no re-escribe (el debounce siguiente si lo hace). |
| **Opacidad** | No se serializa. Pendiente para v1.5.0. |
| **Loop de fechas** | El valor actual del loop no se persiste. Solo el filtro base. |
| **`swap_*` legacy** | Se limpia al escribir. Remanente de una feature retirada. |
| **Zoom decimales** | Se almacena con 2 decimales. Pan con 6 decimales. |
| **Sin `layers=` -> sin zoom/lat/lon** | `useMapInitialization` ignora zoom/lat/lon si no hay `layers`, para que rutas sin estado no salten al ultimo pan. |

---

## Ejemplos

### Una capa, solo posicion
```
/mapa?layers=carreteras&zoom=12.00&lat=20.659698&lon=-103.348236
```
Activa carreteras, aplica `defaultDate` si esta definido, centra en coord dadas.

### Multiples capas con seleccion y filtro
```
/mapa?layers=carreteras,*educacion_superior,salud
     &filter_educacion_superior=(fecha%20%3E%3D%20'2022-01-01'%20AND%20fecha%20%3C%20'2023-01-01')
```
Activa 3 capas, `educacion_superior` queda seleccionada (simbologia), filtrada al año 2022. Las otras dos usan `defaultDate`.

### Dos capas con filtros distintos
```
/mapa?layers=*tasa_delitos_sexuales,carreteras
     &filter_tasa_delitos_sexuales=(fecha%20%3E%3D%20'2021-01-01')
     &filter_carreteras=(administracion%20%3D%20'Estatal')
     &zoom=11.50&lat=20.892734&lon=-103.285522
```

---

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `hooks/useInitializeFromUrl.js` | Parseo y aplicacion inicial de params |
| `hooks/useUrlSync.js` | Escritura debounced de state -> URL |
| `hooks/useMapViewUrlSync.js` | Escritura debounced de pan/zoom |
| `hooks/useMapInitialization.js` | Aplicacion de zoom/lat/lon al primer render |
| `hooks/useLayerToggle.js` | `applyDefaultDate`, resolucion de `'latest'` |
| `hooks/useCQLFilter.js` | Estado `{ [layerId]: { [name]: cql } }` |
| `helpers/dateFilterHelpers.js` | `generateDefaultDateFilter`, `parseCQLToSelections` |

## Pendientes (v1.5.0)

- Compartir opacidad por capa.
- Compartir orden custom (hoy el orden escrito siempre es el de `activeLayerIds`).
- Compartir estado del loop (velocidad, direccion, frame actual).
- Compartir comparador de periodicidad (cuando exista, v1.4.0).
