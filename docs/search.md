# Búsqueda de capas

La búsqueda del sider encuentra capas por nombre, tags y coincidencia aproximada. Desde v1.4.0 el árbol viene del backend y el índice se reconstruye al cargar.

## Cómo funciona

```
┌───────────────────────────┐
│  Usuario teclea en input  │
└───────────┬───────────────┘
            │  debounce 500ms
            ▼
┌───────────────────────────┐
│  searchGlobal(q)          │
│  usa SEARCH_CONFIG (mem)  │  ← client-side, sin network request
└───────────┬───────────────┘
            │  scoring + sort
            ▼
┌───────────────────────────┐
│  Lista agrupada por tema  │
│  → click activa capa      │
└───────────────────────────┘
```

El `SEARCH_CONFIG` es un diccionario en memoria del frontend. Se construye en `LayersProvider` tras recibir el árbol del backend:

```js
fetchLayerTree() → hydrateLayerTree(tree) → rebuildSearchConfig(tree) → SEARCH_CONFIG listo
```

Cero round-trip al backend por cada tecla. El scoring es sofisticado (Levenshtein, normalización de plurales) y no se puede replicar con un `ILIKE` simple.

---

## Scoring

Cada capa recibe un score; si supera el mínimo (**10**) aparece como resultado. Orden descendente.

```
score = labelScore + tagScore
```

### Label score

| Condición | Puntos |
|---|---|
| Match exacto del label completo | **+30** |
| Label empieza con la keyword | +15 |
| Keyword contenida en label | +10 |
| Palabras individuales del label | `wordScore` (0–20) |

### Tag score

| Condición | Puntos |
|---|---|
| Tag exacto | **+25** |
| Tag empieza con keyword (len>2) | +15 |
| Keyword contenida en tag (len>2) | +10 |
| Keyword contiene el tag (len>2) | +8 |
| Similitud Levenshtein > 0.8 (len>3) | +12 |

### Word score (palabras del label)

| Condición | Puntos |
|---|---|
| Match exacto | +20 |
| Palabra empieza con keyword (len>2) | +10 |
| Keyword contenida en palabra (len>2) | +5 |
| Similitud Levenshtein > 0.75 (len>3) | +8 |

Un **tag match** vale casi lo mismo que un match de label completo. Usar tags es la palanca principal para expandir la cobertura semántica.

### Normalización

Antes del scoring toda cadena pasa por `normalizeText()`:

1. `toLowerCase()`
2. NFD + strip de diacríticos (`á → a`, `ñ → n`)
3. Mapa de plurales → singulares (~30 entradas)
4. Split por whitespace

Esto hace que `Hospitales`, `hospital`, `HOSPITAL`, `Hospitáles` sean equivalentes.

---

## Cómo hacer que una capa sea más encontrable

**Caso típico**: al buscar "hospital" no aparece "IMSS" porque esa capa no contiene la palabra hospital.

### Solución: agregar tags desde el editor

1. Ir a `/administrador/mapalab/layers`
2. Buscar la capa (ej `imss_1`, `imss_2`)
3. Editar → sección **Identidad** → campo **Tags de búsqueda (coma)**
4. Escribir sinónimos relevantes:
   ```
   hospital, clinica, medico, atencion_medica, seguro_social, primer_nivel, imss
   ```
5. Guardar

### Qué pasa tras guardar

```
Admin guarda
    ↓
mariachi PUT /layers/{id}
    ↓
UPDATE mapalab.layers SET search_tags = [...]
    ↓
mariachi → notify_tree_changed()
    ↓
mapalab backend rebuilds mapalab.layer_tree_cache
    ↓
Próximo /layers/tree devuelve nuevo ETag
    ↓
Frontend fetch → rebuildSearchConfig(nuevo tree)
    ↓
"hospital" ahora encuentra IMSS con +25 puntos
```

### Tips para elegir tags

- **Incluye sinónimos de usuario final**: si hay ambigüedad regional o coloquial, meter ambas formas (`hospital`, `clinica`, `sanatorio`)
- **No duplicar palabras del label**: el scoring ya las tokeniza automáticamente
- **Separar conceptos**: un tag por término (no `hospital publico imss` en un solo string)
- **Sin acentos ni mayúsculas**: la normalización los remueve igual, pero se ve más limpio en la DB
- **Snake_case para términos compuestos**: `atencion_medica` (no `atencion medica`) — ayuda en el splitting

### Ejemplo de capa bien tageada

Capa: `tasa_homicidio_doloso`, label: `Homicidio doloso (tasa)`

```
tags = [
  'seguridad', 'delito', 'homicidio', 'tasa',
  'asesinato', 'crimen', 'violencia',
  'muerte', 'victima', 'victimologia',
  'codigo_penal', 'fuero_comun'
]
```

Con esto, todas estas búsquedas encuentran la capa:
- `homicidio` (+25 exact tag + +30 label)
- `asesinato` (+25 tag)
- `violencia` (+25 tag)
- `crimen` (+25 tag)
- `muerte` (+25 tag)
- `tasa` (+25 tag + match en label)

---

## Campos de `searchMeta` (en DB: `mapalab.layers`)

| DB column | Frontend property | Uso |
|---|---|---|
| `search_tags` | `searchMeta.tags` | Tags para scoring (lo que acabamos de describir) |
| `searchable_fields` | `searchMeta.searchableFields` | Campos indexables por backend (v2 — búsqueda dentro de datos) |
| `has_municipio` | `searchMeta.hasMunicipio` | Expone filtro por municipio (pendiente UI) |
| `has_direccion` | `searchMeta.hasDireccion` | Expone filtro por dirección (pendiente UI) |
| `municipio_field` | `searchMeta.municipioField` | Nombre real de la columna (default `municipio`) |
| `direccion_field` | `searchMeta.direccionField` | Nombre real de la columna (default `direccion`) |

---

## Dos caminos para búsqueda

### 1. Client-side (recomendado, el que se usa hoy)

- `GET /mapalab/api/layers/tree` una vez al cargar
- `rebuildSearchConfig(tree)` construye el índice
- `findAllMatches(keyword, minScore=10)` scoring in-memory
- **Latencia cero por keystroke**
- Scoring sofisticado preservado

### 2. Server-side (`GET /mapalab/api/layers/search?q=X&limit=N`)

- ILIKE simple sobre label + array_to_string(tags) + id
- Devuelve leaves flat con `path` construido (`"Seguridad > Delitos > Delitos contra la vida"`)
- Usado por: links compartidos (`?q=hospital`), API pública v2.0.0, consumidores externos al visor

No lo usa el sider — sería network round-trip por cada tecla.

---

## Búsqueda dentro de datos (roadmap v1.5.x+)

Hoy solo buscamos por nombres de capas. Para buscar valores dentro de features (ej. "Hospital Regional San Alejandro") falta infra:

- `GET /mapalab/api/layers/{id}/search?q=X` (cliente listo en `searchService.js:1-208`, backend pendiente)
- `GET /mapalab/api/layers/autocomplete?layer=X&field=Y&q=Z`
- `GET /mapalab/api/layers/by-category/{municipios|direcciones}?layer=X`

Estos endpoints leerían directo del schema PostgreSQL de la capa (via workspace alias → db_schema). Pendientes, no bloqueantes.

---

## Flujo completo de ejemplo

```
T=0ms    Usuario escribe "hospital" en SearchMenu

T=500ms  debounce expira → debouncedQuery = "hospital"

T=501ms  searchGlobal("hospital", { minScore: 10 })
           ↓
         normalizeText → "hospital"
           ↓
         itera SEARCH_CONFIG (in-memory, 188 entries)
           ↓
         scoreLayerMatch por capa
           ↓
         findAllMatches ordenado desc

T=502ms  results = [
           { layerId: 'imss_1', score: 25, tema: 'salud', ... },
           { layerId: 'hospitales_generales', score: 30, ... },
           ...
         ]
         setSelectedLayers(ids)

T=503ms  UI renderiza agrupado por tema > subtema

T=?      Click en "IMSS" → onToggleLayer('imss_1', true)
         MapSider activa capa → aparece en el mapa
```

---

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `frontend/src/services/searchConfig.js` | `SEARCH_CONFIG`, `rebuildSearchConfig`, `normalizeText`, scoring, `findAllMatches` |
| `frontend/src/services/searchService.js` | Cliente HTTP para endpoints backend (v1.5.x+ búsqueda en datos) |
| `frontend/src/contexts/SearchContext.jsx` | Query inicial + flag `shouldAutoOpenSearch` |
| `frontend/src/hooks/useDebounce.js` | Debounce genérico 500ms |
| `frontend/src/pages/maps/components/SearchMenu.jsx` | UI en el sider |
| `mapalab/backend/app/routers/layers.py` | Endpoint `/layers/search` (ruta server-side) |
| `mapalab/backend/app/repositories/layers_repository.py::search_layers` | Query SQL |

---

## Troubleshooting

**"No aparece ninguna capa al buscar"**
- Verificar en DevTools que `GET /mapalab/api/layers/tree` respondió 200 con data
- En consola del navegador: `window.__testSearch = (q) => require('@services/searchConfig').findAllMatches(q)` (en dev) — revisar si devuelve algo
- Verificar que `LayersProvider` llama a `rebuildSearchConfig` tras el fetch (está en el archivo)

**"Mi capa no aparece con X keyword"**
- Ir a `/administrador/mapalab/layers`, verificar los tags de esa capa
- Si faltan, agregar via drawer de edición y guardar

**"La búsqueda es lenta"**
- El scoring es O(n * keywords). Con 188 capas y 2-3 keywords es <5ms
- Si hubiera 10000 capas, evaluar backend. Hoy no es el caso
