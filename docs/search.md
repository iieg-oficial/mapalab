# Busqueda

Sistema de busqueda en dos capas: **nombres de capas** (client-side, implementado) y **datos dentro de capas** (backend, infraestructura lista pero endpoints pendientes).

## Arquitectura

```
┌─────────────────────────────────────────┐
│ SearchBar (homepage)                    │  Usuario escribe, Enter -> /mapa
└────────────┬────────────────────────────┘
             │ setSearchFromUrl(q)
             ▼
┌─────────────────────────────────────────┐
│ SearchContext                           │  Estado: initialSearchQuery + flag
└────────────┬────────────────────────────┘
             │ consumeInitialQuery()
             ▼
┌─────────────────────────────────────────┐
│ SearchMenu (sider)                      │
│  - debounce 500ms                       │
│  - searchGlobal(q, opts)                │
│     - includeLayerNames: true  (OK)     │  <- client-side scoring
│     - includeLayerData: false  (pend.)  │  <- backend pendiente
│  - onToggleLayer(id, !active)           │
└─────────────────────────────────────────┘
```

La **capa 1** (nombres) corre puramente en el cliente usando `SEARCH_CONFIG` (index construido en memoria al arrancar). La **capa 2** (datos) existe como cliente HTTP en `searchService.js` pero los endpoints backend aun no estan implementados.

---

## searchMeta en definiciones de capa

Cada capa WMS puede declarar un objeto `searchMeta` para ser indexada:

```javascript
{
    id: 'hospitales_publicos',
    label: 'Hospitales Publicos',
    wmsConfig: createSaludLayer('hospitales_publicos'),
    searchMeta: {
        tags: ['salud', 'hospital', 'publico', 'imss'],
        searchableFields: ['nombre', 'clave'],
        hasMunicipio: true,
        hasDireccion: true,
        municipioField: 'municipio',
        direccionField: 'domicilio'
    }
}
```

| Campo | Tipo | Uso |
|---|---|---|
| `tags` | `string[]` | Palabras clave para match de nombre. El `label` tambien se tokeniza automaticamente. |
| `searchableFields` | `string[]` | Campos que el backend indexara (cuando los endpoints existan). |
| `hasMunicipio` / `hasDireccion` | `boolean` | Flags para exponer en filtros por ubicacion. |
| `municipioField` / `direccionField` | `string` | Nombre de la columna real en GeoServer. Defaults: `'municipio'`, `'direccion'`. |

**Construccion del index:** `services/searchConfig.js:64-72` (`buildSearchConfig`). Itera todas las definiciones, expande `label` a palabras, concatena con `tags`, normaliza.

---

## Scoring (client-side)

El matching no es binario: cada capa recibe un score y los resultados se ordenan descendente. Score minimo por defecto: **10**.

```
score = labelScore + tagScore
```

### Label score (`services/searchConfig.js:240-250`)

| Condicion | Puntos |
|---|---|
| Match exacto del label completo | +30 |
| Label empieza con keyword (len > 0) | +15 |
| Keyword contenido en label | +10 |
| Palabras individuales del label | `calculateWordScore` (0-20 c/u) |

### Tag score (`services/searchConfig.js:252-262`)

| Condicion | Puntos |
|---|---|
| Tag exacto | +25 |
| Tag empieza con keyword (len > 2) | +15 |
| Keyword contenido en tag (len > 2) | +10 |
| Keyword contiene el tag (len > 2) | +8 |
| Similitud Levenshtein > 0.8 (len > 3) | +12 |

### Word score (palabras individuales)

| Condicion | Puntos |
|---|---|
| Match exacto | +20 |
| Palabra empieza con keyword (len > 2) | +10 |
| Keyword contenido en palabra (len > 2) | +5 |
| Similitud Levenshtein > 0.75 (len > 3) | +8 |

### Levenshtein normalizado

`services/searchConfig.js:207-229`. Retorna `1 - (distance / maxLen)`. Se aplica solo para palabras > 3 chars para evitar falsos positivos cortos.

---

## Normalizacion

`normalizeText(str)` (`services/searchConfig.js:193-205`) aplica:

1. `toLowerCase()`
2. NFD + strip de diacriticos (`á -> a`, `ñ -> n`)
3. Mapa de plurales -> singulares (`services/searchConfig.js:154-191`)
4. Split por whitespace

El mapa de plurales tiene ~30 entradas explicitas (hospitales, escuelas, municipios, colonias, etc). No es heuristico; se agrega manualmente cuando aparece un termino con plural irregular o terminacion inconveniente.

---

## SearchContext

`contexts/SearchContext.jsx:1-53`. Estado minimo: solo la query inicial que llega desde el homepage o desde un deep-link futuro.

```javascript
{
    initialSearchQuery,        // string | null
    shouldAutoOpenSearch,      // boolean: expande sider y abre menu
    setSearchFromUrl(q),       // setter desde SearchBar
    consumeInitialQuery(),     // SearchMenu lo lee una sola vez
    clearAutoOpen()            // resetea flag
}
```

**No guarda results ni selected state** — cada consumidor ejecuta su busqueda local. Esto deja la puerta abierta a varias vistas (sider + overlay, por ejemplo) sin contencion.

---

## SearchMenu

`pages/maps/components/SearchMenu.jsx:1-182`. UI del sider.

- `searchQuery` (input) -> `useDebounce(500ms)` -> `debouncedQuery`
- Al cambiar `debouncedQuery`: `searchGlobal(q, { includeLayerNames: true, includeLayerData: false, minScore: 10 })`
- Resultados agrupados por `tema` / `subtema` (que salen del `searchMeta`)
- Click en capa -> `onToggleLayer(id, !active)` -> se propaga al `MapSider` y activa la capa

Estados de UI:

| Estado | Mensaje |
|---|---|
| `isLoading` | Spinner |
| Sin query | Vacio |
| Query + no results | `"No se encontraron resultados para <q>"` |
| Query + results | Lista agrupada con checkbox segun `isLayerActive` |

---

## Backend search (estado actual)

`services/searchService.js:1-208`. Cliente HTTP definido pero sin contrapartida backend.

| Funcion | Endpoint | Status |
|---|---|---|
| `fetchMunicipios(layerId)` | `/mapalab/layers/by-category/municipios` | Cliente listo, endpoint pendiente |
| `fetchDirecciones(layerId)` | `/mapalab/layers/by-category/direcciones` | Cliente listo, endpoint pendiente |
| `searchInLayer(layerId, q)` | `/mapalab/layers/search` | Cliente listo, endpoint pendiente |
| `searchInMultipleLayers(ids, q)` | parallel `search` | Cliente listo |
| `fetchAutocomplete(layerId, field, q)` | `/mapalab/layers/autocomplete` | Cliente listo, endpoint pendiente |
| `searchGlobal(q, opts)` | Orquesta todos | Parcial: solo `includeLayerNames` funciona |

Planificado como parte de v1.3.0 (migracion de capas al backend) o posterior.

---

## Flujo completo: usuario escribe -> capa activada

```
T=0ms    Usuario escribe 'hospital' en SearchMenu input
         setSearchQuery('hospital')

T=500ms  debounce expira -> debouncedQuery = 'hospital'
         performSearch() dispara

T=501ms  searchGlobal('hospital', { minScore: 10 })
         -> normalizeText -> 'hospital'
         -> itera SEARCH_CONFIG (client-side)
         -> scoreLayerMatch por capa
         -> findAllMatches ordenado desc

T=502ms  results.layerMatches = [
             { layerId: 'imss_1',      score: 25, tema: 'salud', ... },
             { layerId: 'hospitales',  score: 20, tema: 'salud', ... }
         ]
         setSelectedLayers(ids)

T=503ms  UI renderiza agrupado: Salud > Oferta Infraestructura > [IMSS, Hospitales]

T=?      Click en 'Hospitales' -> onToggleLayer('hospitales', true)
         MapSider activa capa -> aparece en el mapa
```

---

## Agregar busqueda a una capa nueva

Minimo necesario (solo nombre):

```javascript
searchMeta: { tags: ['hospital', 'salud'] }
```

Con flags de ubicacion (para cuando backend este listo):

```javascript
searchMeta: {
    tags: ['hospital', 'salud', 'imss'],
    searchableFields: ['nombre', 'clave'],
    hasMunicipio: true,
    hasDireccion: true,
    municipioField: 'municipio',
    direccionField: 'domicilio'
}
```

No hay que registrar nada manualmente: `buildSearchConfig` corre al importar el modulo y la capa queda indexada.

---

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `services/searchConfig.js` | `SEARCH_CONFIG`, `normalizeText`, scoring, `findAllMatches` |
| `services/searchService.js` | Cliente HTTP para endpoints backend (pendientes) |
| `contexts/SearchContext.jsx` | Query inicial + flag `shouldAutoOpenSearch` |
| `hooks/useDebounce.js` | Debounce generico 500ms usado por input |
| `pages/home/components/SearchBar.jsx` | Entrada desde homepage |
| `pages/maps/components/SearchMenu.jsx` | UI de busqueda dentro del sider |
| `pages/maps/helpers/menuItems.jsx` | Integracion SearchMenu con `MapSider` |
| `pages/maps/helpers/layers/definitions/*.js` | Cada capa declara su `searchMeta` |

---

## Pendientes

- Implementar endpoints backend (`/mapalab/layers/search`, `/autocomplete`, `/by-category/*`).
- Integrar `includeLayerData: true` en el flujo del SearchMenu.
- UI de filtros por municipio/direccion dentro de una capa activa.
- Historial de busquedas (probable sessionStorage).
