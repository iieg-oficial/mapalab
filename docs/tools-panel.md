# Panel de herramientas (Mediciones y Anotaciones)

El panel flotante de herramientas del visor se separó en dos grupos independientes controlados desde el menú lateral **Herramientas**.

## Grupos

| Grupo | Tools | Ícono en menú | Control |
|---|---|---|---|
| **Mediciones** | Punto, Línea, Polígono | `medicion` | Toggle en Herramientas |
| **Anotaciones** | Texto, Emoji, Trazo libre | `emoji` | Toggle en Herramientas |

Ambos grupos pueden activarse por separado o simultáneamente.

## Layout

- **Desktop**: una columna vertical con todas las herramientas siempre visibles; la barra de acciones de la herramienta activa aparece a su derecha.
- **Mobile**: sin herramienta activa, ambos grupos abiertos = 2 columnas side-by-side, uno solo = 1 columna. Al **seleccionar** una herramienta el panel **colapsa automáticamente** a solo la herramienta activa + su barra de acciones; al terminar/colocar se **expande** mostrando todas de nuevo.

## Botones del panel flotante

```
┌──┐
│📋│
└──┘
───────────────────────
 Mediciones:
  📍  📏  ⬡
 Anotaciones:
  📝  😊  ✏️
───────────────────────
      ┌──┐
      │ X│  ← cierra ambos grupos
      └──┘
```

| Botón | Función |
|---|---|
| 📋 Lista | Historial de mediciones y anotaciones |
| X | Cerrar mediciones y anotaciones (confirma) |

## Acciones al dibujar

La barra de acciones de cada herramienta es **la misma en desktop y mobile**: ↶ ✓ ✕ (deshacer / terminar / cancelar) en línea/polígono, y color/grosor en trazo libre. Aparece a la derecha del botón de la herramienta activa.

- **Desktop**: el resto de herramientas permanece visible; la barra sale a la derecha de la activa.
- **Mobile**: al activar una herramienta se ocultan las demás (colapso automático) para dar espacio a la barra. Flujo **one-shot**: tras finalizar (Escape / doble click / Terminar / Cancelar) o colocar (emoji/texto/trazo), la herramienta se deselecciona y todas se expanden de nuevo. Ya no existe el pill provisional ni el botón manual de colapso ◀/▶.

## Anotaciones: color, fondo y tamaño

El panel de **Texto** incluye controles para personalizar la apariencia:

| Control | Propiedad | Default |
|---|---|---|
| Color | `fillColor` | `#111827` |
| Fondo | `backgroundFill` | ninguno |
| Tamaño | `size` (escala) | `1` |

Estos valores se guardan en el feature y se serializan tanto en shares como en la persistencia local (`fillColor`, `bgColor`, `size`). También disponibles vía MCP en el campo `annotations[]`.

## Persistencia

Mediciones y anotaciones se guardan en `localStorage` bajo la clave `mapalab.annotations` y se restauran al cargar el visor, por lo que sobreviven a un refresh de la página. El serializador es compartido (`helpers/annotationsSerialization.js`) entre los shares y la persistencia local. Las selecciones (`Select`) también se guardan: vuelven con su polígono y el conteo se vuelve a consultar. Si la página se abrió con un enlace compartido (`?s=`), no se escribe en `localStorage`, para no pisar las anotaciones propias con las del enlace.

- Se escribe en cada cambio de `measurements`; al quedar vacío (o al cerrar con la X) se limpia el almacenamiento.
- La hidratación inicial no muestra el palette de herramientas, solo el botón de lista + X (`restoreAnnotations(..., { showTools: false })`).
- Si la URL trae un share activo (`?s=`), el enlace tiene prioridad y se omite la hidratación local para no duplicar.
- Las geometrías se guardan en EPSG:4326; el texto se restaura con `createTextStyle` y los emojis con `createSymbolStyle`, cacheados en `cachedStyle` para que sigan siendo editables (rotar/escalar).

## Configuración de mediciones

El botón ⚙ (engrane) en el header de "Mis mediciones" abre un popover con:

| Control | Opciones | Default | Descripción |
|---|---|---|---|
| Longitud por segmento | toggle | off | Muestra la distancia de cada tramo entre vértices consecutivos |
| Distancia | Auto / m / km | Auto | Unidad para etiquetas de longitud |
| Área | Auto / m² / ha / km² | Auto | Unidad para etiquetas de área |

La preferencia de unidades se persiste en `localStorage` (`mapalab.measure.units`). Al cambiar cualquier opción se recalcula el estilo de todas las features existentes y las etiquetas en el panel de historial.

## Eventos

El botón flotante de eventos (mobile) se oculta siempre que el panel de herramientas esté presente, calculado en `MapSider` como `toolsPanelVisible = areMeasurementToolsVisible || areAnnotationToolsVisible || isDrawing || measurements.length > 0`. Esto incluye el caso de **trazos persistidos tras un refresh** (cuando solo se ven lista + X). En desktop se reposiciona dinámicamente con el sider.

## Historial de cambios

- **1.75.0**: La barra de acciones de desktop ahora también se usa en mobile; colapso automático del panel al seleccionar una herramienta (flujo one-shot: deselecciona y expande al terminar/colocar); se eliminan el botón manual ◀/▶ y el pill provisional; el ícono de eventos en mobile se oculta también con trazos persistidos tras refresh (`toolsPanelVisible`); fix de ancho de columna en compact para que la barra quede pegada al botón.
- **1.73.0**: Longitud por segmento (toggle en configuración); perímetro + área en etiquetas de polígonos; selector de unidades (m/km, m²/ha/km²) con persistencia en localStorage; refactor de `formatLength`/`formatArea` al helper `formatMeasure.js`.
- **1.72.0**: Persistencia local (`localStorage`) de mediciones/anotaciones que sobrevive al refresh; estilo completo (color/fondo/tamaño/símbolo) serializado en shares y persistencia; texto restaurado se renderiza como texto y vuelve a ser editable; colores de dibujo y fuente alineados a la marca (Garet); SVG del catálogo saneado vía data-URL; helper `genId` con fallback.
- **1.70.0**: Separación de Mediciones/Anotaciones, colapso manual, pill de acciones mobile, color/fondo/tamaño en texto.
