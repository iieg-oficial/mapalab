# Panel de herramientas (Mediciones y Anotaciones)

El panel flotante de herramientas del visor se separó en dos grupos independientes controlados desde el menú lateral **Herramientas**.

## Grupos

| Grupo | Tools | Ícono en menú | Control |
|---|---|---|---|
| **Mediciones** | Punto, Línea, Polígono | `medicion` | Toggle en Herramientas |
| **Anotaciones** | Texto, Emoji, Trazo libre | `emoji` | Toggle en Herramientas |

Ambos grupos pueden activarse por separado o simultáneamente.

## Layout

- **Desktop**: una columna vertical. Ambos grupos abiertos: se apilan.
- **Mobile**: ambos grupos abiertos: 2 columnas side-by-side. Solo uno: 1 columna.
- **Colapso manual**: botón de flecha (◀/▶) al lado del botón de lista. Colapsa/expande todas las herramientas preservando la herramienta activa visible.

## Botones del panel flotante

```
┌──┐ ┌──┐ ┌──────────┐
│📋│ │◀│ │ ↶  ✓  ✕  │  ← mobile: acciones solo al dibujar
└──┘ └──┘ └──────────┘
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
| ◀/▶ Flecha | Colapsar/expandir panel de herramientas |
| ↶ ✓ ✕ (mobile) | Deshacer / Terminar / Cancelar trazo |
| X | Cerrar mediciones y anotaciones (confirma) |

## Acciones al dibujar

- **Desktop**: barra de acciones (↶✓✕) aparece a la derecha del botón de la herramienta activa.
- **Mobile**: barra de acciones en pill flotante en la misma fila que lista y colapso. Solo visible mientras se dibuja.

## Anotaciones: color, fondo y tamaño

El panel de **Texto** incluye controles para personalizar la apariencia:

| Control | Propiedad | Default |
|---|---|---|
| Color | `fillColor` | `#111827` |
| Fondo | `backgroundFill` | ninguno |
| Tamaño | `size` (escala) | `1` |

Estos valores se guardan en el feature y se serializan tanto en shares como en la persistencia local (`fillColor`, `bgColor`, `size`). También disponibles vía MCP en el campo `annotations[]`.

## Persistencia

Mediciones y anotaciones se guardan en `localStorage` bajo la clave `mapalab.annotations` y se restauran al cargar el visor, por lo que sobreviven a un refresh de la página. El serializador es compartido (`helpers/annotationsSerialization.js`) entre los shares y la persistencia local.

- Se escribe en cada cambio de `measurements`; al quedar vacío (o al cerrar con la X) se limpia el almacenamiento.
- La hidratación inicial no muestra el palette de herramientas, solo el botón de lista + X (`restoreAnnotations(..., { showTools: false })`).
- Si la URL trae un share activo (`?s=`), el enlace tiene prioridad y se omite la hidratación local para no duplicar.
- Las geometrías se guardan en EPSG:4326; el texto se restaura con `createTextStyle` y los emojis con `createSymbolStyle`, cacheados en `cachedStyle` para que sigan siendo editables (rotar/escalar).

## Eventos

El botón flotante de eventos en modo zen se oculta cuando hay herramientas activas (mobile) y se reposiciona dinámicamente con el sider (desktop).

## Historial de cambios

- **1.72.0**: Persistencia local (`localStorage`) de mediciones/anotaciones que sobrevive al refresh; estilo completo (color/fondo/tamaño/símbolo) serializado en shares y persistencia; texto restaurado se renderiza como texto y vuelve a ser editable; colores de dibujo y fuente alineados a la marca (Garet); SVG del catálogo saneado vía data-URL; helper `genId` con fallback.
- **1.70.0**: Separación de Mediciones/Anotaciones, colapso manual, pill de acciones mobile, color/fondo/tamaño en texto.
