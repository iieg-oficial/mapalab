# Changelog — línea 2.x

Todos los cambios notables del proyecto se documentan en este archivo. La historia `0.x` y `1.x`
está en [`changelog/v1.md`](changelog/v1.md).

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Versionado Semantico](https://semver.org/lang/es/).

## [2.0.0] - 2026-09-29

Abre la línea 2.x con lo construido en el ciclo tamal-rojo: de `1.117.0` (2026-08-10) a `1.223.4`
(2026-09-29), sobre la base de tamal-verde `1.116.x`. No cambia código respecto a `1.223.4`; el
detalle de cada versión está en [`changelog/v1.md`](changelog/v1.md).

### Agregado

- **Vista 3D**: terreno con las capas WMS encima, capas de puntos de pie y como billboards,
  coropléticos levantados, sol, cielo, niebla y órbita en un panel de ajustes. También dentro del
  comparador y en el catálogo, y viaja en los enlaces compartidos.
- **Modo dron, lluvia e inundación** (BETA) en la vista 3D: ocho aeronaves con instrumentos,
  minimapa con rutas y descarga del recorrido; lluvia en partículas e inundación por elevación.
- **Tabla de datos**: tabla de atributos acoplable a los bordes, columnas configurables, filtros,
  selección múltiple y descarga de lo que muestra. También en el catálogo.
- **Panel de estadísticas**: numeralia por municipio y rango de fechas, comparador de municipios con
  gráfica, ranking estatal y estadísticas armadas en el visor.
- **Hexágonos H3** para capas de puntos, con conteos precalculados y paleta propia.
- **Selección**: conteo, suma, promedio y reparto por clase dentro del polígono; descarga de solo lo
  seleccionado y elección del polígono a descargar.
- **Mediciones**: sobre el terreno en 3D, panel de resultados con gráfica de alturas y «Mis
  mediciones» con borrado total.
- **Catálogo**: filtro por municipio, hexágonos y 3D, editor de tarjetas como lienzo y reportes.
- **Minimapa** (BETA) junto a la píldora de zoom, apagado por defecto.
- **Rotación del mapa 2D** con clic derecho y brújula para volver al norte.
- **MCP abierto**: sin API key, con `layer_stats`, `layer_table` y la vista 3D en los compartidos.

### Cambiado

- La documentación del repo se centralizó en `context-ame-esta`; `docs/` solo guarda el changelog.
- El changelog se parte por línea mayor: este archivo es la 2.x y la 1.x queda en
  [`changelog/v1.md`](changelog/v1.md).
- Íconos del panel de Herramientas homologados en morado con detalle naranja.

### Eliminado

- La API key del MCP y la herramienta `query_wfs`.

