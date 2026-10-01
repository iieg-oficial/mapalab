# Changelog — línea 2.x

Todos los cambios notables del proyecto se documentan en este archivo. La historia `0.x` y `1.x`
está en [`changelog/v1.md`](changelog/v1.md).

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Versionado Semantico](https://semver.org/lang/es/).

## [No publicado]

### Agregado

- **Grabar una vuelta de la vista 3D (BETA).** En 3D, Descargar suma el formato Animación, también
  en «Descargar imagen» del catálogo: video MP4 de una vuelta completa (hasta 30 s, 720p o 1080p; WebM
  donde no hay H.264) o GIF cuadrado de 480 px en loop de 3 o 5 s. Se graba cuadro por cuadro esperando
  a que el mapa termine de cargar, con barra de avance y Cancelar. Cada cuadro lleva el logo largo de
  MapaLab, la flecha del norte, el minimapa de ubicación, un recuadro traslúcido con el nombre de la
  capa (y el número de capas activas si hay más de una), rumbo, inclinación y zoom, los logos de IIEG
  y Jalisco y la atribución del mapa base. En el comparador queda apagado. mediabunny y gifenc se
  cargan solo al grabar.
- **Grabar el vuelo del dron (BETA).** Botón REC en la pastilla del dron: se elige la cámara (1ª
  persona, 3ª persona o la del cono) y graba video en tiempo real hasta 1 min (30 s en celular), con el
  contador junto al botón. REC otra vez detiene y descarga; ocultar la pestaña o salir del dron también.
  La cámara del cono pone la vista desde el dron hacia el suelo con la inclinación del cono, como un
  dron de mapeo, y el recuadro muestra la huella en el suelo. El minimapa marca el dron con su rumbo.
- **Animar la ruta del minimapa del dron.** La descarga del minimapa ofrece PNG, video o GIF de 3 o
  5 s: la ruta trazada se dibuja tramo a tramo con el dron avanzando (sin ruta, el rastro del vuelo),
  con avance, distancia y tiempo en el recuadro.
- El botón de Colibrí para reportar lleva el badge BETA en la esquina superior derecha. Sale en el
  visor, el catálogo, el embebido y el inicio.
- Los badges BETA de Colibrí y del Catálogo van en la misma posición, en pill y en icono. En celular
  son más compactos para que no se junten.
- Al pasar el cursor, el botón de Colibrí se pinta de lila igual que la pill del Catálogo; antes solo
  oscurecía el icono y casi no se notaba.

### Cambiado

- La simulación de lluvia e inundación de la vista 3D solo sale en `dev` y `beta`; en producción el botón
  no aparece y la pastilla queda en tres o cuatro filas. Es un plano de agua que no inunda calles y puede
  leerse como información de riesgo: vuelve cuando exista el ráster HAND por cuencas. Se quitó la mención
  de las notas de la versión 2.0.0.
- El minimapa traza los límites estatal y municipal al doble de grosor cuando está de cerca (zoom 12
  o más), los dos con halo blanco, para que no se pierdan sobre el mapa. También en el minimapa grande
  de celular.
- De cerca, el minimapa no se acerca más de lo necesario para que el municipio quepa completo con su
  borde: dentro de un municipio grande se veía como un cuadro lila liso.
- El nombre del municipio va escrito sobre el propio municipio en el minimapa, en vez de la píldora de
  abajo. De cerca, el límite estatal queda de fondo en 1 px gris.
- De cerca, el minimapa encuadra el municipio completo y se queda fijo sobre él: al moverse hacia sus
  orillas solo se desplaza el rectángulo naranja, aunque salga del cuadro.
- De cerca, el municipio del minimapa lleva un velo blanco al 85 %: sobre el mapa base real se perdía
  entre las líneas del mapa. La silueta del estado sigue sin fondo.
- El minimapa viene encendido; la × lo apaga y se recuerda (`mapalab.minimapa = apagado`).
- La vista de municipio del minimapa entra un nivel antes: desde zoom 12, no 13.
- El minimapa mide lo mismo que la píldora de zoom y va alineado con ella; sigue su alto cuando la
  píldora gana o pierde botones.
- La píldora del Catálogo lleva el título en el gris de «Contribuciones».
- El colibrí de reportar va en morado con el pico naranja (también en el menú del marcador), y el
  botón redondo de Contribuciones es un © morado con la C naranja.
- El ícono de Minimapa en Herramientas usa la silueta real de Jalisco, con el rectángulo sobre
  Guadalajara.
- El rectángulo de la vista del minimapa se acota al borde del lienzo: ya no se corta cuando la vista
  sale del cuadro.
- En modo municipio el límite estatal va a 2 px, y el rectángulo se quita cuando no hay municipio bajo
  la vista o cuando la vista cubre todo el cuadro.
- Con todo Jalisco (menos de zoom 10) el minimapa de escritorio ya no se oculta: queda el contorno del
  estado en gris claro, para que se note que está encendido. Las siluetas se piden al montarse.
- En modo municipio, si la vista abarca el municipio completo, su contorno va en naranja en lugar de
  dibujar un rectángulo enorme.
- El minimapa también sale en el catálogo (escritorio). En modo municipio marca con un punto discreto
  el centro del mapa, que es el que elige el municipio. `MapControls` decide pantalla chica con
  `useIsMobile`: con `useSider` el catálogo, sin `SiderProvider`, montaba el minimapa de escritorio en
  celular.
- En celular el minimapa es un botón redondo arriba de la píldora de zoom, del mismo ancho, que abre
  una hoja con el minimapa a todo lo ancho (medido al vuelo, sin pasar del 70 % del alto) y el nombre
  del municipio y la × encima, en las esquinas; tocar un punto mueve el mapa y cierra la hoja. Las siluetas se piden al abrirla. La píldora bajo el logo se retiró porque chocaba con Eventos,
  y la tarjeta de Herramientas sigue solo en escritorio.

### Corregido

- **Los dominios permitidos de una llave del embed no restringían nada.** La llave se validaba en la
  petición a `/embed/config` que hace el propio iframe, y el origen de esa petición es siempre el de
  mapalab: había que poner `iieg.jalisco.gob.mx` en la lista y, con eso, la llave servía en cualquier
  sitio. Ahora el HTML de `/embed` sale con `frame-ancestors` armado con los dominios de la llave
  (nginx lo pide a `GET /embed/marco` con `auth_request`), así que el navegador no deja incrustarlo
  en otro sitio, y la API del iframe compara la llave contra el sitio que lo contiene (`parent`, que
  solo cuenta cuando la petición sale del propio mapalab). Las llaves ya no necesitan
  `iieg.jalisco.gob.mx` salvo que se usen en páginas del instituto.

## [2.2.0] - 2026-09-29

### Agregado

- El minimapa tiene evento propio, `minimapa` con `action: encender|apagar|abrir|ir`, y sigue sumando a `map_interaction`. Antes solo llegaba como `map_interaction` con `action: minimapa_*`, que ningún rollup lee, y no aparecía en el tablero. Requiere mariachi 2.114.0.

## [2.1.0] - 2026-09-29

### Agregado

- Telemetría del modo dron y de la simulación de agua, como acciones de `view3d` (mariachi ya las acepta desde 2.104.0): `dron_start` con la aeronave, `dron_end` con la aeronave y la duración, `lluvia` al empezar a llover e `inundacion` con su modo cuando el nivel pasa de 0. El deslizador del nivel no genera un evento por paso.

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

