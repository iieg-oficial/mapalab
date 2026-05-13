# Plan — Jerarquía visual del panel de capas activas

Plan de mejoras de UX para resolver dos problemas relacionados:

1. **Problema principal (foco):** al activar una capa de polígonos, el relleno tapa todas las capas que están debajo y el usuario pierde contexto.
2. **Problema general:** con varias capas activas es difícil entender qué se está viendo en el mapa (jerarquía visual débil entre panel y render).

Cuando el usuario invoque "lee el plan de jerarquía visual" significa retomar este documento.

## Estado actual

- Las capas se activan desde `ThemeMenu` y suben al tope del panel; el item recién activado queda seleccionado (expandido).
- El orden vertical del panel = z-order del mapa (`useWMSLayerManager.js:114-122`): primero arriba en panel = al frente en mapa.
- Las WMS se piden con `STYLES`, `CQL_FILTER`/`TIME` y opacidad por capa (`useLayerOpacity` + `setOpacity` en `useWMSLayerManager.js:271-283`).
- Hoy todas las capas (polígonos, líneas, puntos, raster) se activan al 100% de opacidad y con el estilo de relleno por defecto del workspace.
- `wmsConfig` en `helpers/wmsConfig.js` no tiene campo `geometryType`; la información de geometría no fluye al frontend.

---

## Sección 1 — Polígonos opacos al activarse (foco)

### Plan A · Activar en modo "solo contorno" (outline-only) — recomendada

Cuando se activa una capa de polígonos se pide a GeoServer un SLD alternativo que solo dibuja bordes con el color de su simbología, sin relleno. En el item del panel aparece un toggle "Contorno / Relleno" para que el usuario rellene cuando lo necesita.

**Archivos afectados (frontend)**
- `frontend/src/pages/maps/helpers/wmsConfig.js` — añadir `geometryType` al `wmsConfig` y, opcionalmente, `outlineStyle` con el nombre del SLD alterno.
- `frontend/src/pages/maps/hooks/useWMSLayerFactory.js` — al construir la fuente WMS, si `geometryType === 'polygon'` y la capa está en modo contorno, usar `STYLES = outlineStyle`.
- `frontend/src/pages/maps/hooks/useWMSLayerManager.js` — propagar el modo (contorno/relleno) al refresh; recordar limpiar `STYLES` al alternar.
- `frontend/src/pages/maps/hooks/useActiveLayersLogic.js` — extender el estado por capa con `displayMode: 'outline' | 'fill'`. Persistir en URL (alineado con el patrón `filter_<id>`).
- `frontend/src/pages/maps/components/ActiveLayers/LayerActionsBar.jsx` — añadir botón toggle (icono "borde" / "relleno") solo visible para polígonos.
- `frontend/src/pages/maps/components/ActiveLayers/LayerItemHeader.jsx` (o `ActiveLayerItem.jsx`) — pequeño chip "Contorno" cuando el modo está activo, para que no parezca que la capa "no carga".

**Cambios en GeoServer**
- Crear un SLD reutilizable `outline_only_generic.sld` que use el color de la simbología original. Asociarlo como estilo alterno en cada capa de polígonos del workspace `general`/`recursos`. Si no es viable un SLD genérico, generar uno por capa (script).

**Costo:** medio (GeoServer) + bajo (frontend).
**Pros:** mantiene "lo nuevo arriba"; no muta colores; deja control explícito al usuario; visualmente sólido.
**Contras:** requiere preparar SLDs en GeoServer; coordinación con el área de datos.
**Riesgos:** capas con simbología categórica (varios colores por feature) — el outline genérico no puede usar el color por categoría sin un SLD parametrizado por capa.

---

### Plan B · `mix-blend-mode: multiply` sobre la capa de polígonos

Aplicar al canvas/contenedor de la capa de polígonos un blend mode CSS para que el relleno se mezcle con lo de abajo en lugar de taparlo.

**Archivos afectados**
- `frontend/src/pages/maps/hooks/useWMSLayerFactory.js` — al crear la `ImageLayer`/`TileLayer`, registrar `prerender`/`postrender` que ajusten `ctx.globalCompositeOperation = 'multiply'` cuando `geometryType === 'polygon'` y el modo "blend" esté activo.
- Alternativa: aplicar `mix-blend-mode: multiply` en el `<div>` contenedor de la capa via `layer.set('className', 'blend-multiply')` y CSS dedicado (OpenLayers expone `className` en `BaseLayer`).
- `frontend/src/pages/maps/components/ActiveLayers/LayerActionsBar.jsx` — toggle "Mezclar / Pleno".
- `frontend/src/styles/...` — clase `.blend-multiply { mix-blend-mode: multiply; }`.

**Cambios en GeoServer:** ninguno.

**Costo:** bajo (solo frontend).
**Pros:** cero dependencia de datos; visual elegante; reversible al instante.
**Contras:** los colores se oscurecen sobre fondos oscuros; categorías cercanas pueden confundirse; no funciona bien si la simbología depende de matiz puro.
**Riesgos:** rendimiento aceptable pero hay que probar con varias capas blend simultáneas; OpenLayers `className` no siempre se aplica en versiones antiguas — verificar versión.

---

### Plan C · Default de opacidad por tipo de geometría

En vez de "todas al 100%", definir defaults: polígono 65%, raster 80%, línea/punto 100%. La capa nace traslúcida y el slider de opacidad ya visible refleja el valor.

**Archivos afectados**
- `frontend/src/pages/maps/helpers/wmsConfig.js` — añadir `geometryType`.
- `frontend/src/pages/maps/hooks/useLayerOpacity.js` — al registrar una capa nueva, leer su `geometryType` y setear `defaultOpacity` correspondiente. Constante `OPACITY_DEFAULTS_BY_GEOMETRY` exportable.
- `frontend/src/pages/maps/hooks/useActiveLayersLogic.js` — al activar capa, llamar `setLayerOpacity(id, defaultFor(geometryType))`.
- `frontend/src/pages/maps/components/ActiveLayers/LayerOpacityPopover.jsx` — sin cambios; solo refleja el valor.

**Cambios en GeoServer:** ninguno.

**Costo:** muy bajo.
**Pros:** trivial; visible (slider muestra el valor); el usuario puede subir al 100% en un click.
**Contras:** es la idea que el usuario ya descartó pero más quirúrgica. Solo aplicar si A/B/D no convencen.
**Riesgos:** capas con simbología muy clara pueden quedar lavadas; ajustar el % por tipo después de uso real.

---

### Plan D · Sugerencia contextual al activar (banner inline)

Cuando se activa una capa de polígonos *y* hay >0 capas visibles debajo, aparece un mini-banner dentro del item recién activado con tres botones: **[Reducir opacidad]** **[Solo contorno]** **[Mantener]**. Persistente con "no volver a preguntar".

**Archivos afectados**
- `frontend/src/pages/maps/components/ActiveLayers/ActiveLayerItem.jsx` — slot nuevo encima de la fila 2 ("Banner activación") visible solo durante N segundos o hasta primer click.
- `frontend/src/pages/maps/hooks/useActiveLayersLogic.js` — detección al activar: si la capa nueva es polígono y hay otras visibles → emitir `pendingActivationHint`.
- `frontend/src/pages/maps/helpers/wmsConfig.js` — necesita `geometryType` (compartido con A/B/C).
- `frontend/src/components/Message.jsx` — reutilizar; ya soporta `closable` + `storageKey`.
- localStorage key: `mapalab.activeLayers.polygonHintDismissed`.

**Cambios en GeoServer:** ninguno (a menos que se elija "Solo contorno", que requiere Plan A).

**Costo:** bajo–medio.
**Pros:** nada implícito; educa al usuario; no cambia el default silenciosamente.
**Contras:** un click extra; si se muestra demasiado se vuelve ruido; depende de A o C para que las acciones funcionen.
**Riesgos:** decidir bien la condición "tapa otras capas" (¿basta con que existan otras visibles? ¿calcular bbox real?). Empezar con la versión simple.

---

### Plan E · Foco selectivo (relleno solo en feature señalada)

Capa se activa con outline-only (Plan A); al hover/click sobre un polígono concreto, ese se rellena con su color de categoría. El resto sigue en contorno.

**Archivos afectados**
- `frontend/src/pages/maps/hooks/useFeatureInfo.js` — extender para que el hover dispare un `getFeature` (WFS) además del `GetFeatureInfo` actual.
- Nuevo hook `useFeatureHighlight.js` — capa OpenLayers `VectorLayer` por encima de la WMS, dibuja la feature señalada con el style de su categoría.
- `frontend/src/pages/maps/components/MapView.jsx` — registrar el listener de pointermove/click solo si hay polígonos en modo outline.
- Necesita: WFS habilitado en GeoServer (verificar) + style local equivalente al SLD para esa feature.

**Cambios en GeoServer:** WFS habilitado; idealmente endpoint que devuelva el style/category junto con la geometría.

**Costo:** alto.
**Pros:** patrón QGIS-inspector; cero overlap; muy claro qué estás viendo.
**Contras:** requiere WFS + matchear estilos en cliente; complejo; depende de Plan A primero.
**Riesgos:** geometrías muy pesadas (estados, municipios) pueden lagear; necesita simplificación o WFS por bbox.

---

### Plan F · Render dividido (contorno arriba, relleno abajo) — opcional

Cada capa de polígonos = 2 requests WMS: relleno al fondo del bloque polígonos, contorno al tope del stack. El contorno siempre se ve, el relleno solo donde nada lo tape.

**Archivos afectados**
- `frontend/src/pages/maps/hooks/useWMSLayerManager.js` — duplicar la lógica de creación: por cada polígono activo crear dos `ImageLayer` con z-index distintos. Cuidar `mergedLayers` y la opacidad sincronizada.
- `frontend/src/pages/maps/hooks/useWMSLayerFactory.js` — soporte para crear "twin layers" con styles distintos.
- GeoServer: dos SLDs por capa (`fill_only`, `outline_only`).

**Costo:** alto.
**Pros:** identidad visual permanente del polígono.
**Contras:** dobla la carga de tiles; complejidad fuerte en el manager; difícil de debuggear.
**Riesgos:** consumir más cuota de GeoServer; posibles condiciones de carrera al sincronizar estilos/opacidad entre los dos requests.

---

## Sección 2 — Mejoras complementarias de jerarquía visual

Estas no resuelven el problema de polígonos pero atacan el problema general "no entiendo qué veo".

### Plan G · Swatch identificador por capa (siempre visible)

Pastilla 4–6px de ancho a la izquierda del título con el color de la simbología. Para WMS raster: thumbnail de la rampa. Para WMS vectorial: color principal del SLD.

**Archivos**
- `frontend/src/pages/maps/components/ActiveLayers/LayerItemHeader.jsx` — slot nuevo a la izquierda.
- `frontend/src/pages/maps/hooks/useSymbology.js` — exponer `primaryColor` o `swatchUrl` por capa.
- `frontend/src/pages/maps/hooks/useWMSLegend.js` — para raster, generar miniatura con `WIDTH=20&HEIGHT=20`.

**Costo:** bajo. **Impacto:** alto. Resuelve el huérfano visual panel↔mapa.

---

### Plan H · Hover panel → flash en mapa

Al hacer hover sobre un `ActiveLayerItem`, la capa correspondiente pulsa en el mapa (200ms `opacity` o `outline`). Mobile: dispararse al expandir.

**Archivos**
- `frontend/src/pages/maps/components/ActiveLayers/ActiveLayerItem.jsx` — `onMouseEnter`/`onMouseLeave` → callback al manager.
- `frontend/src/pages/maps/hooks/useWMSLayerManager.js` — exponer `pulseLayer(id)` reutilizando el patrón `setHighlightedSlots`.

**Costo:** bajo–medio. **Impacto:** alto en desktop.

---

### Plan I · Indicador "encima/debajo" en el item

Mini-icono o número (`#1` arriba, `#N` abajo) junto al drag handle, mostrando la posición z relativa.

**Archivos**
- `frontend/src/pages/maps/components/ActiveLayers/ActiveLayerItem.jsx` — pasar `index` y `total` al item; render nuevo span.

**Costo:** muy bajo. **Impacto:** medio (sobre todo en mobile).

---

### Plan J · Leyendas con header propio

Cada `LayerLegendInline` se prefija con "Leyenda · {nombre}" + el swatch del Plan G.

**Archivos**
- `frontend/src/pages/maps/components/ActiveLayers/LayerLegendInline.jsx` — agregar header.

**Costo:** muy bajo. **Impacto:** medio. Depende de G para máximo efecto.

---

### Plan K · "Solo esta capa" — modo foco

Botón en `LayerActionsBar` que oculta temporalmente las demás. Toggle.

**Archivos**
- `frontend/src/pages/maps/components/ActiveLayers/LayerActionsBar.jsx` — botón nuevo.
- `frontend/src/pages/maps/hooks/useActiveLayersLogic.js` — estado `soloLayerId`. Implementación: cuando hay solo, `hiddenLayerIds = todasMenosSolo`.

**Costo:** bajo. **Impacto:** alto (atajo crítico cuando el usuario se pierde).

---

### Plan L · Slider de opacidad inline

Cuando el item está expandido, el slider va dentro del item (no en popover). El popover solo se usa con item colapsado.

**Archivos**
- `frontend/src/pages/maps/components/ActiveLayers/LayerOpacityPopover.jsx` — extraer slider a sub-componente reutilizable.
- `frontend/src/pages/maps/components/ActiveLayers/ActiveLayerItem.jsx` — render del slider inline en fila de acciones expandida.

**Costo:** bajo. **Impacto:** alto en feedback en tiempo real.

---

### Plan M · Resumen visual en header del panel

Fila de chips (swatches en orden de z) en el header sticky de `ActiveLayersList`. Click en chip = `scrollIntoView` del item.

**Archivos**
- `frontend/src/pages/maps/components/ActiveLayers/ActiveLayersList.jsx` — sub-bar nueva en el header.

**Costo:** medio. **Impacto:** medio (mejor con muchas capas).

---

### Plan N · AB modo comparación con borde lateral

En lugar de pastilla "AB", el item se "parte": borde izquierdo morado (#5C2472) y borde derecho naranja (#FF8300) reflejando los lados del swipe. Aplica solo en `compareMode`.

**Archivos**
- `frontend/src/pages/maps/components/ActiveLayers/ActiveLayerItem.jsx` — clases condicionales.
- `frontend/src/pages/maps/components/ActiveLayers/SlotBadge.jsx` — repensar (¿se conserva o se elimina?).

**Costo:** bajo. **Impacto:** medio.

---

### Plan O · Tarjeta resumen compacta (estado intermedio)

Tres estados por item: colapsado / compacto / expandido completo. Compacto = swatch + nombre + DatePill + opacidad numérica + 3 acciones rápidas.

**Archivos**
- `frontend/src/pages/maps/components/ActiveLayers/ActiveLayerItem.jsx` — refactor de filas (alineado con `PLAN_REFACTOR_ACTIVE_LAYER_ITEM.md`, considerar fusionarlos).

**Costo:** alto. **Impacto:** alto cuando hay 8+ capas. **Coordinar con el plan existente de refactor.**

---

### Plan P · Reactivar `SymbologyPanel` separado

Mover las leyendas a un panel lateral independiente (hoy `SYMBOLOGY_PANEL_ENABLED = false` en `MapLayersPanels.jsx:8`), agrupadas y con swatch + nombre.

**Archivos**
- `frontend/src/pages/maps/components/MapLayersPanels.jsx` — flag a `true` y reposicionar.
- `frontend/src/pages/maps/components/SymbologyPanel.jsx` — revisar y modernizar.
- `frontend/src/pages/maps/components/ActiveLayers/LayerLegendInline.jsx` — quitar render inline o hacerlo opcional.

**Costo:** medio. **Impacto:** alto cuando hay muchas capas. **Decisión arquitectónica:** descarta el plan de "leyenda en fila 4" del refactor existente — elegir uno de los dos.

---

## Combinaciones recomendadas

### Iteración 1 — quick wins (1 sprint)
**G** (swatch) + **H** (hover-flash) + **K** (solo esta capa) + **A** (outline-only para polígonos).
Resuelve identidad visual + atajo de foco + el problema central de polígonos. Compatible con el refactor en curso.

### Iteración 2 — refinamiento (1 sprint)
**J** (leyendas con header) + **L** (slider inline) + **D** (banner contextual al activar polígono).

### Iteración 3 — opcional / decisión arquitectónica
Decidir **O** vs **P** vs ambos. Re-evaluar si **B** (blend mode) tiene sentido tras Plan A.

### Descartables a primera vista
**F** (render dividido), **E** (foco selectivo) — costo alto, esperar feedback de usuarios tras iteración 1.

## Decisiones abiertas

- ¿Modo "contorno" se persiste por capa (URL) o es global por sesión?
- ¿`geometryType` lo declara la definición de capa en frontend, lo provee el backend, o se infiere por workspace?
- ¿El swatch de raster se calcula client-side (parsear leyenda) o server-side (campo nuevo en metadata de capa)?
- Compatibilidad con `PLAN_REFACTOR_ACTIVE_LAYER_ITEM.md`: el plan O sugiere otra fila más; el plan P elimina la fila de leyenda. **Hay que reconciliar antes de implementar O o P.**
