# Plan — Refactor de ActiveLayerItem a 4 filas verticales

Plan completo para reorganizar la fila de cada capa en el panel de capas activas. La idea es pasar de un layout horizontal con desglose hacia la derecha en hover, a un layout vertical de 4 filas que se desglosa hacia abajo en hover/seleccion. Esto desbloquea el siguiente paso de mover la leyenda inline y eliminar el `SymbologyPanel` separado.

Cuando el usuario invoque "lee el plan de active layer item" significa retomar este documento.

## Estado actual

- Componente: `frontend/src/pages/maps/components/ActiveLayers/ActiveLayerItem.jsx`
- Sub-componentes ya extraidos: `SlotBadge`, `LayerDateControls`
- Item se despliega horizontal a la derecha al hacer hover (botones de visibilidad, info, eliminar aparecen).
- Pill de fecha + loop (play/intervalo/direccion) ya soporta swipe con `compareMode/slotMembership` via `LayerDateControls`.
- Loop hoy se pinta del color del slot activo cuando swipe esta activo.

## Layout objetivo (4 filas verticales)

```
┌──────────────────────────────────────────────────────────┐
│ [≡]  Titulo de la capa                                   │ Fila 1 — siempre
├──────────────────────────────────────────────────────────┤
│ [Pill A] [▶][⏱][↔]  [Badge]  [↔][⏱][▶] [Pill B]        │ Fila 2 — solo si capa con periodicidad
├──────────────────────────────────────────────────────────┤
│ [simb] [info] [vis] [opa] [drag] ...     [eliminar]      │ Fila 3 — barra de acciones
├──────────────────────────────────────────────────────────┤
│ [imagen leyenda WMS]                                     │ Fila 4 — solo si capa tiene leyenda y toggle global activo
└──────────────────────────────────────────────────────────┘
```

### Reglas globales

- **Items colapsados** (no activos, no en hover) muestran solo Fila 1.
- **Item activo** (`selectedLayerForSymbology.id === layer.id`) queda permanentemente expandido con todas sus filas aplicables.
- **Hover desktop** sobre un item lo expande temporalmente. Al salir el cursor, vuelve a colapsarse — salvo que sea el activo.
- **Mobile**: solo el activo expande. Sin hover.
- **Transicion**: `transition: max-height 200ms ease-out` para que crezca/colapse suave. Considerar **debounce de 100-200ms** en el hover para evitar saltos al pasar rapido el cursor.
- **Click outside**: deselecciona al hacer click fuera; el item activo previo se mantiene expandido o vuelve a colapsado (decidir en implementacion). Recomendado: mantener el activo expandido aunque el cursor salga.

## Fila 1 — Titulo

```
[≡] Titulo de la capa
```

- **Drag handle (`≡`)**:
    - Mismo icono que se usa hoy (`name="move"` de `@assets/icons`), mismo color, mismo tamaño.
    - **Solo visible en el item activo**, no en todos. Cero ruido visual cuando hay muchas capas.
    - `cursor-grab` por default, `cursor-grabbing` durante drag.
    - Mantener `e.stopPropagation()` en el click del handle para no disparar `setSelectedLayerForSymbology`.
- **Titulo**: el nombre de la capa, truncado con tooltip cuando excede el ancho.
- **No** llevar badge A/B/AB en esta fila — el badge vive en Fila 2 como parte del componente swipe.

## Fila 2 — Periodicidad / Swipe

Solo se renderiza si la capa tiene periodicidad activa (filtro de fecha aplicado). Si la capa no tiene fecha, esta fila desaparece.

### Sistema de tamaños

Todos los botones siguen el sistema unificado para alinear visualmente las columnas entre items:

| Elemento | Ancho |
|---|---|
| Boton de accion (Fila 3) | **20 px** (`size-5`) |
| Boton de loop (play, intervalo, direccion) | **20 px** (igualado a acciones) |
| Pill de periodicidad (fecha) | **44 px** (= 2 botones + gap) |
| Badge AB | **44 px** (mismo que pill, alineacion matematica) |
| Badge A solo o B solo | **20 px** (mismo que un boton de accion) |
| Gap entre elementos | **4 px** (`gap-1`) |

Pills con contenido largo (multi-month como `ene-feb-mar`):

- Recomendado: `min-w-[44px]` y se expande al contenido. Pierde alineacion vertical solo en el item con multi.
- Alternativa: `w-[44px]` fijo + truncate + tooltip con la fecha completa.
- Decidir en implementacion segun feedback visual real.

### Modo no-swipe (status quo)

```
[Pill : 44] [▶ : 20][⏱ : 20][↔ : 20]
```

Layout actual sin cambios funcionales. Solo igualar el tamaño de los botones de loop a 20 px.

### Modo swipe — capa AB

Layout simetrico hacia el centro, set de B en mirror (direccion → intervalo → play, izq→der):

```
[Pill A : 44] [▶ 20][⏱ 20][↔ 20]   [AB : 44]   [↔ 20][⏱ 20][▶ 20] [Pill B : 44]
```

- Pill A y loop A pintados en paleta morado `#5C2472`.
- Pill B y loop B pintados en paleta naranja `#FF8300`.
- Badge AB centrado, ancho 44 px (igual que las pills) — actua como pivote visual y como cicladbre de membresia (A → AB → B → A).
- Loop solo del slot activo (V1). Cuando se haga loop por slot independiente, ver `PLAN_LOOP_POR_SLOT_SWIPE.md`.

### Modo swipe — capa solo A

```
[Pill A : 44] [▶ 20][⏱ 20][↔ 20] [A : 20]                                    
```

- Solo bloque izquierdo + badge A chico (20 px) al lado.
- Espacio vacio a la derecha funciona como **affordance**: invita a clickear el badge para ciclar a AB y poblar B.

### Modo swipe — capa solo B

Mirror de solo A (alineado a la derecha):

```
                                    [B : 20] [↔ 20][⏱ 20][▶ 20] [Pill B : 44]
```

### Mobile en swipe

Layout simetrico en una sola fila no cabe (~375 px). Usar `flex-wrap`:

```
[Pill A] [▶][⏱][↔]
        [AB]
[↔][⏱][▶] [Pill B]
```

Tres "lineas" dentro de Fila 2 cuando AB en mobile. Cuando solo A o solo B, una sola linea con el bloque correspondiente.

## Fila 3 — Barra de acciones

Botones siempre del mismo tamaño (`size-5` = 20 px). Orden de izquierda a derecha:

1. **Simbologia** — abre/refresca la fila 4 (leyenda inline). Mismo icono que el `SymbologyPanel` colapsado usa hoy. Toggle local del despliegue de Fila 4 para esa capa.
2. **Informacion** — abre el `LayerDetailModal` con detalles completos. Equivale al boton "big_card" actual.
3. **Visible** — toggle de visibilidad de la capa (eye icon, ya existe).
4. **Opacidad** — boton nuevo (ver detalle abajo).
5. **Drag** — el `≡` se mueve a Fila 1. NO va aqui.
6. **Eliminar** — al final derecho, separado del grupo con `border-l border-gray-200` o `mx-2` para evitar clicks accidentales.

### Boton de Opacidad (nuevo)

Comportamiento:

- **Por default** (opacidad = 100 %): muestra solo el icono de opacidad. Estilo y tamaño igual que los demas botones de la fila (`size-5`, paleta consistente con simbologia/informacion).
- **Cuando opacidad ≠ 100 %**: el icono se reemplaza por el numero con simbolo de porcentaje. Ej: `75%`, `40%`. Mismo tamaño (20 px), texto `text-[9px] font-garet font-bold`.
- **Click**: abre un popover/dropdown con la barra de opacidad que ya existe en `LayerDetailModal/components/OpacityControl.jsx`. Reutilizar ese componente.
- **Posicion del popover**: anclado al boton, con `Tooltip` o un `Popover` flotante (similar al `ConfirmDropdown` que ya se usa).
- **SVG nuevo**: pedir o crear un icono de "opacidad" (estilo cuadrado mitad transparente / gradiente / circulo difuminado) que conserve la linea visual del set existente (`@assets/icons/`). Tamaño base 20 px (size-5) para alinear con simbologia, info, visible, eliminar.

### Acciones que pierden sentido aqui

- El antiguo "drag handle" en la fila de acciones (icono move) ya no va — ahora vive en Fila 1 solo en activo.

## Fila 4 — Leyenda inline (img de WMS)

Solo se renderiza si:

- La capa tiene leyenda WMS disponible (`getLegendUrl(layer)` de `useWMSLegend`).
- El item esta expandido (activo o hover).
- El **toggle global** "Mostrar leyendas" esta activado (ver Header del panel abajo).

### Comportamiento

- Carga lazy: solo se hace `GetLegendGraphic` cuando el item se expande por primera vez. Los items colapsados no piden la imagen.
- Cache HTTP del browser y nginx ya cubren la repeticion. Confirmar headers en GeoServer/Nginx.
- Capas sin leyenda WMS (vector simple sin SLD): la fila 4 simplemente no se renderiza para esa capa.
- Cuando la capa esta en swipe AB con filtros distintos por slot que generen leyendas distintas (`STYLES` con `timeStylePattern`), renderizar **dos imgs lado a lado**: leyenda A y leyenda B. Cada una con su request propio.

### Toggle global "Mostrar/ocultar leyendas"

- Ubicacion: header del panel de capas activas, junto al boton "Pausar todas las animaciones" que ya existe.
- Estado en `localStorage` (`mapalab.activeLayers.legendsVisible = 'true'|'false'`) para que persista preferencia del usuario.
- Default: `true` (leyendas visibles).
- Solo aparece el toggle si **al menos una capa activa tiene leyenda WMS** disponible.

## Implicacion: eliminar SymbologyPanel

Una vez que la leyenda vive inline en cada item, el `SymbologyPanel` separado pierde razon de ser:

- Vive en `frontend/src/pages/maps/components/SymbologyPanel.jsx`.
- Lo monta `MapSider.jsx`.
- Hoy contiene tambien el chip A/B del swipe (que se agrego en commit `201f65d`). Ese chip debe **relocalizarse**: opciones (a) pasarlo al header del panel de capas activas, (b) eliminarlo y dejar que el slot activo solo se cambie desde el badge de cada capa o desde el flash + popover ya existentes.
- Recomendacion: **(b)** — el badge clickeable en cada item ya hace de `setActiveSlot` cuando ciclas a un slot que es solo del slot activo, ya hay popover al activar capa nueva, ya hay flash al cambiar. El chip dedicado del SymbologyPanel se vuelve redundante.

## Plan de commits sugerido

Ejecutar en orden, cada uno verificable en aislamiento:

1. **`refactor(maps): vertical layout for active layer item, drag handle in title row`**
    - Reorganizar `ActiveLayerItem` a Filas 1, 2, 3 (sin Fila 4 todavia).
    - Drag handle en Fila 1, solo en item activo.
    - Botones de loop a `size-5` para igualar acciones.
    - Layout simetrico de Fila 2 en swipe (AB / solo A / solo B).
    - Mobile: wrap automatico en swipe AB.
    - Sub-componentes nuevos para no exceder 300 lineas:
        - `LayerItemHeader.jsx` (Fila 1 con drag + titulo)
        - `LayerActionsBar.jsx` (Fila 3)
        - `LayerDateControls.jsx` (Fila 2 — ya existe, ajustar layout)
2. **`feat(maps): opacity button with inline percentage display`**
    - Nuevo SVG de opacidad (pedir al diseñador o crear con estilo del set existente).
    - Boton en `LayerActionsBar`. Por default icono, cuando opacidad ≠ 100% muestra `XX%`.
    - Click abre popover con `OpacityControl` reusado.
3. **`feat(maps): inline WMS legend in active layer item`**
    - Fila 4 con `<img src={getLegendUrl(layer)} />` lazy.
    - Solo se renderiza si capa expandida + tiene leyenda + toggle global on.
    - En swipe AB, dos imgs (leyenda A y leyenda B).
4. **`feat(maps): global toggle to hide all legends in active layers panel`**
    - Boton en header junto a "Pausar animaciones".
    - Persiste preferencia en `localStorage`.
    - Solo aparece si al menos una capa activa tiene leyenda WMS.
5. **`refactor(maps): remove SymbologyPanel, relocate swipe chip`**
    - Eliminar `SymbologyPanel.jsx`.
    - Quitar import y montaje en `MapSider.jsx`.
    - Quitar el chip A/B del swipe (ya cubierto por el badge en cada capa + flash + popover).
    - Verificar que `selectedLayerForSymbology` sigue funcionando para `InfoBox` y `LayerDetailModal`.

## Riesgos y consideraciones

- **Layout shift al hover** — probar transiciones de `max-height` y debounce. Si se siente mal, aceptar que el hover NO expande (solo el activo expande) y se queda como decision UX.
- **`SortableItem` con drag handle separado** — `@dnd-kit/sortable` lo soporta nativo. Verificar que el handle en Fila 1 sigue arrastrando el item completo.
- **Performance con muchas capas** — solo el activo + hovered cargan leyenda. Sin problema.
- **`SymbologyPanel` eliminado afecta tests / shares?** — buscar referencias antes de eliminar. Hay un `useShareSerializer` que persiste `selected: selectedSlug` — sigue funcionando, solo que esa info ya no se renderiza en un panel separado sino que el badge de "esta capa esta activa para leyenda" es la propia expansion del item.
- **Mobile**: probar con 10+ capas activas y la activa expandida — scroll dentro del panel puede saturar. Considerar `max-h-[60vh]` en el item activo en mobile como fallback.
- **Toggle global de leyendas** — recordar que es por dispositivo (localStorage), no se sincroniza entre sesiones de usuario distintas.

## Estimacion

- Reorden + drag a Fila 1 + tamaños unificados + Fila 2 simetrica: 1-2 commits
- Boton opacidad nuevo: 1 commit (mas el SVG)
- Leyenda inline: 1 commit
- Toggle global de leyendas: 1 commit
- Eliminar SymbologyPanel: 1-2 commits

Total ~5-7 commits. Una jornada o jornada y media de trabajo si no hay sorpresas con el SVG y la integracion del `OpacityControl` reusado.

## Decisiones tomadas (resumen rapido)

- Drag handle: mismo icono actual, mismo color, **solo en el item activo**, en Fila 1 a la izquierda del titulo.
- Estilos: **no se cambian estilos**, solo se reordena. Botones de loop pasan a 20 px (size-5) para igualar acciones — eso si es cambio de tamaño pero no de paleta.
- Hover/select: solo capa activa o hovered expande filas 2-4. Las demas quedan colapsadas a Fila 1.
- Badge centro siempre visible en swipe (A, B o AB). 44 px cuando AB, 20 px cuando solo A o solo B.
- Pill de periodicidad: ancho minimo 44 px para alinear con badge AB, expandible para fechas multi.
- Opacidad: boton nuevo con SVG propio, muestra icono o `XX%` segun valor, click abre popover con `OpacityControl` reusado.
- Leyenda: inline en Fila 4, lazy, controlada por toggle global persistido en localStorage.
- `SymbologyPanel` separado: se elimina al final del refactor.
