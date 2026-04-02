# Esquema de z-index del Mapa

## Componentes de UI (Interfaz de Usuario)

| z-index | Componente                    | Ubicacion           | Descripcion                                    |
|---------|-------------------------------|---------------------|------------------------------------------------|
| **50**  | FeatureInfoPanel              | Flotante            | Panel de informacion de features (mas arriba)  |
| **30**  | MeasurementConfigPanel        | Flotante            | Panel de configuracion de mediciones           |
| **30**  | LayerDetailModal              | Centro inferior     | Modal de detalle de capas                      |
| **20**  | MapSider                      | Lateral izquierdo   | Menu lateral de capas                          |
| **11**  | Barra de busqueda             | Superior derecho    | Busqueda y descarga                            |
| **10**  | ActiveLayersList              | Superior derecho    | Lista de capas activas                         |
| **10**  | SymbologyPanel                | Superior derecho    | Panel de simbologia                            |
| **10**  | ScaleLineControl              | Inferior centro     | Control de escala                              |
| **10**  | MapControls                   | Inferior derecho    | Controles del mapa (zoom, ubicacion, etc.)     |
| **10**  | MeasurementControls           | Inferior izquierdo  | Herramientas de medicion                       |

## Capas del Mapa (OpenLayers)

### Capas vectoriales y de dibujo

| z-index  | Tipo de Capa                    | Descripcion                                          |
|----------|---------------------------------|------------------------------------------------------|
| **1000** | Capas vectoriales (dibujo)      | Herramientas de medicion, anotaciones, dibujos       |

### Capas tematicas WMS

| z-index    | Tipo de Capa                  | Descripcion                                          |
|------------|-------------------------------|------------------------------------------------------|
| **100-999**| Capas tematicas WMS           | Capas de datos (seguridad, salud, economia, etc.)    |

### Capas base del GeoServer (siempre visibles)

| zIndex | Capa                    | Layer GeoServer         | Descripcion                  |
|--------|-------------------------|-------------------------|------------------------------|
| **1**  | Curvas de nivel         | `curvas_de_nivel`       | Curvas de nivel (mas abajo)  |
| **2**  | Cuerpos de agua         | `cuerpos_de_agua_250k`  | Lagos, rios                  |
| **3**  | Limites municipales     | `limite_municipal`      | Limites municipales          |
| **4**  | Caminos                 | `caminos_2012`          | Caminos                      |
| **5**  | Cabeceras municipales   | `cabeceras_municipales` | Cabeceras municipales        |
| **6**  | Aeropuertos             | `aeropuertos`           | Aeropuertos                  |
| **7**  | Carreteras              | `carretera_2012`        | Atlas de carreteras          |
| **8**  | Regiones                | `regiones`              | Regiones del estado          |

### Capas base dinamicas (segun `base`)

| zIndex | Capa                              | Layer GeoServer                  | Visible cuando   |
|--------|-----------------------------------|----------------------------------|------------------|
| **9**  | Limite estatal secundario IIEG    | `limite_estatal_secundario`      | `base = 'iieg'`  |
| **10** | Limite estatal secundario INEGI   | `limite_estatal_inegi_secundario`| `base = 'inegi'` |
| **11** | Limite estatal IIEG               | `limite_estatal`                 | `base = 'iieg'`  |
| **12** | Limite estatal INEGI              | `limite_estatal_inegi`           | `base = 'inegi'` |

### Mapa base

| z-index | Tipo de Capa                    | Descripcion                                          |
|---------|---------------------------------|------------------------------------------------------|
| **-1**  | Mapa base (Carto/OSM)           | Fondo del mapa (Carto Light, Voyager, etc.)          |

## Diagrama Visual

```
+-------------------------------------------------------------+
|  UI: FeatureInfoPanel                         [50]           |  <- Mas arriba
+-------------------------------------------------------------+
|  UI: MeasurementConfigPanel, LayerDetailModal [30]           |
|  UI: MapSider                                 [20]           |
|  UI: Barra de busqueda                        [11]           |
|  UI: Paneles y Controles                      [10]           |
|      (ActiveLayersList, SymbologyPanel, MapControls, etc.)   |
+-------------------------------------------------------------+
|  Capas vectoriales (dibujo)                   [1000+]        |  <- Herramientas de medicion
+-------------------------------------------------------------+
|  Capas tematicas (WMS)                        [100-999]      |  <- Seguridad, salud, etc.
+-------------------------------------------------------------+
|  Limites estatales (IIEG/INEGI)               [11/12]        |  <- Dinamicos segun base
|  Limites estatales secundarios (IIEG/INEGI)   [9/10]         |
|  Regiones                                     [8]            |
|  Carreteras                                   [7]            |
|  Aeropuertos                                  [6]            |
|  Cabeceras municipales                        [5]            |
|  Caminos                                      [4]            |
|  Limites municipales                          [3]            |
|  Cuerpos de agua                              [2]            |
|  Curvas de nivel                              [1]            |  <- Mas abajo de capas base
+-------------------------------------------------------------+
|  Mapa base (Carto/OSM)                        [-1]           |  <- Fondo
+-------------------------------------------------------------+
```
