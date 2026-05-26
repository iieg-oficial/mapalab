# Plan — `clave_municipio` como columna indexada en tablas espaciales

## Contexto

El modo "Vista por municipio" del visor (frontend en `frontend/src/pages/maps/components/MapExport/MunicipioFilterButton.jsx` + `useMunicipioMode.js`) actualmente filtra las capas WMS aplicando `CQL_FILTER=INTERSECTS(geom, POLYGON((...WKT detallado...)))` con el polígono unión de los municipios seleccionados. Ver `backend/app/repositories/municipios_repository.py:75` para la generación del WKT y `useWMSLayerManager.js:158` / `useWMSFilterUpdater.js:51` para la inyección del filtro.

Este enfoque tiene tres problemas técnicos que afectan operación:

1. **URLs gigantes**: el WKT mide entre 3KB y 8KB. Con bisección adaptativa de tolerancia (50m → 5000m) se acota a 8KB, pero cada capa activa duplica el WKT en su request. Con 6 capas activas, el browser dispara 6 requests de ~6KB c/u simultáneas al cambiar de municipio.
2. **Cache miss garantizado**: la URL es distinta por cada combinación municipio + capa. nginx `proxy_cache` no puede reaprovechar entre usuarios ni entre cambios de selección. Cada activación va al backend.
3. **PostGIS lento por feature**: `ST_Intersects` con un polígono complejo evalúa cada candidato contra cientos de vértices. Sin índice apropiado para esta operación, el costo crece con el tamaño de la tabla.

El primer impacto operativo fue **429 Too Many Requests** desde GeoServer Control-flow (`/opt/geoserver/data_dir/controlflow.properties`, originalmente `user=6`). Se mitigó subiendo a `user=40` con un template versionado en `geoserver/config/controlflow.properties.template`, pero es un parche.

## Inventario relevante

Lo que ya existe y se reaprovecha:

| Activo | Ubicación | Estado |
|---|---|---|
| Vista materializada `mapalab.municipios` con geometrías IIEG e INEGI | `dataengine/jobs/alembic/versions/20260525_0015_municipios_materialized_view.py` | Productiva, refresh mensual día 1 |
| Job de refresh mensual | `dataengine/jobs/run_refresh_municipios.py` | Productivo, en crontab |
| Endpoint `/municipios/geometries` | `backend/app/routers/municipios.py:64` | Productivo, devuelve GeoJSON + unionWkt simplificado |
| Schema `mapalab.layers` con campos `has_municipio` y `municipio_field` | `backend/app/models/layer.py` y `backend/app/services/layer_tree_service.py:65-68` | **Schema existe, no se usa todavía** |
| Mariachi UI para editar capas | `mariachi/admin/src/features/capas/` | Productivo, soporta editar metadata |
| Máscara visual oscura sobre el resto del mapa | `frontend/src/pages/maps/hooks/useMunicipioMask.js` | Productivo, independiente del filtro |
| Hook del modo municipio | `frontend/src/pages/maps/hooks/useMunicipioMode.js` | Productivo, genera `globalIntersectsCql` |

Lo que se elimina al final del plan:

- `globalCqlFilter` en `useWMSLayerManager.js` y `useWMSFilterUpdater.js` (la lógica de inyectar un filtro global a todas las capas)
- Bisección adaptativa de tolerancia en `municipios_repository.py:get_union_wkt` (era un workaround para acotar el WKT en URL)
- `unionWkt`, `unionSrid`, `unionToleranceMeters`, `unionIsEnvelope` del endpoint `/municipios/geometries` (ya no se necesitan)
- Hotfix de Control-flow (revertir `user=40` → `user=6` u otro valor menos alarmante)

## Diseño

### Idea central

Cada tabla con features puntuales, lineales o poligonales que se filtran por municipio expone una columna que identifica al municipio del feature. El frontend, en lugar de inyectar un WKT en CQL_FILTER, genera `CQL_FILTER=<campo> IN ('valor1','valor2',...)` por capa. La URL es estable, chica y cacheable.

### Realidad actual: campos heterogéneos

Las tablas existentes NO usan un único campo estandarizado. Por inspección:

| Tabla | Campo de municipio existente | Tipo de valor |
|---|---|---|
| `salud.unidades_salud` | `municipio` | nombre (string) — ej. `'Guadalajara'` |
| `seej.centros_educativos` | (por verificar) | (por verificar) |
| `seguridad.delitos_*` | (por verificar) | (puede ser `cve_mun`, `clave_municipio`, `municipio`, etc.) |
| `mapa_base.cabeceras_municipales` | `clave_geo` | clave INEGI 5 dígitos |
| (tablas sin campo de municipio) | — | requiere agregar columna y backfill desde `geom` |

Esto implica que el plan debe soportar **tres casos**, no uno:

**Caso A — La tabla ya tiene un campo con clave INEGI**: declarar en mariachi `municipioField='clave_geo'` (o el nombre real) y `municipioFieldType='clave'`. No requiere migración.

**Caso B — La tabla ya tiene un campo con nombre del municipio**: declarar en mariachi `municipioField='municipio'` y `municipioFieldType='nombre'`. El frontend resuelve `claves → nombres` consultando `mapalab.municipios`. Útil mientras se hace el backfill a clave, pero **frágil** por inconsistencias de acentos, case, variaciones (`'Cd. Guzmán'` vs `'Zapotlán el Grande'`). Aceptable como puente, no como destino final.

**Caso C — La tabla no tiene ningún campo de municipio**: agregar columna `clave_municipio varchar(5)` con índice B-tree, calcular vía `ST_Within(tabla.geom, limite_municipal.geom)`, indexar.

### Por qué la meta es estandarizar a `clave_municipio` (caso C en todas)

- **Sin ambigüedad**: una clave INEGI nunca tiene acentos, case ni alias.
- **Tamaño fijo**: 5 caracteres, exactamente.
- **Compatible con `mapalab.municipios.clave_geo`**: facilita joins y consistencia.
- **Indexable B-tree de bajo costo**: lookups O(log n).
- **Robusto a futuros renames**: si `Tlaquepaque` cambia oficialmente de nombre, la clave `14098` no cambia.
- **Compatible con ZMG/región sin hardcoding**: `IN ('14039','14120',...)` es trivial.

Por eso el plan empuja a que, eventualmente, todas las capas relevantes terminen en el caso C. Pero el visor debe operar correctamente en los tres casos durante la transición (semanas o meses).

### Comparación

```
Hoy:
  GET /geoserver/salud/wms
      ?LAYERS=salud:unidades_salud
      &CQL_FILTER=(INTERSECTS(geom, POLYGON((651950.83 2258445.04, ... 8KB ...))))
                  AND ((nombre_institucion='Cruz Roja' AND nivel_atencion='Primer nivel') OR ...)
      &BBOX=...
  → URL 9KB, cache miss, PostGIS evalúa 33 sub-filtros contra polígono complejo

Después:
  GET /geoserver/salud/wms
      ?LAYERS=salud:unidades_salud
      &CQL_FILTER=clave_municipio IN ('14039','14120','14098','14101','14097','14070','14051','14044','14124')
                  AND ((nombre_institucion='Cruz Roja' AND nivel_atencion='Primer nivel') OR ...)
      &BBOX=...
  → URL 1KB, cache hit para usuarios viendo Guadalajara, índice B-tree instantáneo
```

### Comportamiento por tipo de capa

| Tipo de capa | Estrategia | Razón |
|---|---|---|
| **Puntuales** (`unidades_salud`, `centros_educativos`, `delitos_*`, `aeropuertos`, `feminicidios`, etc.) | `clave_municipio` indexada + filtro CQL | Una feature pertenece a 1 municipio sin ambigüedad |
| **Lineales que cruzan municipios** (`carreteras`, `curvas_de_nivel`, `cuerpos_de_agua_50k` riberas) | `clave_municipio` indexada, asignación por mayor longitud de intersección. Opcionalmente duplicar registro si el feature debe verse completo en ambos. Decisión por capa. | Una carretera que cruza 5 municipios solo aparece en 1 si no se duplica |
| **Poligonales que cruzan municipios** (`agave_en_area_de_proteccion_*`) | Igual que lineales, asignación por mayor área de intersección o duplicar | Mismo razonamiento |
| **Raster** (`raster:precipitacion`, `raster:temperaturas`, `lluvia:*`, etc.) | **No filtrar**. Mantener máscara visual oscura | Son píxeles, no features. La máscara cubre lo de afuera del municipio |
| **Capas de límites administrativos** (`general:limite_municipal`, `general:limite_iieg`, `general:regiones`) | **No filtrar**. Visibles siempre, son contexto | Sirven de referencia espacial |
| **Datos socioeconómicos a nivel municipio** (`carencia_*`, `rezago_educativo`, `brecha_salarial`) | Ya tienen `clave_geo` o equivalente. Solo declarar `municipio_field` apropiado en mariachi | Ya están municipalizadas por diseño |

### Reglas para resolver ambigüedad

Documentadas por capa en `mariachi/admin` como parte de la metadata de la capa:

- `municipioField`: nombre de la columna (default `clave_municipio`)
- `municipioAssignment`: `centroid` | `largestArea` | `largestLength` | `duplicate` | `containing`
  - `centroid`: para puntos (default)
  - `largestArea`: para polígonos que cruzan, asignar al municipio con mayor solapamiento
  - `largestLength`: para líneas que cruzan, asignar al municipio con mayor longitud
  - `duplicate`: insertar una fila por cada municipio que toca (consume más espacio, feature se ve completo)
  - `containing`: solo si está completamente contenido en 1 municipio; si cruza, queda NULL

## Implementación

### Fase 1 — Infraestructura base (dataengine + mariachi)

**1.1** Helper SQL reusable en `dataengine/jobs/sql/clave_municipio_helpers.sql`:

```sql
-- Función que dada una geometría devuelve la clave_geo del municipio según estrategia
CREATE OR REPLACE FUNCTION mapa_base.resolve_clave_municipio(
    geom geometry,
    strategy text DEFAULT 'centroid'
) RETURNS text AS $$
    -- centroid: ST_Within(ST_Centroid(geom), mun.geom)
    -- largestArea: ST_Area(ST_Intersection(geom, mun.geom)) máx
    -- largestLength: ST_Length(ST_Intersection(geom, mun.geom)) máx
    -- containing: ST_Within(geom, mun.geom)
$$ LANGUAGE plpgsql;
```

**1.2** Schema migration `dataengine/jobs/alembic/versions/YYYYMMDD_clave_municipio_metadata.py`:
- Agregar a `mapalab.layers` columna `municipio_assignment varchar(20)` (nullable, default `'centroid'`)
- Agregar índice opcional para queries del frontend

**1.3** Job genérico `dataengine/jobs/run_backfill_clave_municipio.py`:
- Lee lista de capas con `has_municipio=true` desde `mapalab.layers`
- Para cada una: agrega columna si no existe, calcula `clave_municipio` con la estrategia de la capa, indexa
- Idempotente: re-correrlo solo actualiza cambios

**1.4** Mariachi: ajustar `mariachi/admin/src/features/capas/CapaForm.jsx` para mostrar:
- Toggle `hasMunicipio`
- Input `municipioField` (default `clave_municipio` para nuevas, el nombre real para capas existentes ej. `'municipio'` en `salud.unidades_salud`)
- Select `municipioFieldType` (`clave` | `nombre`): determina cómo el frontend resuelve las claves a valores filtrables. `clave` usa `clave_geo` directo; `nombre` usa el `nombre` de `mapalab.municipios`
- Select `municipioAssignment` (centroid / largestArea / largestLength / duplicate / containing): aplica solo cuando se hace backfill desde `geom` (caso C)

**1.5** Backend ajusta `_layer_to_search_meta` en `backend/app/services/layer_tree_service.py:57` para incluir `municipioFieldType` en el JSON expuesto al frontend.

**1.6** Frontend ajusta `useWMSLayerManager.js` / `useWMSFilterUpdater.js` para generar el CQL por capa según `municipioFieldType`:
- `clave`: `<field> IN ('14039','14120',...)`
- `nombre`: resuelve `claves → nombres` consultando `mapalab.municipios` (cached) y genera `<field> IN ('Guadalajara','Zapopan',...)`

### Fase 2 — Aprovechar campos existentes (semana 1, sin migraciones)

Antes de migrar, declarar en mariachi las capas que YA tienen un campo de municipio. Esto da el beneficio inmediato sin tocar tablas. Auditar cada tabla:

```sql
-- Para cada capa relevante: identificar si existe campo de municipio
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = '<schema>' AND table_name = '<tabla>'
  AND column_name ~* '(municipio|cve_mun|clave_mun|mun_id|cvegeo)';
```

Inventario inicial conocido:

| Capa | Campo existente | Tipo | Acción |
|---|---|---|---|
| `salud.unidades_salud` | `municipio` | nombre | Marcar `municipioField='municipio'`, `municipioFieldType='nombre'`. Documentar caveats de inconsistencias |
| `mapa_base.cabeceras_municipales` | `clave_geo` (probable) | clave | Marcar `municipioField='clave_geo'`, `municipioFieldType='clave'` |
| (resto por auditar) | — | — | Llenar tabla con SQL anterior |

### Fase 3 — Migrar capas sin campo a `clave_municipio` (semana 1-2)

Capas que no tienen campo de municipio, o que lo tienen pero queremos estandarizar a clave (recomendado).

Por capa:
1. Migration que agrega `clave_municipio varchar(5)` + índice B-tree
2. Backfill: ejecutar vía `run_backfill_clave_municipio.py` con la estrategia de la capa
3. Marcar en mariachi `hasMunicipio=true, municipioField='clave_municipio', municipioFieldType='clave'`
4. Verificar en logs nginx que `CQL_FILTER` ahora incluye `clave_municipio IN ('14039',...)`
5. Opcional: dropear el campo viejo (`municipio` con nombre) en una segunda iteración cuando ya no se use

### Fase 4 — Migrar capas lineales/poligonales (semana 2)

Capas con cruces de municipios. Decisión caso por caso.

| Capa | Tipo | Estrategia recomendada | Notas |
|---|---|---|---|
| `general.carreteras` | Lineal | `largestLength` | Una carretera larga aparece en su municipio principal |
| `general.curvas_de_nivel` | Lineal | `duplicate` | Visualmente importante que se vean en todos los municipios que cruzan |
| `general.cuerpos_de_agua_50k` | Poligonal | `largestArea` | Un río ancho se asigna al municipio donde tiene más área |
| `agave_en_area_de_proteccion_*` | Poligonal | `largestArea` | Mismo |

### Fase 5 — Frontend simplificado (semana 2)

**4.1** `useMunicipioMode.js`:
- Elimina `buildIntersectsCql` y `globalIntersectsCql`
- Expone `selectedClaves: string[]` (las claves de los municipios seleccionados)

**4.2** `useWMSLayerManager.js` y `useWMSFilterUpdater.js`:
- Elimina parámetro `globalCqlFilter`
- Por cada `subLayer`, si `wmsConfig.searchMeta?.hasMunicipio && wmsConfig.searchMeta?.municipioField`:
  - Agrega `(${municipioField} IN ('14039','14120',...))` al CQL combinado

**4.3** `useMunicipioMask.js`:
- Sin cambios. Sigue mostrando la máscara visual para reforzar el foco

**4.4** Backend `/municipios/geometries`:
- Elimina `unionWkt`, `unionSrid`, `unionToleranceMeters`, `unionIsEnvelope`
- Mantiene `features` (necesario para la máscara) y agrega `bboxExtent` (4 números, útil para fit del view)

### Fase 6 — Reversión de parches (semana 3)

- Revertir `controlflow.properties.template` a valores razonables (ej. `user=10, ows.wms.getmap=20`)
- Limpiar bisección adaptativa en `municipios_repository.py:get_union_wkt` (función obsoleta)
- Actualizar `docs/municipio-mode.md` con la nueva arquitectura

## Decisiones de diseño pendientes

**D1 — ¿Trigger PostgreSQL o job recurrente para mantener `clave_municipio`?**

Opciones:
- **Trigger en INSERT/UPDATE**: feature recién insertada queda calculada al toque. Más mágico, costo en escritura.
- **Job nocturno**: recalcula todo cada noche. Latencia hasta 24h para nuevos features, pero predecible.
- **Híbrido**: trigger para INSERT, job nocturno como respaldo.

Recomendación: empezar con job nocturno (consistente con el patrón `run_refresh_*.py` ya existente). Migrar a trigger si se vuelve insuficiente.

**D2 — ¿Centroide o `containing` por default para puntos?**

`containing` es estricto: si el punto cae exactamente en el borde de un municipio (raro pero posible), queda NULL. `centroid` aplica `ST_Within(ST_Centroid(geom), mun.geom)` que para puntos es trivialmente equivalente y siempre asigna un municipio.

Recomendación: `centroid` como default (más robusto para puntos casi-en-borde).

**D3 — ¿Cómo se manejan features que no caen en ningún municipio de Jalisco?**

Ej. una unidad de salud en Nayarit que un ETL importó por error, o un punto fuera del estado.

Opciones:
- Dejar `clave_municipio = NULL` y excluir del modo municipio
- Marcar con `clave_municipio = '00000'` y mostrar siempre

Recomendación: `NULL` + excluir. La query `clave_municipio IN (...)` naturalmente los excluye, lo cual es deseable.

**D4 — ¿Aplicar también a `geom_inegi`?**

`mapalab.municipios` tiene dos geometrías por municipio (`geom_iieg` y `geom_inegi`). El campo `sourceId` en `useMunicipioMode` ya escoge una u otra.

Para la columna `clave_municipio` en cada tabla, la asignación se hace contra una u otra (no ambas). Decidir cuál es la fuente de verdad para asignación.

Recomendación: IIEG (es la fuente oficial del instituto). Si en algún momento se necesita asignación contra INEGI también, agregar columna paralela `clave_municipio_inegi`.

## Alternativas descartadas

**A) SQL Views parametrizadas en GeoServer** (`viewparams=municipio:14039`)
- Funciona pero requiere configurar cada capa manualmente en la UI de GeoServer.
- Cada query ejecuta el JOIN en runtime sin beneficio de índice persistido.
- No escala a 50+ capas.

**B) Particionamiento PostgreSQL por municipio**
- 125 particiones por tabla = pesadilla administrativa.
- Beneficio marginal sobre un índice B-tree en una columna.
- Las queries que no filtran por municipio (mayoría) no se benefician y pagan complejidad.

**C) GeoWebCache pre-cacheado por municipio**
- Combinación explosiva: 125 mun × ~10 zoom × ~50 capas = 62500 tiles a generar.
- Cualquier cambio en una capa invalida todo su set.
- No vale la complejidad para el beneficio.

**D) WFS por bbox + render client-side**
- Patrón válido para capas puntuales con pocos features.
- Inviable para raster, para capas lineales pesadas (`curvas_de_nivel`), y para capas con styling SLD complejo.
- Refactor de varios días para recrear styling client-side por cada capa migrada.
- Puede ser una mejora futura específica para 3-5 capas donde la interactividad lo justifique, pero no para el problema de filtro espacial.

**E) BBOX rectangular en CQL_FILTER (solución temporal aplicada)**
- Mucho mejor que `INTERSECTS(WKT)`: URL chica, índice GIST instantáneo en PostGIS.
- Pero la URL sigue cambiando por municipio → cache miss garantizado, no compartido entre usuarios.
- Aceptable como puente mientras se implementa este plan, no como destino final.

## Riesgos

- **R1**: Backfill de tablas grandes puede tomar horas. Mitigación: correr en horarios de baja carga, batched.
- **R2**: Asignación incorrecta en features que cruzan municipios. Mitigación: dejar la estrategia por capa configurable, validar contra una muestra antes de aplicar masivamente.
- **R3**: Sincronización entre `mapalab.layers.has_municipio` y la columna real existente en la tabla. Mitigación: el job de backfill verifica y reporta inconsistencias.
- **R4**: GeoServer no expone los workspaces de PostGIS al mismo schema. Mitigación: las capas WMS apuntan a tablas en `mapa_base`, `salud`, etc. La columna se agrega en la tabla real, no en una vista.

## Métricas de éxito

- URLs de WMS con filtro municipal: <500 bytes por capa (vs 6-9KB actual)
- Cache hit ratio en nginx para `/geoserver/*/wms` al activar modo municipio: >70% en sesiones recurrentes (vs 0% actual)
- Tiempo desde activar municipio hasta render completo: <1s con 6 capas activas (vs 3-5s actual)
- Cero 429 con Control-flow en valores razonables (`user=10` o menos)

## Timing estimado

- Fase 1 (infraestructura base): 1-2 días
- Fase 2 (capas puntuales, ~20 tablas): 2-3 días + tiempo de backfill (background)
- Fase 3 (capas lineales/poligonales, ~5 tablas): 1-2 días + decisiones de asignación
- Fase 4 (frontend simplificado): 1 día
- Fase 5 (limpieza y reversión de parches): 0.5 día

**Total: ~1 semana de trabajo activo + ventana de backfills**
