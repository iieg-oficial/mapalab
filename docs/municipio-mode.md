# Modo Vista por municipio

Feature beta (sólo con `VITE_APP_ENV` en `dev` o `beta`) que permite al usuario enfocar el visor en uno o varios municipios de Jalisco. Combina **máscara visual** + **filtros CQL por capa** + **zoom al bbox** para que la vista se sienta exclusiva del municipio seleccionado.

## Estado: beta

Activo sólo cuando `import.meta.env.VITE_APP_ENV` es `dev` o `beta`. En `production` el botón no se renderiza (`MunicipioFilterButton` retorna `null`).

Cuando se gradúe a producción, quitar el gate `IS_NON_PROD` de [MunicipioFilterButton.jsx](../frontend/src/pages/maps/components/MapExport/MunicipioFilterButton.jsx).

## Arquitectura

```
PostgreSQL (dataengine)
  mapa_base.limite_municipal        ← tabla real IIEG (usada por GeoServer)
  mapa_base.limite_municipal_inegi  ← tabla real INEGI
        │
        ▼ (vista materializada, refresh mensual)
  mapalab.municipios                ← clave_geo + nombre + region + geom_iieg + geom_inegi
        │
        ▼ (endpoint backend)
  mapalab-backend
    GET /municipios/                ← lista {clave, nombre, region, areaKm2, areaHa}
    GET /municipios/geometries?...  ← GeoJSON + unionBbox + unionWkt
        │
        ▼ (fetch + cache)
  frontend
    municipioService.js             ← fetch
    useMunicipioMode                ← estado + selección + municipioContext
    useMunicipioMask                ← VectorLayer con máscara negra
    useWMSLayerManager              ← aplica CQL por capa según searchMeta
    useWMSFilterUpdater             ← refresca CQL cuando cambia municipio
    MunicipioFilterButton + Panel   ← UI dropdown
```

## Tres mecanismos combinados

### 1. Filtrado CQL por capa (preciso, requiere config)

Cuando una capa tiene metadata `searchMeta.hasMunicipio + municipioField + municipioFieldType` en `mapalab.layers`, el visor inyecta `CQL_FILTER=<field> IN ('14039','14120',…)` para esa capa específicamente. Esto:

- Reduce el dataset que pinta GeoServer (mejor performance)
- URLs cortas (~50-200 bytes para el filtro espacial)
- PostGIS usa índice B-tree → instantáneo
- Cache nginx compartido entre usuarios viendo el mismo municipio

Las claves se resuelven en `useMunicipioMode.municipioContext`:
- `claves: ['14039','14120',…]` siempre presente
- `nombres: ['Guadalajara','Zapopan',…]` resuelto desde `mapalab.municipios` para capas con `municipioFieldType='nombre'`

Si la capa tiene metadata pero algo falla (lista de municipios no cargada, clave no existe), [`municipioCqlBuilder.js`](../frontend/src/pages/maps/helpers/municipioCqlBuilder.js) emite `console.warn` informativo y cae en BBOX.

### 2. BBOX fallback (universal, sin config)

Capas sin `hasMunicipio=true` reciben `CQL_FILTER=BBOX(geom, xmin, ymin, xmax, ymax, 'EPSG:6368')` con el bbox unión de los seleccionados. Es menos preciso (incluye features de municipios vecinos dentro del rectángulo) pero funciona universalmente.

**Capas raster** (workspaces `raster`, `lluvia`, `temperatura`) están excluidas del filtro espacial — son píxeles, no features.

### 3. Máscara visual oscura (`rgba(0,0,0,0.85)`)

Independiente del filtro CQL, [`useMunicipioMask.js`](../frontend/src/pages/maps/hooks/useMunicipioMask.js) cubre el resto del viewport con polígono oscuro y holes recortados con la geometría real de los municipios. Esconde lo que sobresale del bbox/INTERSECTS y refuerza el foco visual.

## Configuración por capa (mariachi admin)

Editor en **mariachi** → editar capa → tab "Identidad" → "Filtro por municipio".

Controles:
- **Switch `hasMunicipio`**: activa la metadata
- **Dropdown "Campo de municipio"**: lista las columnas del WMS (vía `/geoserver/workspaces/{alias}/layers/{layer}/fields?include_samples=true`). Si el nodo siendo editado no tiene `geoserver_layer` propio (caso de `group`/`label`), busca recursivamente en descendientes y avisa cuántas capas heredan
- **Select "Tipo de valor"**: `clave` (INEGI 5 dígitos) o `nombre` (texto). Se auto-detecta leyendo muestras de la columna:
  - ≥80% match patrón `/^14\d{3}$/` → `clave`
  - ≥80% texto alfabético → `nombre`
  - Otro → warning "esta columna no parece de municipio"

Implementado en [`MunicipioFieldPicker.jsx`](../../mariachi/admin/src/features/mapalab-layers/components/MunicipioFieldPicker.jsx).

### Herencia automática (group → descendientes)

[`layer_tree_service.py::_inherit_municipio_meta`](../backend/app/services/layer_tree_service.py) propaga el `searchMeta.hasMunicipio + municipioField + municipioFieldType` desde un ancestro hacia descendientes que NO tengan su propia configuración. El admin configura una sola vez en el `group` y se aplica a todas las propiedades hijas. Si una propiedad hija tiene su propia config, gana (override local).

## Inventario actual de capas configuradas

Ejecutar para auditar:

```sql
SELECT geoserver_layer, municipio_field, municipio_field_type, COUNT(*) AS sub_capas
FROM mapalab.layers
WHERE has_municipio = true
GROUP BY geoserver_layer, municipio_field, municipio_field_type
ORDER BY geoserver_layer;
```

Configuradas vía SQL inicial (mayo 2026):

| geoserver_layer | municipio_field | municipio_field_type | Notas |
|---|---|---|---|
| `salud:unidades_salud` | `municipio` | nombre | 33 sub-capas (instituciones × niveles) |
| `educacion:centros_educativos` | `municipio` | nombre | 8 sub-capas |
| `recursos:uso_de_suelo_serie_7` | `cvegeo` | clave | 8 sub-capas |

El resto cae en BBOX fallback. Para añadir más, usa el picker en mariachi (recomendado) o `UPDATE mapalab.layers SET …`.

### Casos descartados durante el inventario inicial

- **`general:cabeceras_municipales`**: `clave_municipio` formato 2 chars (`'01'`), incompatible con el formato 5 chars de `mapalab.municipios.clave_geo` (`'14001'`)
- **`recursos:area_de_proteccion_bosque_la_primavera`**: `municipio` contiene una LISTA de nombres como string (`'Tala, Zapopan, El Arenal y Tlajomulco de Zúñiga'`); no se puede filtrar con `IN`
- **`recursos:espacios_publicos_y_lugares_recreativos`**: `cvegeo` formato manzana INEGI (16 chars); el municipio son solo los primeros 5

Para soportarlos en el futuro, requeriría:
- Padding/transformación en CQL para `cabeceras_municipales` → cambio en backend o columna nueva
- Tabla normalizada (un registro por municipio) para `area_de_proteccion_*`
- Filtro `LIKE` o columna `clave_municipio` derivada (primeros 5 chars) para `espacios_publicos`

## Vista materializada `mapalab.municipios`

Definida en [`dataengine/jobs/alembic/versions/20260525_0015_municipios_materialized_view.py`](../../dataengine/jobs/alembic/versions/20260525_0015_municipios_materialized_view.py). Combina IIEG e INEGI:

```sql
CREATE MATERIALIZED VIEW mapalab.municipios AS
SELECT
    iieg.clave_geo::text AS clave_geo,
    iieg.nombre,
    iieg.region,
    iieg.area_km2,
    iieg.area_ha,
    iieg.geom AS geom_iieg,
    inegi.geom AS geom_inegi
FROM mapa_base.limite_municipal iieg
LEFT JOIN mapa_base.limite_municipal_inegi inegi
    ON iieg.clave_geo::bpchar = inegi.clave_geo::text
WITH DATA;
```

Refresh mensual (día 1 a 06:00) vía [`dataengine/jobs/run_refresh_municipios.py`](../../dataengine/jobs/run_refresh_municipios.py).

## Endpoint `/municipios/geometries`

[`backend/app/routers/municipios.py`](../backend/app/routers/municipios.py) responde:

```json
{
  "type": "FeatureCollection",
  "source": "iieg",
  "features": [
    { "type": "Feature", "properties": {"clave": "14039", "nombre": "Guadalajara"},
      "geometry": {"type": "Polygon", "coordinates": […]} }
  ],
  "unionBbox": [639885.39, 2249214.40, 722049.00, 2322575.99],
  "unionWkt": "MULTIPOLYGON(…)",
  "unionSrid": 6368,
  "unionToleranceMeters": 50,
  "unionIsEnvelope": false
}
```

- `features`: GeoJSON EPSG:3857 para la máscara visual
- `unionBbox`: 4 floats EPSG:6368 para BBOX fallback
- `unionWkt`: polígono simplificado (bisección adaptativa hasta 8KB). Disponible pero no usado actualmente en frontend
- `source=iieg|inegi`: el frontend decide según si la capa de límites activa es IIEG o INEGI

## Migration `municipio_field_type`

Schema agregado mayo 2026:
- `mapalab.layers.municipio_field_type varchar(20)` — valores `clave` | `nombre` | NULL
- Migration alembic: `dataengine/jobs/alembic/versions/20260526_0017_layer_municipio_field_type.py`
- Backend (`layer_tree_service.py::_layer_to_search_meta`) lo expone como `searchMeta.municipioFieldType`
- Mariachi (`api/app/schemas/layer.py` + `models/layer.py`) lo soporta en LayerBase + LayerUpdate
- Mariachi UI (`MunicipioFieldPicker.jsx`) lo edita con auto-detección

## Persistencia

- **URL**: `?municipios=14039,14120` (parsed por `useInitializeFromUrl`)
- **Share JSON v2**: `{ "municipios": { "source": "iieg", "selected": ["14039","14120"] } }`
- **sessionStorage**: implícito por React state (no se persiste explícitamente al recargar; viene de URL o share)

## Telemetría

Eventos en `analyticsService.js`:
- `municipio_mode_enter`: `{source, count, fromUrl}`
- `municipio_mode_exit`: `{durationSec, source}`
- `municipio_mode_change`: `{source, count, action}` — `set_municipio` | `set_region` | `set_zmg` | `clear`
- `municipio_panel_open`: `{source, active}`

Whitelisted en mariachi-api `mapalab_event.py::ALLOWED_EVENT_NAMES`. Documentado en mariachi-admin `TelemetryTopic.jsx`.

## Hotfix `controlflow.properties` (mayo 2026)

Cuando varios usuarios activaban modo municipio con muchas capas activas simultáneas, GeoServer Control-flow rechazaba con 429 (límite `user=6` concurrentes por usuario).

Solución: [`geoserver/config/controlflow.properties.template`](../../geoserver/config/controlflow.properties.template) — template versionado con valores parametrizados desde `.env`. Valores actuales: `user=40`, `ows.wms.getmap=80`, `ip=40`, `user.ows.wms.getmap=120/s`. Generado por `entrypoint-wrapper.sh` en cada arranque del contenedor. GeoServer Control-flow recarga el archivo automáticamente al cambiar su mtime.

Cuando todas las capas críticas tengan `clave_municipio`/`municipio_field` configurado y las URLs sean naturalmente cortas, se podrá bajar a valores menos permisivos (ej. `user=10`).

## Componentes UI

| Archivo | Rol |
|---|---|
| [`MapToolsPanel.jsx`](../frontend/src/pages/maps/components/MapToolsPanel.jsx) | Contenedor del panel de herramientas del mapa; ancho fijo del sider (340px); botón colapsar flotante a la izquierda |
| [`MunicipioFilterButton.jsx`](../frontend/src/pages/maps/components/MapExport/MunicipioFilterButton.jsx) | Botón del modo municipio dentro del panel; muestra label dinámico (`Jalisco` / `ZMG` / nombre municipio / `Región X`) con badge `beta` |
| [`MunicipioFilterPanel.jsx`](../frontend/src/pages/maps/components/MapExport/MunicipioFilterPanel.jsx) | Dropdown anclado al botón; lista ZMG → Regiones → Municipios con búsqueda |
| [`MunicipioActiveChip.jsx`](../frontend/src/pages/maps/components/MapExport/MunicipioActiveChip.jsx) | Chip flotante centrado-arriba con el municipio activo + botón cerrar |
| [`FloatingIconButton.jsx`](../frontend/src/components/FloatingIconButton.jsx) | Componente shared reutilizado por `SiderModeButton` y `MapToolsPanel` para botones flotantes con tooltip + ícono |

## Plan a futuro

Documento de plan: `repos/mapalab/planes/clave-municipio-en-tablas.md` en el repositorio central de contexto. Resumen: estandarizar todas las tablas relevantes con columna `clave_municipio varchar(5)` indexada, calculada en ETL desde geometrías. Cuando esté listo se podrá reverir el hotfix de `controlflow` y eliminar la lógica de BBOX fallback.
