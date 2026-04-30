# Plan — Loop temporal independiente por slot en Swipe (opcion C)

Plan para escalar el comparador swipe de la opcion B (periodicidad por slot, loop solo del slot activo) a la opcion C (loop independiente por slot, opcionalmente sincronizado).

Cuando el usuario invoque "lee el plan de loop por slot" significa retomar este documento para implementar lo que falta.

## Estado actual (opcion B implementada)

- `compareMode` vive en `useSwipeMode` (`frontend/src/pages/maps/hooks/useSwipeMode.js`).
- Modelo: `paneA`, `paneB` cada uno snapshot completo `{ activeLayerIds, hiddenLayerIds, layerOpacities, filters, label }`.
- Helpers cross-slot ya disponibles para fecha:
    - `getFilterFromSlot(layerId, slot, filterName)`
    - `applyFilterToSlot(layerId, slot, filterName, cql)`
    - `clearFilterFromSlot(layerId, slot, filterName)`
- `LayerDetailModal` muestra 1 o 2 bloques de periodicidad segun `slotMembership` de la capa: AB → 2 selectores etiquetados Lado A / Lado B; A o B → 1 selector solo del slot.
- `SimpleDateSelector` y `DateTreeSelector` aceptan overrides por prop (`getFilter`, `applyFilter`, `clearFilter`) para trabajar contra el snapshot del slot en vez del live.
- **Loop**: sigue siendo unico, opera sobre el live state (slot activo). El play/pause/intervalo/direccion en el modal solo aparece en el bloque del slot activo. Para correr loop en el otro slot, el usuario cambia activeSlot con el chip del SymbologyPanel y luego le da play.

## Que falta para opcion C (loop independiente por slot)

### Reto principal

`useDateLoop` (`frontend/src/pages/maps/hooks/useDateLoop.js`) hoy:

- `dateLoops[layerId] = { isPlaying, currentKey, mode, year }` — un loop por capa
- `loopPrefs[layerId] = { intervalMs, direction }` — un set de prefs por capa
- `timersRef.current = Map<layerId, timeoutId>` — un timer por capa
- Cada tick aplica `applyFilter(layerId, 'date', value)` al live state (no a un slot)

Para C, cada estructura pasa a estar indexada tambien por slot:

- `dateLoops[layerId][slot] = { ... }` (o equivalente)
- `loopPrefs[layerId][slot]`
- `timersRef.current = Map<\`${layerId}|${slot}\`, timeoutId>`
- Cada tick aplica al snapshot del slot via `applyFilterToSlot(layerId, slot, 'date', value)`
- Fuera del swipe sigue funcionando como hoy (un solo slot virtual / modo normal)

### Cambios concretos

1. **`useDateLoop.js` — refactor del estado**
   - Cambiar firma de `startLoop`, `stopLoop`, `toggleLoop`, `getLoopState`, `getLoopPrefs`, `setLoopIntervalMs`, `setLoopDirection`, `cleanupLoop`, `pauseAllLoops` para aceptar `(layerId, slot)`.
   - Hot path `runNextTick`: usa `applyFilterToSlot` (nuevo arg al hook) cuando el loop pertenece a un slot del swipe; usa `applyFilter` (live) cuando es modo normal.
   - `slot` puede ser `null` para modo normal, `'A' | 'B'` para swipe.
   - El effect que limpia loops cuando `activeLayerIds` cambia debe considerar tanto live como ambos panes.

2. **`useDateLoop` recibe nuevos args**
   - `applyFilterToSlot`, `clearFilterFromSlot`, `getFilterFromSlot`, `getPaneActiveLayerIds(slot)` — todos via props del hook.
   - Estos vienen de `useSwipeMode` y se pasan desde `MapsProvider`.

3. **`LayerDetailModal.jsx` — duplicar controles del loop**
   - Cuando capa esta en AB y swipe activo, cada bloque (A y B) tiene su propio `PlayPauseButton`, `LoopIntervalButton`, `LoopDirectionButton`.
   - Cada control llama `toggleLoop(layerId, slot)`, `setLoopIntervalMs(layerId, slot, ms)`, etc.
   - Cuando capa esta en solo A o solo B, los controles del loop apuntan al slot que toca.
   - Cuando swipe inactivo, sigue como hoy (sin slot).

4. **`ActiveLayerItem.jsx` — indicador de loop activo**
   - El badge "X capas en loop" arriba de la lista activa debe contar loops de ambos slots cuando swipe esta activo.
   - El indicador de loop por capa (icono play parpadeante en el item) debe mostrarse si cualquier slot tiene loop activo para esa capa.

5. **`useSwipeMode.enterSwipeMode`**
   - Hoy llama `pauseAllLoops()` que para los loops del live (que ya quedan vacios al entrar). Para C, sigue siendo `pauseAllLoops()` pero ahora afecta tambien a loops por slot.

6. **`useSessionPersistence` y serializer/deserializer**
   - Los loops por slot deberian sobrevivir un refresh? Probablemente si para fecha (ya esta en `filters[layerId].date` del pane), pero el estado de "esta corriendo" no se persiste. Decidir si se pausan al recargar (recomendado) o se reanudan automaticos.

### Sub-plan opcional: sincronizacion entre A y B

Sin sincronizacion, los dos loops avanzan en sus propios timers — desfase visual rapido si tienen el mismo intervalo. Es confuso para analisis comparativo del mismo periodo.

Toggle "Sincronizar A y B" en el header del comparador:

- Cuando activo, ambos loops comparten un solo timer maestro y avanzan juntos.
- Si los rangos son distintos (A: 12 meses 2010, B: 12 meses 2024), el tick avanza el indice relativo en ambos: A pasa a feb 2010, B pasa a feb 2024.
- Si los rangos tienen distinto largo, el mas corto se reinicia al terminar mientras el largo continua, o se pausa el largo cuando el corto termina (decision de UX).
- Modo de sincronizacion: `mode === 'month'` en ambos para que avance mes-a-mes; si uno esta en `year` y otro en `month`, no se puede sincronizar limpio (deshabilitar el toggle en ese caso).

Implementacion:

- Estado nuevo en `compareMode.swipeLoopSync = false | true`.
- Helper `toggleSwipeLoopSync()` en `useSwipeMode`.
- En `useDateLoop`, cuando `swipeLoopSync` esta activo y la capa tiene loops en ambos slots, usar un solo timer maestro que dispare los dos `applyFilterToSlot` en el mismo tick.
- UI: checkbox "Sincronizar" arriba de los controles de loop, visible solo en AB con loops activos en ambos.

### Riesgos y notas

- Doblar la cantidad de timers concurrentes — si el usuario tiene 5 capas con loops en ambos slots, son 10 timers. Performance debe medirse.
- `useDateLoop` tiene un effect que pausa loops de capas hidden (linea ~274 del archivo). Adaptar para considerar `hiddenLayerIds` por slot.
- El modal de detalle puede verse cargado con doble set de controles. Mantener compactos. Considerar un modo "controles compartidos" (un set, dos play/pause separados solo si ambos slots tienen la capa).
- Tests: `useDateLoop` no tiene tests directos hoy; agregar para los flujos por slot.
- Telemetria: `trackRasterLoop(layerId, isPlaying)` deberia incluir slot.

## Archivos clave a tocar (resumen)

| Archivo | Cambio |
|---|---|
| `frontend/src/pages/maps/hooks/useDateLoop.js` | Refactor a indexar por (layerId, slot). Soporta loops por slot del swipe + modo normal |
| `frontend/src/pages/maps/hooks/useSwipeMode.js` | Pasar `applyFilterToSlot` etc. a useDateLoop. Nuevo `swipeLoopSync` y `toggleSwipeLoopSync` |
| `frontend/src/providers/MapsProvider.jsx` | Conectar useDateLoop con los helpers cross-slot |
| `frontend/src/pages/maps/components/LayerDetailModal/LayerDetailModal.jsx` | Duplicar controles play/interval/direction por slot cuando AB |
| `frontend/src/pages/maps/components/LayerDetailModal/components/SimpleDateSelectorParts.jsx` | PlayPauseButton, LoopIntervalButton, LoopDirectionButton aceptan callbacks pre-bound al slot |
| `frontend/src/pages/maps/components/ActiveLayers/ActiveLayerItem.jsx` | Detectar loop activo en cualquier slot para mostrar el indicador animado |
| `frontend/src/pages/maps/components/ActiveLayers/ActiveLayersList.jsx` | Contador "loops activos" suma ambos slots |
| `docs/swipe.md` | Actualizar seccion V2.1 — Loop temporal en swipe → marcarla como hecha |

## Estimacion

- Refactor de useDateLoop: 1 commit grande
- Adaptar UI de LayerDetailModal y partes: 1 commit
- ActiveLayers indicators: 1 commit chico
- Sincronizacion (sub-plan): 1 commit opcional
- Tests: 1 commit
- Total: 4-5 commits, ~1 jornada de trabajo si no hay sorpresas
