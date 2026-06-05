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

Estos valores se guardan en el feature y se serializan en shares. También disponibles vía MCP en el campo `annotations[]`.

## Eventos

El botón flotante de eventos en modo zen se oculta cuando hay herramientas activas (mobile) y se reposiciona dinámicamente con el sider (desktop).

## Historial de cambios

- **1.70.0**: Separación de Mediciones/Anotaciones, colapso manual, pill de acciones mobile, color/fondo/tamaño en texto.
