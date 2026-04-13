# Plan de Migración: Definiciones de Capas Hardcodeadas → Endpoint Dinámico

## 1. Estado Actual (Lo que hay)

### Frontend — 9 archivos hardcodeados en `frontend/src/pages/maps/helpers/layers/definitions/`

Cada archivo exporta un **árbol jerárquico** con esta estructura:

```
Tema (ej. "Seguridad")
  └─ Categoría (isCategory, ej. "Delitos del fuero común")
      └─ Subcategoría (isLabel, ej. "Delitos contra la vida")
          └─ Capa hoja (tiene wmsConfig, littleCard, searchMeta)
              └─ [opcional] Sub-capas con filtro CQL (ej. "Con violencia" / "Sin violencia")
```

### Propiedades completas de una capa (inventario exhaustivo):

#### Identidad y estructura

| Propiedad | Qué hace | Ejemplo | Dónde se usa |
|-----------|----------|---------|--------------|
| `id` | Identificador único | `"tasa_feminicidio"` | Todo el sistema |
| `label` | Nombre visible en UI | `"Feminicidios (tasa)"` | ThemeMenu, LayerItem |
| `label` con `*` | Si empieza con `*`, la capa queda **deshabilitada** (opacity 50%, no toggle) | `"*Capa en mantenimiento"` | LayerItem.jsx:45 |
| `children` | Nodos hijos | `[...]` | Árbol completo |

#### Tipo de nodo (controla cómo se renderiza en el menú)

| Propiedad | Qué hace | Dónde se usa |
|-----------|----------|--------------|
| `isCategory` | Nodo expandible/colapsable (carpeta) | ThemeMenu.jsx:31, useActiveLayersLogic.js:50, useUrlSync.js:22 |
| `isLabel` | Encabezado de sección sin toggle | ThemeMenu.jsx:34, LayerItem.jsx:16 |
| `forceGroup` | Agrupa hijos como unidad — no se pueden togglear individualmente | layerHelpers.js:152, useActiveLayersLogic.js:33, useWMSLayerManager.js:62 |
| `hiddenInMenu` | No aparece en el menú pero puede estar activa | ThemeMenu.jsx:75 |

#### WMS Config (renderizado del mapa)

| Propiedad | Qué hace | Ejemplo | Dónde se usa |
|-----------|----------|---------|--------------|
| `wmsConfig.workspace` | Alias corto del workspace | `"seguridad"` | Para construir URL |
| `wmsConfig.layerName` | Nombre completo GeoServer | `"seguridad_y_...:datos_delitos..."` | WMS GetMap |
| `wmsConfig.baseUrl` | URL del workspace WMS | `VITE_GEOSERVER_URL + .../wms` | WMS GetMap |
| `wmsConfig.styles` | Estilo SLD a aplicar | `""` o `"tasa_total"` | WMS GetMap |
| `wmsConfig.cqlFilter` | Filtro CQL fijo | `"modalidad = 'Con violencia'"` | WMS/WFS requests |
| `wmsConfig.wmsGroup` | Clave para agrupar requests WMS | `"carreteras"` | useWMSLayerManager.js:62 — capas con mismo baseUrl+wmsGroup se fusionan en una sola petición GetMap |

#### WFS / Descarga

| Propiedad | Qué hace | Ejemplo | Dónde se usa |
|-----------|----------|---------|--------------|
| `wmsConfig.wfsAvailable` | Si permite descarga WFS y selección por polígono | `true` | downloadService.js:42, featureInfoService.js:155 |
| `wmsConfig.wfsLayerName` | Nombre alternativo para WFS si difiere del WMS | `"general:limite_estatal"` | downloadService.js:42 |
| `capa_descargable` | **Viene del backend** (tabla metadata). Si es `false`, oculta UI de descarga | `false` | LayerDetailModal.jsx:115 |

Formatos de descarga disponibles:
- **Vector:** WFS (GeoJSON, SHP, GPKG, CSV) — depende de `wfsAvailable`
- **Raster:** WCS (GeoTIFF) — para workspace `raster`
- **CSV (backend):** `GET /download/{workspace}/{layer}` — siempre disponible

#### Metadata

| Propiedad | Qué hace | Ejemplo | Dónde se usa |
|-----------|----------|---------|--------------|
| `wmsConfig.metadataLayer` | Override del nombre para consultar metadata | `"personas_desaparecidas"` | layerMetadataService.js:63 |

#### Temporal (fechas)

| Propiedad | Qué hace | Ejemplo | Dónde se usa |
|-----------|----------|---------|--------------|
| `defaultDate` | Fecha auto-aplicada al activar la capa | `"latest"` o `{ year: 2026 }` | useLayerToggle.js:48, useWMSLayerManager.js:132 |
| `wmsConfig.timeEnabled` | Habilita estilos dinámicos por tiempo | `true` | useWMSFilterUpdater.js:29 |
| `wmsConfig.timeStylePattern` | Patrón de estilo con `{year}` y `{month}` | `"lluvia_total_mensual_{year}_{month}"` | useWMSFilterUpdater.js:24, useWMSLegend.js:36 |
| `rasterPeriodicity` | Periodos disponibles para selector de tiempo raster | `{ 2025: { 1: "2025-01-01", ... } }` | LayerDetailModal.jsx:35, useRasterLoop.js:98 |
| `hidePeriodicity` | Oculta el selector de periodicidad | `true` | LayerDetailModal.jsx:36 |

#### Búsqueda

| Propiedad | Qué hace | Ejemplo |
|-----------|----------|---------|
| `searchMeta.tags` | Tags para búsqueda | `["seguridad", "delito", "feminicidio"]` |

#### InfoBox (tarjeta lateral al hacer click en feature)

| Propiedad | Qué hace | Dónde se usa |
|-----------|----------|--------------|
| `littleCard` (objeto) | Config estática del InfoBox | InfoBox.jsx:94 |
| `littleCard` (función) | Config dinámica que recibe `dateValue` y retorna objeto (raster mensual) | InfoBox.jsx:94 |

Estructura del objeto littleCard:
```js
{
  headerField: string,           // Campo para título
  headerTransform?: function,    // Transformación del header (caso especial: limite_estatal)
  labelGroups?: [                // Badges debajo del título
    { fields: string[], color?, bg?, splitValues?, staticValues?, fullWidth? }
  ],
  list?: [                       // Lista de campo-valor
    { label: string, field: string, raw? }
  ],
  cards?: [                      // Tarjetas de estadísticas
    { label: string, field: string, decimals?, raw? }
  ],
  cardsColumns?: number,         // Columnas del grid de cards (1 o 2)
  text?: [                       // Texto descriptivo
    { label: string }
  ],
  iconText?: [                   // Campos con íconos (ubicación, teléfono)
    { icon: string, field: string }
  ],
  stats?: [                      // Alias de cards en algunos templates
    { label: string, field: string }
  ]
}
```

Templates actuales (se usan para construir littleCard):

| Template | Uso típico | Qué genera |
|----------|-----------|------------|
| `TEEC` | Puntos simples (cabeceras, cultivos) | header + badges |
| `TDEMEC` | Con municipio (aeropuertos) | + municipio(naranja) + característica(morado) |
| `TDEMECLU` | Con ubicación (salud) | + list + iconTexts |
| `TDEMECLUEV` | Puntos completos (escuelas) | + stats + text |
| `TEEMLXEV` | Municipio con stats (empleo) | header + municipio + list + text + stats |
| `createMunicipioConfig` | Tasas municipales (mayoría) | header + municipio + fecha + text + cards |
| Config manual | Casos especiales | Definición libre |

### Backend actual (endpoints que funcionan):

- **GET `/metadata?workspace=X&layer=Y`** — Metadata descriptiva (descripción, fuentes, numeralia)
- **GET `/metadata/sources?layers=w:l,w:l`** — Fuentes por lotes
- **GET `/download/{workspace}/{layer}?date_from&date_to`** — CSV streaming
- **GET `/periodicity?workspace=X&layer=Y`** — Periodos disponibles
- **GET `/periodicity/batch?layers=w:l,w:l`** — Periodos por lotes

### WMS Config base (`wmsConfig.js`):

```
format: image/png, transparent: true, version: 1.1.0, srs: EPSG:6368
```

9 workspaces, 4 con alias diferente al nombre real en GeoServer:
- `seguridad` → `seguridad_y_proteccion_ciudadana`
- `gobierno` → `gobierno_y_ciudadania`
- `desarrollo` → `desarrollo_social`
- `recursos` → `recursos_y_calidad_de_vida`

---

## 2. Objetivo

1. Mover definiciones de capas al **backend** (DB + endpoint).
2. El frontend **pide** el árbol de capas, no lo importa.
3. Un **editor** permite agregar, editar y quitar capas sin tocar código.
4. El editor lista las capas disponibles en **GeoServer** para asociarlas.
5. Todo sigue funcionando: menú sider, búsqueda, WMS, WFS, InfoBox, descargas.

---

## 3. Modelo de Datos (DB)

### Tabla `layers` (nodo del árbol)

```sql
CREATE TABLE layers (
    -- Identidad
    id              VARCHAR(100) PRIMARY KEY,
    parent_id       VARCHAR(100) REFERENCES layers(id) ON DELETE CASCADE,
    label           VARCHAR(255) NOT NULL,
    sort_order      INT DEFAULT 0,

    -- Tipo de nodo
    node_type       VARCHAR(20) NOT NULL
                    CHECK (node_type IN ('tema', 'category', 'label', 'group', 'leaf')),
    -- tema     = raíz (General, Seguridad...)
    -- category = carpeta expandible (isCategory)
    -- label    = encabezado de sección sin toggle (isLabel)
    -- group    = agrupación en mapa, hijos se renderizan juntos (forceGroup)
    -- leaf     = capa con wmsConfig, la que realmente se renderiza

    -- Visibilidad
    hidden_in_menu  BOOLEAN DEFAULT FALSE,
    disabled        BOOLEAN DEFAULT FALSE,        -- equivale a label con "*"

    -- === WMS Config (solo leaf/group) ===
    workspace           VARCHAR(50),              -- alias: "seguridad"
    geoserver_layer     VARCHAR(200),             -- nombre en GeoServer SIN workspace
    styles              VARCHAR(200) DEFAULT '',
    cql_filter          TEXT DEFAULT '',
    wms_group           VARCHAR(100),             -- agrupación para merge de requests WMS

    -- === Descarga ===
    wfs_available       BOOLEAN DEFAULT TRUE,     -- permite WFS y selección por polígono
    wfs_layer_name      VARCHAR(200),             -- override nombre WFS si difiere del WMS
    downloadable        BOOLEAN DEFAULT TRUE,     -- controla si se muestra UI de descarga

    -- === Metadata ===
    metadata_layer      VARCHAR(200),             -- override para consultar metadata del backend

    -- === Temporal ===
    default_date        JSONB,                    -- null | "latest" | {"year":2026} | {"year":2026,"month":6}
    time_enabled        BOOLEAN DEFAULT FALSE,    -- habilita estilos dinámicos por tiempo
    time_style_pattern  VARCHAR(200),             -- "lluvia_total_mensual_{year}_{month}"
    raster_periodicity  JSONB,                    -- {2025: {1:"2025-01-01", 2:"2025-02-01"...}}
    hide_periodicity    BOOLEAN DEFAULT FALSE,    -- oculta selector de periodicidad

    -- === Búsqueda ===
    search_tags         TEXT[],                   -- ["seguridad", "delito", "feminicidio"]

    -- === InfoBox ===
    infobox_template    VARCHAR(50),              -- preset: "municipio" | "punto" | "punto_ubicacion" | "punto_completo" | "custom" | null
    infobox_config      JSONB,                    -- config resuelta del InfoBox (littleCard)
    -- Si infobox_template != "custom" y != null, el editor ofrece un formulario
    -- simplificado según el preset. El backend resuelve el template a infobox_config
    -- al guardar. "custom" = JSON libre.

    -- === Auditoría ===
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_layers_parent ON layers(parent_id);
CREATE INDEX idx_layers_node_type ON layers(node_type);
CREATE INDEX idx_layers_search ON layers USING GIN(search_tags);
CREATE INDEX idx_layers_workspace ON layers(workspace) WHERE workspace IS NOT NULL;
```

### Tabla `initial_layer_order` (capas activas al cargar)

```sql
CREATE TABLE initial_layer_order (
    layer_id    VARCHAR(100) REFERENCES layers(id) ON DELETE CASCADE,
    sort_order  INT,
    PRIMARY KEY (layer_id)
);
```

### Tabla `workspaces` (mapeo alias → nombre real GeoServer)

```sql
CREATE TABLE workspaces (
    alias       VARCHAR(50) PRIMARY KEY,          -- "seguridad"
    real_name   VARCHAR(200) NOT NULL,            -- "seguridad_y_proteccion_ciudadana"
    label       VARCHAR(200),                     -- "Seguridad y Protección Ciudadana"
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed inicial
INSERT INTO workspaces (alias, real_name, label) VALUES
    ('general',    'general',                             'General'),
    ('economia',   'economia',                            'Economía'),
    ('salud',      'salud',                               'Salud'),
    ('educacion',  'educacion',                           'Educación'),
    ('seguridad',  'seguridad_y_proteccion_ciudadana',    'Seguridad y Protección Ciudadana'),
    ('recursos',   'recursos_y_calidad_de_vida',          'Recursos y Calidad de Vida'),
    ('demografia', 'demografia',                          'Demografía'),
    ('desarrollo', 'desarrollo_social',                   'Desarrollo Social'),
    ('gobierno',   'gobierno_y_ciudadania',               'Gobierno y Ciudadanía'),
    ('raster',     'raster',                              'Raster (Clima)');
```

---

## 4. Endpoints

### 4.1 Lectura (consumo del mapa)

#### `GET /api/layers/tree`

Retorna el árbol completo ya armado. El frontend lo consume para el menú Sider y para WMS/WFS.

```json
[
  {
    "id": "seguridad",
    "label": "Seguridad",
    "nodeType": "tema",
    "children": [
      {
        "id": "delitos-fuero-comun",
        "label": "Incidencia en delitos del fuero común",
        "nodeType": "category",
        "children": [
          {
            "id": "tasa-vida-integridad",
            "label": "Delitos contra la vida y la integridad corporal",
            "nodeType": "label",
            "children": [
              {
                "id": "tasa_feminicidio",
                "label": "Feminicidios (tasa)",
                "nodeType": "leaf",
                "defaultDate": "latest",
                "searchMeta": { "tags": ["seguridad", "delito", "feminicidio"] },
                "wmsConfig": {
                  "workspace": "seguridad",
                  "geoserverLayer": "datos_delitos_feminicidio_secretariado",
                  "styles": "",
                  "cqlFilter": "",
                  "wmsGroup": "datos_delitos_feminicidio_secretariado",
                  "wfsAvailable": true,
                  "downloadable": true
                },
                "infoboxConfig": {
                  "headerField": "Feminicidio",
                  "labelGroups": [
                    { "fields": ["nombre"], "color": "#FF8300", "bg": "#FFF2E5" },
                    { "fields": ["fecha"] }
                  ],
                  "text": [{ "label": "Tasa de carpetas..." }],
                  "cards": [
                    { "label": "Tasa", "field": "tasa_carpetas_investigacion" },
                    { "label": "Carpetas", "field": "carpetas_investigacion" }
                  ],
                  "cardsColumns": 1
                }
              }
            ]
          }
        ]
      }
    ]
  }
]
```

#### `GET /api/layers/initial-order`

```json
["limite_iieg", "regiones", "limite_municipal", "cabeceras_municipales", "cuerpos_de_agua_50k", "curvas_de_nivel"]
```

#### `GET /api/layers/search?q=feminicidio`

Búsqueda por tags y label. Retorna capas leaf flat con su ruta en el árbol.

```json
[
  { "id": "tasa_feminicidio", "label": "Feminicidios (tasa)", "workspace": "seguridad", "path": "Seguridad > Incidencia en delitos > Delitos contra la vida" },
  { "id": "feminicidio", "label": "Feminicidio", "workspace": "seguridad", "path": "Seguridad > Delitos del fuero común > ..." }
]
```

### 4.2 GeoServer (para el editor)

#### `GET /api/geoserver/workspaces`

Lista los workspaces configurados (de la tabla `workspaces`), con las capas disponibles en GeoServer.

```json
[
  {
    "alias": "seguridad",
    "realName": "seguridad_y_proteccion_ciudadana",
    "label": "Seguridad y Protección Ciudadana",
    "layers": [
      "datos_delitos_feminicidio_secretariado",
      "datos_delitos_homicidio_doloso_secretariado",
      "delitos_fiscalia_feminicidio",
      "..."
    ]
  }
]
```

Internamente, el backend consulta la API REST de GeoServer:
```
GET {GEOSERVER_URL}/rest/workspaces/{workspace}/layers.json
```

#### `GET /api/geoserver/workspaces/{alias}/layers/{layer}/fields`

Retorna los campos de una capa de GeoServer (para configurar filtros CQL e InfoBox).

```json
{
  "workspace": "seguridad",
  "layer": "datos_delitos_feminicidio_secretariado",
  "fields": [
    { "name": "nombre", "type": "string" },
    { "name": "tasa_carpetas_investigacion", "type": "number" },
    { "name": "carpetas_investigacion", "type": "number" },
    { "name": "fecha", "type": "string" },
    { "name": "municipio", "type": "string" }
  ],
  "sampleValues": {
    "nombre": ["Guadalajara", "Zapopan", "Tlaquepaque"],
    "fecha": ["2024-01", "2024-02"]
  }
}
```

Internamente consulta via WFS `maxFeatures=1` para obtener campos, y `propertyName=X` para valores de ejemplo.

#### `GET /api/geoserver/workspaces/{alias}/layers/{layer}/styles`

Retorna los estilos disponibles para una capa.

```json
{
  "styles": ["default", "tasa_total", "tasa_mujeres", "tasa_hombres"]
}
```

### 4.3 CRUD (editor)

#### `POST /api/layers`

Crea un nodo (tema, categoría, grupo o capa). El body depende del `nodeType`:

**Crear una categoría:**
```json
{
  "id": "nueva-categoria",
  "parentId": "seguridad",
  "label": "Nueva Categoría",
  "nodeType": "category",
  "sortOrder": 5
}
```

**Crear una capa leaf:**
```json
{
  "id": "tasa_nueva_capa",
  "parentId": "nueva-categoria",
  "label": "Nueva capa (tasa)",
  "nodeType": "leaf",
  "sortOrder": 0,

  "workspace": "seguridad",
  "geoserverLayer": "nombre_capa_en_geoserver",
  "styles": "",
  "cqlFilter": "",
  "wmsGroup": "nombre_capa_en_geoserver",

  "wfsAvailable": true,
  "downloadable": true,

  "defaultDate": "latest",
  "timeEnabled": false,

  "searchTags": ["seguridad", "nueva", "tasa"],

  "infoboxTemplate": "municipio",
  "infoboxParams": {
    "title": "Nueva capa",
    "text": "Descripción de la capa",
    "stats": [
      { "label": "Tasa", "field": "tasa_valor" },
      { "label": "Total", "field": "total" }
    ]
  }
}
```

El backend:
1. **Valida** que `workspace:geoserverLayer` exista en GeoServer.
2. Si `infoboxTemplate` es un preset (no "custom"), **resuelve** `infoboxParams` al JSON completo de `infoboxConfig` usando la lógica del template.
3. Guarda en DB.

#### `PUT /api/layers/{id}`

Edita un nodo existente. Mismo body que POST (campos parciales).

#### `DELETE /api/layers/{id}`

Elimina un nodo y todos sus hijos (ON DELETE CASCADE).

#### `PATCH /api/layers/reorder`

Cambia el orden de nodos dentro de un padre.

```json
{
  "parentId": "delitos-fuero-comun",
  "order": ["tasa-vida-integridad", "tasa-libertad-sexual", "tasa-familia", "tasa-patrimonio"]
}
```

#### `POST /api/layers/{id}/duplicate`

Duplica una capa (o grupo con hijos). Genera nuevos IDs con sufijo.

#### `PATCH /api/layers/initial-order`

Actualiza las capas activas al cargar el mapa.

```json
{
  "layers": ["limite_iieg", "regiones", "limite_municipal"]
}
```

---

## 5. Editor — Flujo de uso

### 5.1 Crear una capa nueva

```
1. Seleccionar padre (tema > categoría > subcategoría)
2. Seleccionar workspace de la lista
3. Ver capas disponibles en GeoServer para ese workspace
4. Seleccionar la capa de GeoServer
   → Se cargan automáticamente los campos disponibles
5. Configurar propiedades:
   ┌─────────────────────────────────────────┐
   │ IDENTIDAD                               │
   │  - ID (auto-generado, editable)         │
   │  - Label (nombre visible)               │
   │  - Tags de búsqueda                     │
   ├─────────────────────────────────────────┤
   │ VISUALIZACIÓN WMS                       │
   │  - Estilo (lista de estilos GeoServer)  │
   │  - Filtro CQL (con ayuda de campos)     │
   │  - Grupo WMS (agrupación de requests)   │
   ├─────────────────────────────────────────┤
   │ DESCARGA                                │
   │  ☑ Permitir descarga WFS               │
   │  ☑ Mostrar botón de descarga           │
   │  - Nombre WFS alternativo (opcional)    │
   ├─────────────────────────────────────────┤
   │ TEMPORAL                                │
   │  - Fecha por defecto: [ninguna|latest|  │
   │    año específico|año+mes]              │
   │  ☐ Habilitar estilos por tiempo        │
   │  - Patrón de estilo temporal            │
   │  ☐ Ocultar selector de periodicidad    │
   ├─────────────────────────────────────────┤
   │ INFOBOX                                 │
   │  Template: [municipio ▾]                │
   │  → Formulario según template:           │
   │    - Título (seleccionar campo)         │
   │    - Texto descriptivo                  │
   │    - Estadísticas (campo → etiqueta)    │
   │  [Cambiar a JSON libre]                 │
   ├─────────────────────────────────────────┤
   │ AVANZADO                                │
   │  ☐ Ocultar del menú                    │
   │  ☐ Deshabilitada                       │
   │  - Capa de metadata alternativa         │
   └─────────────────────────────────────────┘
6. Guardar → El backend valida contra GeoServer y guarda
```

### 5.2 Crear un grupo (forceGroup)

```
1. Seleccionar padre
2. Crear nodo tipo "group" con label
3. Dentro del grupo, agregar capas hijas (cada una con su filtro CQL distinto)
   Ejemplo: "Robos" → "Con violencia" (CQL), "Sin violencia" (CQL)
4. Las hijas comparten el mismo geoserverLayer pero con filtros diferentes
```

### 5.3 Templates de InfoBox en el editor

El editor ofrece presets para simplificar la configuración:

| Preset | Para qué | Campos que pide |
|--------|----------|-----------------|
| `municipio` | Tasas municipales (la mayoría de las capas) | título, texto, stats[] |
| `punto` | Puntos simples (cabeceras, cultivos) | título, característica |
| `punto_municipio` | Puntos con municipio (aeropuertos) | título, municipio, característica |
| `punto_ubicacion` | Puntos con dirección (salud) | título, municipio, característica[], list[], iconTexts[] |
| `punto_completo` | Puntos con todo (escuelas) | título, municipio, característica[], list[], iconTexts[], stats[], text |
| `custom` | JSON libre | Editor JSON completo |

Al guardar, el backend expande el preset a un `infobox_config` JSON completo. El frontend siempre recibe el JSON resuelto.

---

## 6. Qué Cambia en el Frontend

### 6.1 Sider (Menú de capas)

**Antes:** Importa `layers` de `definitions/index.js`.
**Después:** Fetch a `GET /api/layers/tree` al montar + caché local.

El árbol mantiene la misma estructura. Mapeo de `nodeType`:
- `category` → mismo que `isCategory: true`
- `label` → mismo que `isLabel: true`
- `group` → mismo que `forceGroup: true`
- `leaf` → capa con `wmsConfig`
- `disabled: true` → mismo que `label.startsWith('*')`

### 6.2 WMS (renderizar en mapa)

El frontend sigue construyendo URLs localmente:

```js
const baseUrl = `${VITE_GEOSERVER_URL}${WORKSPACE_REAL_NAMES[workspace] || workspace}/wms`;
const layerName = `${WORKSPACE_REAL_NAMES[workspace] || workspace}:${geoserverLayer}`;
```

`WORKSPACE_REAL_NAMES` puede venir del endpoint `/api/geoserver/workspaces` en vez de estar hardcodeado.

### 6.3 WFS / Descargas

Sin cambio funcional. Ahora `downloadable` viene del endpoint en vez de `capa_descargable` de metadata. `wfsAvailable` sigue igual.

### 6.4 InfoBox

Sin cambio. `infoboxConfig` viene como JSON plano resuelto. El frontend ya consume `headerField`, `labelGroups`, `cards`, etc.

**Caso especial `headerTransform`:** El `limiteEstatalConfig` tiene una función JS que no se puede serializar. Se resuelve con un campo `headerTransformType: "limite_estatal"` en el JSON, y el frontend lo mapea a la función correspondiente.

**Caso especial `littleCard` como función:** Las capas raster mensual tienen `littleCard(dateValue)`. Se resuelve moviendo la lógica de formateo de fecha al frontend — el JSON guarda la config base y el frontend aplica la fecha dinámicamente.

### 6.5 Búsqueda

`GET /api/layers/search?q=X` reemplaza la búsqueda actual. El frontend solo cambia la URL.

---

## 7. Plan de Migración (Pasos)

### Fase 1 — Backend: Modelo + Endpoints de lectura

1. Crear tablas `layers`, `initial_layer_order`, `workspaces`.
2. Script de seed: transforma los 9 archivos JS a registros SQL.
3. Endpoint `GET /api/layers/tree` — reconstruye árbol desde DB.
4. Endpoint `GET /api/layers/initial-order`.
5. Endpoint `GET /api/layers/search?q=X`.

### Fase 2 — Frontend: Consumir endpoints

6. Servicio `layerTreeService.js` con `fetchLayerTree()`, caché local.
7. Reemplazar import estático de `layers` por fetch.
8. Cargar `WORKSPACE_REAL_NAMES` desde endpoint (o mantener hardcoded temporalmente).
9. Validar que Sider, búsqueda, WMS, WFS, InfoBox, descargas funcionen.

### Fase 3 — Backend: GeoServer + CRUD

10. Servicio `GeoServerService` para listar workspaces, capas, campos y estilos.
11. Endpoints CRUD: POST/PUT/DELETE/PATCH para capas.
12. Resolución de templates de InfoBox en el backend.
13. Validación contra GeoServer al crear/editar capas.

### Fase 4 — Editor UI

14. Pantalla de administración de capas.
15. Selector de capas GeoServer con preview de campos.
16. Formulario dinámico según tipo de nodo y template de InfoBox.
17. Drag & drop para reordenar.
18. Preview en vivo del mapa al configurar.

---

## 8. Consideraciones

- **Caché:** `GET /api/layers/tree` debería cachear con TTL o ETag — el árbol cambia poco.
- **Migración gradual:** El frontend puede tener fallback al import estático mientras se valida.
- **URLs de GeoServer:** El frontend sigue construyendo las URLs WMS/WFS. El backend solo almacena alias de workspace.
- **Templates InfoBox:** Los presets simplifican el editor. Se resuelven a JSON en el backend al guardar. Si cambia un template, se puede re-resolver en batch.
- **Raster:** Campos `timeEnabled`, `timeStylePattern`, `rasterPeriodicity` cubren toda la lógica actual.
- **Funciones no serializables:** `headerTransform` y `littleCard(dateValue)` se manejan con flags/tipos en el JSON y lógica en el frontend.
- **Descarga triple:** El campo `downloadable` controla la UI. `wfsAvailable` controla si se puede hacer WFS. El CSV del backend siempre está disponible si la capa existe en DB.
- **GeoServer credentials:** Se reutilizan las env vars `GEOSERVER_URL`, `GEOSERVER_USER`, `GEOSERVER_PASSWORD` que ya existen en el backend config.
