# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Versionado Semantico](https://semver.org/lang/es/).

## [1.211.0] - 2026-09-24

### Cambiado: la selección por polígono muestra conteos y pide los elementos al ver detalles

Al cerrar un polígono se pedía de inmediato la primera página de elementos —hasta 200, con atributos
y geometría— aunque la primera vista solo muestra el resumen, y el resumen contaba sobre esa página,
así que se topaba en 200. Ahora `resumirPoligono` (`usePolygonSelection`) pide solo los conteos por
capa con `resultType=hits`, que ya se hacían para el borde y se descartaban: el resumen sale exacto y
sin la petición más pesada. «Ver detalles» pide la primera página y las siguientes se cargan al
desplazarse, como antes. Aplica al visor, al 3D y a las celdas de hexágonos; el catálogo sigue con su
flujo. Mientras no se abren los detalles, la columna de acciones solo ofrece cerrar y descargar mapa.

### Corregido: los conteos de la selección saturaban el WFS

El conteo lanzaba dos peticiones por capa, todas a la vez, contra una zona del gateway de 10 r/s con
`nodelay` para todo el sitio: con una categoría grande llovían 429 y el resumen desaparecía. Ahora
salen de dos capas en dos, a 15 por segundo como máximo, y reintentan dos veces tras un 429. Una capa
que aun así no se pudo contar aparece como «Sin dato» en vez de tirar el resumen. El techo del gateway
se subió aparte, en gateway-hub 1.54.0.

### Corregido: el trazo de la medición 3D se quedaba al borrarla

Al terminar una medición en 3D el trazo seguía dibujado en la capa de la herramienta, aparte de la
copia guardada; al borrarla de «Mis mediciones» quedaba la marca. El trazo se limpia al guardarse.

## [1.210.1] - 2026-09-24

### Cambiado: los paneles del comparador cierran con la X estándar

«Capas comparadas» y la periodicidad por lado dibujaban a mano un botón gris con el icono `close`,
que es exactamente lo que ya hace `MobileSheetCloseButton`. Pasan a usarlo, como los paneles de
subtemas, «Ajustes 3D» y el de resultados de medición. La salida del comparador sigue siendo un
`PillCloseButton`, porque sale de un modo y no cierra un panel.

### Agregado: helper para la tabla de diferencias del comparador

`helpers/tablaDiferencias.js` une los dos lados por `clave_municipio`, `clave_geo` o `fid` —en ese
orden, según los contratos de datos—, detecta qué columnas son comparables, calcula β−α, ordena por
la diferencia y resume cuántas entidades subieron, bajaron o se quedaron sin par. Las que sólo
existen de un lado nunca se esconden. Entró en `fd65ec0` sin entrada propia; todavía no lo usa
ninguna pantalla. Va con 15 pruebas.

## [1.210.0] - 2026-09-24

### Agregado: «Ver la distancia» en «Mis mediciones»

Las líneas de la lista tienen un botón ⓘ que abre su panel de distancia. El InfoBox que se abre desde
la lista sale **centrado en la ventana** (`selectedFeatureInfo.centrado`) en vez de anclarse al
último vértice, para que no quede detrás de los paneles. Aplica en el visor, en 3D y en el catálogo.

### Agregado: medir en el comparador 3D

Pedir Mediciones con el comparador en 3D ya no lo cierra. La herramienta escucha a los mapas α y β a
la vez con un solo trazo, y β pausa su consulta al clic mientras se mide. Lo medido se guarda aunque
el mapa principal no exista durante la comparación. En el comparador 2D, Mediciones sigue saliendo
del comparador: ahí no hay capa de dibujo.

### Corregido: las mediciones sobreviven al comparador, al 3D y al catálogo

- Al salir del comparador las mediciones volvían a la lista pero no al mapa, y no se podía medir
  hasta recargar. La capa de dibujo existe sin mapa y se engancha al mapa nuevo (`ensureVectorLayer`).
- Cerrar la píldora de herramientas del catálogo borraba todas las mediciones. Ahora solo cierra;
  borrar todo queda en la lista, con confirmación.
- Al salir de 3D volvían a ocultarse las herramientas de medición aunque estuvieran abiertas.
- Entrar al comparador con el modo dibujo activo bloqueaba los clics de consulta en los dos lados.

### Corregido: cifras y persistencia de las mediciones

- El conteo de una selección se escribía en la última medición de la lista. Va atado al id de la
  selección que lo pidió.
- Borrar, ocultar y ver una medición van por `id`, no por su posición en la lista.
- El bloque «Selección» de la imagen descargada respeta las unidades elegidas en los ajustes.
- Las selecciones se guardan al recargar y viajan en el enlace compartido.
- Abrir un enlace compartido (`?s=`) ya no pisa las anotaciones guardadas en el navegador.

### Corregido: el InfoBox con el panel de medición

- Se salía de la pantalla cuando crecía después de abrir, como con el perfil de alturas en 3D: el
  `ResizeObserver` nunca se enganchaba porque el panel no existía al montar. Si no cabe, la tarjeta se
  desplaza por dentro.
- El panel de área y distancia se recortaba a 239 px: las filas saltan de línea y el encabezado usa
  el margen compacto. Pierde su X; se cierra desde la columna de acciones.
- La imagen descargada ya no lleva el letrero de área y perímetro dentro del mapa, que repetía el
  bloque «Selección».

## [1.209.0] - 2026-09-24

### Agregado: estilo de los puntos en 3D

- «Ajustes 3D» suma **Puntos**: Sombra (por defecto), Poste o Frente. Con sombra el ícono lleva una
  elipse suave al pie y crece al acercarse; con poste va sobre un poste delgado con punto en la base.
  El ícono se compone en un lienzo (`estilosDePuntos3d.js`) y aplica a todas las capas de puntos que
  salen de pie. «Restablecer» regresa a Sombra.

### Agregado: emojis y anotaciones en 3D

- «Anotaciones» ya no saca del 3D. Emoji se coloca con un clic sobre el terreno y sigue el estilo de
  Puntos; Texto y Trazo libre quedan deshabilitados con «Solo en 2D» (`ToolSelector` acepta
  `bloqueadas`).

### Agregado: municipio o región en 3D

- La selección de municipio, región o ZMG se ve en 3D con el mismo velo y contorno del 2D, y la
  cámara encuadra la selección conservando inclinación y rumbo (`useMap3dMunicipio`). Antes solo se
  filtraban las capas: ni máscara ni encuadre.

### Corregido

- **Una capa de puntos con un dato imposible de reproyectar ya no se cae.** GeoServer cortaba el
  WFS en 3857 a media respuesta («too close to a pole») y el JSON llegaba roto: en 3D la capa se
  quedaba plana y en modo vector no cargaba. `fetchVectorFeatures` repite el pedido acotado con
  `BBOX` a coordenadas válidas. Lo destapó `salud:unidades_salud` (el grupo completo de
  establecimientos).
- **Compartir fallaba en cuanto había un punto medido**: el backend solo aceptaba cinco tipos de
  anotación. Acepta `Pin` y `Select` y valida `pinEtiqueta` como texto.
- **En swipe 3D el lado α tapaba al β**: el `z-index` del 3D se salía de su pane. Cada pane aísla su
  apilamiento y cada lado muestra solo sus capas.
- **Swipe 3D**: cada lado conserva su MapLibre aunque cambie el registro de panes, y la descarga
  espera a que cada 3D se redibuje al tamaño de la captura antes de fotografiarlo.

## [1.208.0] - 2026-09-24

### Agregado: filtro por municipio en el catálogo

Junto a la píldora de fechas aparece «Todo Jalisco» cuando la capa tiene campo de municipio. Abre
el mismo panel del visor: municipios, regiones y ZMG. La capa se filtra, el resto del estado se
oscurece y el mapa encuadra la selección; la tabla, el polígono, los hexágonos, la leyenda y las
descargas respetan el recorte. Viaja en la URL como `?municipios=` —el mismo parámetro del visor—
y en el enlace para compartir. Al cambiar a una capa sin campo el filtro se quita. Solo fuera de
producción, como en el visor.

`/catalogo/capas` expone `municipioField` y `municipioFieldType`, tomados del registro de la capa en
`mapalab.layers`. Hoy los tienen 7 de las 13 capas; para sumar otra basta con registrar su campo.

## [1.207.4] - 2026-09-24

### Cambiado: las mediciones del catálogo se borran al salir

Sobreviven a recargar la página, pero se borran al salir del catálogo o al cerrar la pestaña, en vez
de quedarse en el `localStorage` para la siguiente visita. `useAnnotationsPersistence` acepta
`storageType: 'session'`; el visor sigue en `localStorage`. Los trazos viejos del catálogo que
quedaban en `localStorage` se descartan al entrar.

## [1.207.3] - 2026-09-24

### Cambiado: la lista de instituciones ya no abre por defecto

Al entrar a `/catalogo` solo se ve la lista de capas con «Todas». Las instituciones se despliegan
debajo de las píldoras con el chevron, y elegir una la cierra y abre sus capas. Se retira el
acomodo en paralelo de la 1.207.0.

### Agregado: logo de la institución en la lista «Todas»

Cada capa lleva a su izquierda el logo de su institución; si no tiene o no carga, el de Mapalab.

### Corregido: la línea abre su panel de distancia en el catálogo

Al terminar una línea se abre el panel de distancia, como en el visor. Solo con las herramientas
abiertas, para que las mediciones restauradas al recargar no lo abran solas.

## [1.207.2] - 2026-09-24

### Cambiado: el control de hexágonos vuelve a sus íconos, en su propia fila

Regresa el segmento Puntos | Hexágonos con la variante nueva `gris` de `Segmented`: fondo gris y la
opción activa en blanco. Baja a su fila, debajo del título, para no quitarle ancho, y con hexágonos
activos muestra al lado el número de celdas; la leyenda pierde la línea «Puntos por hexágono». La
variante `neutro` de `Switch`, de la 1.207.1, se quita porque quedó sin uso.

### Cambiado: la lista de instituciones abre con el buscador

Al entrar a `/catalogo` se ven de una vez las instituciones, con «Todas», junto a las capas. La lista
se abre y se cierra con el buscador; el chevron sigue sirviendo a mano.

## [1.207.1] - 2026-09-24

### Corregido: elegir una institución abre sus capas

Tocar «Todas» o una institución, en las píldoras o en la lista, abre el buscador con las capas de esa
institución y deja la lista de instituciones al lado. Antes la cerraba y, con el buscador cerrado, no
se veía ninguna lista.

### Cambiado: el control de hexágonos es un switch gris

Punto blanco sobre fondo gris en los dos estados, entre los íconos de puntos y hexágonos, con el
estado en el tooltip. `Switch` gana `variant="neutro"` para los casos en que ningún lado es
«apagado», y `ariaLabel` en su versión sin etiquetas.

## [1.207.0] - 2026-09-24

### Agregado: descargar la capa del catálogo como imagen

«Descargar» suma «Imagen», que abre `CatalogoDescargaImagen` con las opciones del visor: formato (PNG,
JPEG, PDF), parte del mapa (Área, Jalisco o Selección si hay polígono), calidad, título y leyenda.
Usa el mismo `useMapDownload`; «Área» descarga lo visible, sin el recuadro de la vista previa. Para
que la leyenda se encuentre, el catálogo monta un `LayersContext` con su capa y completa en su
`MapsContext` `targetRef`, `groupedActiveLayers` y `selectedLayer`. `useMapDownload` deja de exigir
el `EventoProvider` del visor.

### Agregado: el polígono del catálogo mide y resume

La selección por polígono abre el panel «Área» (desde arriba, sobre el relieve, perímetro, máximo y
mínimo, gráfica de alturas) y el «Resumen de selección»; las tarjetas salen con «Ver detalles». Un
polígono sin elementos también muestra su medición. Las tarjetas del catálogo pasan a pintarse dentro
de sus contextos: el resumen usa `useLayerSymbolIcon`, que sin `MapsContext` tumbaba la página.

### Cambiado: el catálogo, más parecido al visor

- **Listas en paralelo**: con el buscador abierto y la lista de instituciones desplegada, en escritorio
  las instituciones van en una columna junto a las capas. La lista de capas sale a
  `CatalogoCapasLista`.
- **Hexágonos**: el control pasa a la cabecera del panel, junto a minimizar, con su texto como
  tooltip; sus teclas ya no minimizan el panel.
- **Compartir**: enlace con botón de copiar, QR con «Descargar PNG» y redes sociales, como en el
  visor. Fijar, incluir mediciones e insertar no aplican: el enlace del catálogo es directo.

### Cambiado: mediciones

- La «i» de las filas de «Mis mediciones» ya no lleva círculo de fondo.
- El texto del pin se separa 6 px del ícono (antes tapaba 4 px); en 3D, la separación sube a 6 px.

## [1.206.0] - 2026-09-24

### Agregado: capas de puntos del catálogo en hexágonos H3

El panel de la capa lleva «Ver como: Puntos | Hexágonos» con BETA, solo en capas de puntos y fuera de
producción, como en el visor. `useCatalogoHexbin` oculta la WMS, dibuja con `createHexbinLayer` y
reagrupa al hacer zoom con la tabla de `constants/hexbin.js`; la leyenda es `HexbinLegend`.

- **Fuente**: si la capa tiene par en el visor (mismo `workspace + geoserver_layer`, único, sin CQL y
  con conteos en `hexbin_counts`) y no hay filtro de fecha ni de tabla, se piden las celdas de
  `mapalab:hexbin_agregado`. Si no, se cuentan los puntos y con 20 000 o menos se agrupan en el
  navegador; si pasan, la leyenda pide filtrar por año.
- **Backend**: `/catalogo/capas` expone `hexbinLayerKey` con un `LATERAL` en `catalogo_repository`.
- **URL**: `?agrupar=hex`, también en Compartir. No se usa `vista` porque es del 3D, que lo borra
  cuando está apagado.

### Cambiado: el editor de tarjetas y el modal de información cierran con `MobileSheetCloseButton`

La X estándar de los paneles.

## [1.205.0] - 2026-09-24

### Corregido: el techo de `POST /shares` se evadía y era global sin decirlo

- Contaba por la primera IP de `X-Forwarded-For`, que manda el cliente: cambiar el encabezado lo
  evadía, y sin él todo el sitio compartía los 10 por minuto porque el borde entrega una sola IP.
  Ahora es un techo **global** de 30 por minuto y 3000 al día, contado después de validar, y el hash
  de IP que se guarda sale de `X-Real-IP`.

### Cambiado: `POST /shares` valida el payload

- Las capas deben existir en el catálogo del visor (id, slug o alias); si el árbol no se puede leer,
  no se bloquea. Hasta 60 capas y 20 filtros por capa con valores simples: los filtros se acotan, no
  se descartan, porque el visor los necesita.
- La vista se acota a lat 10–35 y lon −120 – −84; los textos de anotaciones a 200 caracteres y las
  etiquetas del comparador a 60. Aplica igual a los enlaces que crea el MCP.
- El visor muestra el `detail` del servidor cuando falla, en vez de `POST /shares 429: {...}`.

## [1.204.1] - 2026-09-24

### Corregido: la rotación con clic derecho rompía una regla de React al entrar al comparador

`useRotacionClicDerecho` usaba `[clave, ...lista]` como dependencias. Al entrar al comparador la
lista pasa de un mapa a dos, el arreglo cambia de tamaño entre renders y React lo prohíbe; lo
avisaba en consola como «The final argument passed to useEffect changed size between renders». La
regla que lo habría atrapado estaba callada con un `eslint-disable`, que se retira.

Ahora la lista llega memorizada desde `<BotonNorte>` y es la única dependencia. Van cinco pruebas del
hook; una de ellas —pasar de uno a dos mapas sin el aviso— falla contra el código anterior.

### Corregido: la imagen exportada del comparador rotulaba los lados con A y B

`composeSwipeCanvas` pintaba la letra del slot tal cual en las píldoras de la imagen. Usa
`slotLabel`, así que ahora dice α y β como el resto del comparador.

## [1.204.0] - 2026-09-24

### Agregado: la vista 3D viaja en los enlaces compartidos

- Compartir desde la vista 3D guarda inclinación, rumbo, exageración y capas levantadas en
  `payload.vista3d` (en el comparador, `payload.shared.vista3d`). Abrir el enlace entra a la 3D con
  esa cámara; sin WebGL abre en 2D.
- El deserializador deja la vista en `helpers/vista3dCompartida.js` y `View3dProvider` la aplica,
  porque el cargador de enlaces corre fuera de ese provider.
- `validate_payload` acota `pitch` a 0–80, `bearing` a ±180, `exaggeration` a 1–5 y `extruir` a 10
  capas.
- MCP: `create_map` y `create_swipe` aceptan `vista_3d` (`inclinacion`, `rumbo`, `exageracion`,
  `extruir`); las capas a levantar deben ser del mapa. El `embed_html` sigue en 2D.

## [1.203.0] - 2026-09-24

### Agregado: `layer_table` en el MCP

- Tabla de datos de una capa: filas con los alias de columna del visor (`atributos.columnas`), filtros
  estructurados `{campo, op, valor}` (hasta 5), orden, páginas de hasta 50 filas y un punto
  `{lat, lon}` por fila con `coordenadas`. Llega hasta la fila 5000.
- Los campos se validan contra `DescribeFeatureType`, los textos se escapan y los números se
  convierten: no hay CQL libre. Techo global de 60 consultas por minuto y 5000 al día.

### Eliminado

- `query_wfs`: su CQL crudo y sus 10 000 features por llamada no tenían cabida con el MCP abierto.
  `layer_table` cubre la lectura y las coordenadas para anotar.

### Corregido

- `resolver_consulta` no aplicaba el `cqlFilter` base de la capa: `layer_stats` de `bachillerato`
  contaba todos los centros educativos. También respeta `wfsLayerName` y rechaza las capas con
  `wfsAvailable: false`, igual que el visor.

## [1.202.0] - 2026-09-24

### Eliminado: API key del MCP

- `/mcp` ya no pide `Authorization: Bearer mk_...`: se conecta como conector personalizado de
  claude.ai, cuya UI no tiene campo para una key estática. Se borró `servers/auth.py`
  (`MCPAuthMiddleware` y el flush de cuota a mariachi).
- La telemetría del MCP deja de aplicar la cuota por key y de registrar los `tools/call` en la
  Auditoría de las llaves; queda la telemetría anónima.
- Se retiraron `MCP_AUTH_ENABLED` y `MCP_QUOTA_FLUSH_INTERVAL_SECONDS` de la configuración.
- La protección queda en el blindaje de 1.201.0, los techos globales y el `limit_req` del nginx.

## [1.201.0] - 2026-09-24

### Agregado: `layer_stats` en el MCP

- Tool nuevo para cifras de una capa sin descargar elementos: conteo (WFS `resultType=hits`), suma y
  promedio de un campo numérico y reparto por clase (WPS `gs:Aggregate` con `groupByAttributes`),
  con filtros por `municipio` y `year`. Devuelve las `top` clases (máximo 25) y resume el resto en
  `otras`.
- `field` y `group_by` se validan contra `DescribeFeatureType`; el error lista los campos válidos.
- Caché de 10 minutos y techo global de WPS de 20 por minuto y 500 al día, porque GeoServer limita
  `wps.execute` a 1000 al día para todo el sitio.
- `query_wfs` y `layer_stats` comparten `resolver_consulta` para armar capa y filtros.

### Cambiado: blindaje de `create_map` y `create_swipe`

- Las capas se resuelven contra el catálogo y una inexistente se rechaza; `selected` debe ser una de
  las capas del mapa.
- Los `filters` que manda el cliente se descartan: solo quedan los que arma el servidor por `year` y
  `municipio`.
- La vista se acota a Jalisco (`lat` 17–24.5, `lon` −107.5 – −99.5, `zoom` 1–20), las etiquetas del
  comparador a 60 caracteres y las anotaciones a 200 elementos con campos conocidos.
- Techo global de 30 compartidos por minuto y 2000 al día. Es global porque el borde entrega todo el
  tráfico con una sola IP y el MCP no tiene sesión.

## [1.200.0] - 2026-09-24

### Agregado: vista 3D dentro del comparador

- Con el swipe abierto se puede entrar al 3D, y abrir el swipe ya no saca del 3D: hay un MapLibre por
  lado, montado sobre el mapa de cada pane. El de β queda dentro del recorte de la barra, así que la
  barra lo corta sin cambios en `SwipeView`.
- **La cámara va sincronizada** (`useCamara3dSincronizada`): mover, inclinar o girar un lado mueve el
  otro, con guarda contra el rebote. La órbita, la inclinación y el `map3dRef` los lleva el lado α; el
  zoom y el encuadre del panel mueven los dos.
- Se levantan las guardas que existían solo por la exclusión: el botón 3D en swipe y el botón de
  levantar capa (`ExtrudeButton`) dentro del comparador.
- En celular se conserva la exclusión (dos WebGL a la vez es demasiado) y las mediciones quedan
  apagadas dentro del swipe en 3D.

### Cambiado: la medición vive dentro del InfoBox

- Al terminar una línea o un polígono, en 2D o 3D, se abre el InfoBox con la tarjeta de la medición
  arriba, el «mostrar detalles» de la selección abajo y su columna de acciones al lado. Si el polígono
  no tiene elementos, el InfoBox se abre igual, solo con la medición.
- Se quitan los paneles laterales de resultados de 2D y 3D.
- Dentro del InfoBox la tarjeta va compacta (12 px, etiquetas cortas) para caber en 239 px.

### Cambiado: gráfica de alturas en áreas

- La distribución de alturas pasa de barras a **curva de línea**: el porcentaje del área por encima
  de cada altitud. Comparte `<GraficaAlturas>` con el perfil de las distancias.
- El panel no aparece mientras no haya resultado, usa la X estándar de los paneles
  (`MobileSheetCloseButton`) y fuera del InfoBox se arrastra desde el encabezado.
- «Ajustes 3D» se separa 12 px de la pastilla y comparte su borde inferior.

### Corregido

- **El catálogo tronaba al medir en 3D**: montaba las mediciones del visor, que dependen del sider.
  El catálogo monta su 3D sin ellas.

## [1.199.2] - 2026-09-24

### Corregido: «Visible» mentía en el comparador

El modo **Visible** de la tabla de datos filtra por el encuadre, y para eso `useTablaVista` leía
`mapRef.current`. Dentro del comparador ese ref es `null` —el `<MapView>` live no se monta, es una
invariante documentada—, así que el efecto salía temprano, nunca había extent y la tabla mostraba la
capa **completa** mientras el botón seguía diciendo «Visible». Lo mismo le pasaba a «congelar», que
se quedaba sin encuadre que congelar.

Ahora cae a `paneMapInstances[0]`, como ya hacían `<MapControls>` y `useMapCapture`. Se usan las
instancias reactivas y no `paneMapRefs` a propósito: los refs no disparan el efecto cuando el pane
aparece, y en el comparador el pane se monta después. Los dos panes comparten la misma instancia de
`View`, así que el encuadre del α vale para los dos.

Va con cinco pruebas: el hook no tenía ninguna.

## [1.199.1] - 2026-09-24

### Corregido: cambiar de institución ya no quita la capa del catálogo

Al elegir otra institución la ruta conserva la capa seleccionada y su `?fecha=`, así que el mapa no
queda vacío mientras se recorre la lista; la capa se cambia solo al elegir otra. El buscador ya no se
cierra en cada cambio de ruta, solo cuando cambia la capa.

## [1.199.0] - 2026-09-24

### Corregido: al modal de capa se le habían escapado los lados α y β

`<LayerDetailModal>` rotulaba sus dos secciones de periodicidad como «Lado A» y «Lado B» con letra
latina, mientras el resto del comparador ya usaba α y β. Se vio al abrir el modal de una capa con
fechas dentro del comparador: decía «Periodicidad Lado A» junto a un mapa partido por α y β.

## [1.198.0] - 2026-09-24

### Cambiado: seleccionar una capa ya no encuadra el mapa

Desde 1.60.0, seleccionar una capa en «Capas activas» llevaba el mapa al recuadro que GeoServer
declara para ella, casi siempre todo Jalisco. Si estabas acercado revisando una zona, cada cambio de
capa te sacaba de ahí; y seleccionar sirve sobre todo para otras cosas (la leyenda, qué consulta el
InfoBox, el título de la descarga, qué compara el swipe). `ActiveLayerItem` ya no llama a
`centerOnLayer`; conserva el pulso, que atenúa las otras capas sin mover la vista.

Encuadrar queda manual: un clic en cualquier parte de la tarjeta de la leyenda, o Enter, como desde
1.64.0. La tarjeta suma el tooltip «Encuadrar el mapa en esta capa», ahora que es la única vía. El
`defaultZoom` al activar una capa no cambia.

## [1.197.0] - 2026-09-24

### Cambiado: el panel de periodicidad del comparador gana encabezado propio

El bote de basura y la X dejan de ser absolutos sobre la esquina y pasan a un encabezado de verdad,
pegado arriba al hacer scroll, con el título a la izquierda. Los controles de animación —velocidad,
sentido y play— bajan a su propia fila, y los años y los meses se quedan como estaban.

Para lograrlo el panel deja de montar `<PeriodicitySection>` y compone directamente con las piezas
que ese componente ya usaba: `<SimpleDateSelector>` y los botones de
`SimpleDateSelectorParts`. `<PeriodicitySection>` resuelve el título y los controles en una sola
fila con `flex-wrap`, que es justo lo que había que separar; el modal de capa y el catálogo lo
siguen usando sin cambios.

## [1.196.0] - 2026-09-24

### Agregado: resultados del área junto al InfoBox, con gráfica de alturas

- Al cerrar un polígono en 2D, el panel de resultados sale **pegado debajo del resumen de la
  selección** del InfoBox (`<PanelMedicionSeleccion>`). Si la consulta no encuentra elementos y el
  InfoBox no abre, el panel sale junto a las herramientas.
- **Alturas dentro del área** (`<DistribucionAlturas>`): barras con el porcentaje del área por franja
  de altitud, con tooltip, más la altura máxima y mínima. Sale de la misma rejilla del DEM que ya
  calculaba el área sobre el relieve.

### Agregado: Mis mediciones en 3D

- El 3D usa el mismo `<HistoryButton>` y `<HistoryPanel>` del 2D, sobre la misma lista: lo que se
  termina en 3D entra ahí por `restoreAnnotations` y sigue al volver a 2D.
- Las mediciones de la lista se pintan sobre el terreno en 3D (`useMedicionesGuardadas3d`).

### Cambiado

- **Trazo en vivo en 3D**: la línea y el relleno siguen al cursor, con los colores del 2D (morado para
  líneas, naranja para áreas).
- **Terminar en 3D** corta el trazo, guarda la medición y oculta la barra de deshacer, terminar y
  cancelar, como en 2D. Esc también termina.
- **Ajustes 3D**: la X es la de los paneles de subtemas y a su lado va una flecha para restablecer;
  el pie queda limpio. El engrane va sin fondo y al abrirlo se vuelve la X.
- **La X del panel de zoom en 3D** baja a 32 px (`size="pastilla"` de `<PillCloseButton>`).

### Corregido

- **El cursor de cruz al medir en 2D** no se veía: el resaltado al pasar sobre elementos lo
  reescribía en cada movimiento. Ahora se detiene mientras se dibuja.

### Agregado: vista 3D en el catálogo

El botón 3D del panel de zoom aparece también en `/catalogo`: `CatalogoMapView` monta
`View3dProvider` y `Map3DView` en carga diferida, y la capa del catálogo lleva `mergedLayers` para que
el 3D la copie con su fecha y los filtros de la tabla; las de puntos salen de pie. El clic en 3D abre
la tarjeta del catálogo: `useMap3dClick` recibe la consulta como parámetro (`Clic3d.jsx`) y el visor
sigue usando `useFeatureInfo`. La consulta del catálogo pasa a `useCatalogoConsulta`, compartida por
el 2D y el 3D. El editor de tarjetas y el modal de información cierran con la X de la lista de capas.
Entró en el commit `2978e74`.

## [1.195.0] - 2026-09-23

### Corregido: el clic derecho para girar no funcionaba del lado β

`<BotonNorte>` montaba la interacción de rotación sobre `getActiveMap()`, que en el comparador
resuelve **siempre al pane α**: el lado β nunca la recibía. `useRotacionClicDerecho` ahora acepta
varios mapas y en swipe se monta en los dos. Como comparten la misma instancia de `View`, girar
desde cualquiera de los dos mueve ambos. Verificado arrastrando con el botón derecho sobre la mitad
derecha: la rosa de los vientos pasa de 0° a 7.6°.

### Agregado: pasar el puntero por un lado lo resalta en el mapa

Los botones α y β de cada fila y las píldoras de fecha encienden el overlay gigante de su mitad
mientras el puntero está encima, con el mismo `highlightSlots` que ya usaba la píldora que se
retiró. Antes había que hacer clic para saber qué mitad tocabas.

### Cambiado: detalles de la barra y del panel

- **Las píldoras de fecha van sueltas**, sin el contenedor blanco que les había puesto.
- **La X de cerrar queda por detrás** de las capas comparadas: al abrir el panel deja de asomar.
- **La X del panel** es la misma de `<Panel>`, la del encabezado del catálogo de capas.

## [1.194.0] - 2026-09-23

### Agregado: engrane de ajustes en la vista 3D

- La pastilla 3D queda con inclinación, relieve, sol, órbita y un **engrane**, y mide lo mismo que
  el panel de zoom (44 × 204 px).
- El engrane abre «Ajustes 3D»: los cuatro deslizadores —incluida la altura sobre los puntos, que
  sale de la pastilla— y los interruptores de **terreno, cielo y niebla**, prendidos por defecto.
  **Restablecer** regresa todo a los valores de fábrica.
- Los anillos y el engrane comparten `<Map3DPopover>` y `<Map3DDeslizador>`.

### Agregado: panel de resultados de medición, en 2D y 3D

- `<PanelMedicion>` con encabezado (`<PanelHeader>`), X (`<PillCloseButton>`) y tipografía
  `font-garet`: distancia en línea recta y siguiendo el terreno, subida, bajada, máximos y perfil de
  elevación; en polígonos, área sobre el relieve y perímetro.
- En 2D sale al terminar una línea o un polígono; el relieve se lee directo del DEM, sin 3D.

### Agregado: girar el mapa 2D con clic derecho

- Arrastrar con clic derecho gira el mapa cuando no hay mediciones, anotaciones ni dibujo abiertos.
  La N gira con él y al hacer clic vuelve al norte.

### Cambiado

- **El norte es permanente**, en 2D y 3D, y queda centrado con el panel de zoom.
- **Ubicarme funciona en 3D**: vuela a la posición sin cambiar inclinación ni rumbo.
- **Con el 3D activo, el botón 3D se vuelve la X** de `<PillCloseButton>` para salir.
- **Las mediciones 3D usan los componentes de 2D**: `<ToolSelector>` con deshacer, terminar y
  cancelar, y `<CloseButton>`. En modo normal el clic abre el InfoBox.

### Eliminado

- La barra propia de mediciones 3D y su modo «altura de un punto».

## [1.193.0] - 2026-09-23

### Cambiado: la barra del comparador se homologa con la píldora de la tabla de datos

- **Misma altura.** Los 56 px de la barra bajan a 40, los mismos de `<PillMinimizada>`. Medido en
  las dos: 40 y 40.
- **La X se comporta igual.** Pasa a ser `<PillCloseButton>` —el mismo componente de la píldora de
  la tabla— encima de la barra y oculta hasta que el puntero entra, en vez de un botón siempre
  visible al costado. Conserva la confirmación de cerrar con un `<ConfirmDropdown>` propio, porque
  salir descarta la comparación.
- **Las fechas vuelven, sueltas.** Cada lado tiene su propia píldora flotando junto a la principal,
  α a la izquierda y β a la derecha, en vez de ir dentro. La principal se queda con sus dos botones.

### Cambiado: el panel de capas comparadas deja de inventar

- El icono del encabezado es `tool_swipe`, el mismo de la herramienta en el sider; el SVG propio que
  había hecho (`ico_capas_comparadas.svg`) se elimina.
- La X reutiliza `<ActionIconButton>` con el icono `close`, como la ventana de la tabla de datos.
- **Los nombres largos ya no se cortan**: la fila les da todo el ancho libre, admiten dos renglones
  y llevan tooltip con el nombre completo.
- **Se va el guión** de las capas sin periodicidad. Ocupaba una columna fija de 74 px por lado para
  no decir nada; ese espacio ahora es del nombre.

### Cambiado: α y β del handle más grandes

De 13 a 18 px. A ese tamaño las letras griegas se leían como manchas sobre el mapa.

## [1.192.0] - 2026-09-23

### Cambiado: «¿Qué es esta vista?» va a la izquierda del buscador del catálogo

El botón pasa al lado izquierdo del input y su modal se reescribe como una lista de una frase por
función: buscar, consultar (clic o polígono), tiempo, descargar, compartir y medir y anotar. La tabla
de datos y personalizar la tarjeta solo se listan fuera de producción, donde existen.

### Cambiado: ajustes del editor de tarjetas

- El nombre de la capa va junto al título del encabezado y se quita la descripción.
- La X es `PillCloseButton`, que gana `reveal="siempre"` para quedar visible sin hover; antes el
  valor vacío caía al modo oculto.
- Las secciones del lienzo ya no dejan un espacio en blanco abajo: se anula el `mb-3` del último
  hijo de cada bloque.
- «Cancelar» de agregar bloque va en rojo, con el estilo de borrar de sieej (`CANCELAR`).
- El paso de enviar la propuesta angosta el modal a sus campos y cambia «Regresar» por el «<» junto
  al título, como en `PanelHeader`.

### Cambiado: la tabla de datos del catálogo queda fuera de producción

Como en el visor, donde la herramienta sigue en beta.

## [1.191.0] - 2026-09-23

### Agregado: elegir qué polígono descargar

Con dos o más polígonos de selección, la vista Selección del panel de descarga muestra una lista:
cada polígono con su área y la opción «Todos». Por defecto va el último dibujado, como antes. El
atajo del InfoBox preselecciona el polígono de esa tarjeta: `useFeatureInfo` guarda la geometría en
`polygonGeometry` y el aviso de `descargaSeleccion` la lleva al panel.

«Todos» usa la unión real de los polígonos, con la dependencia nueva `polygon-clipping` (MIT). Antes
la máscara llevaba un hueco por polígono y donde dos se encimaban la zona volvía a quedar en blanco;
el área, además, contaba dos veces lo compartido. Los conteos y los agregados de GeoServer reciben
la unión como `MULTIPOLYGON`, con sus huecos interiores.

### Corregido

- El botón del InfoBox para descargar el mapa de la selección tenía fondo blanco; ahora es igual a
  los demás de esa barra.
- «Mis mediciones»: el bote de borrar todo va en rojo y alineado con el engrane y la X, y el menú
  del engrane usa el encabezado de `PanelHoja`, sin divisores y con el `Checkbox` de siempre.

## [1.190.0] - 2026-09-23

### Agregado: mediciones sobre el terreno en la vista 3D

**Herramientas → Mediciones** ya no saca a 2D. En 3D el panel sale en el mismo lugar y con los mismos
botones que el de 2D, y mide con clics sobre el relieve:

- **Punto**: altura sobre el nivel del mar.
- **Distancia**: en línea recta, como en 2D, y además **siguiendo el terreno**, con la subida y la
  bajada acumuladas y las alturas máxima y mínima.
- **Área**: vista desde arriba y **sobre el relieve**, más el perímetro.
- **Perfil de elevación** de la línea: al recorrerlo, un punto se mueve sobre la ruta en el mapa.

Las alturas se leen de los tiles de `raster:elevacion_terreno_rgb` a zoom 12 (unos 38 m por píxel)
y no de `queryTerrainElevation`, que las da multiplicadas por la exageración y con la resolución del
zoom en pantalla: así el resultado es el mismo desde cualquier ángulo. Las medidas planas salen de
`ol/sphere` y se formatean con los helpers de 2D. Mientras se mide, el clic no abre el InfoBox.

### Cambiado: la pastilla de ajustes del 3D va vertical, en paralelo con la de zoom

Los deslizadores se abren a la derecha de cada anillo.

## [1.189.0] - 2026-09-23

### Cambiado: los lados del comparador se llaman α y β

Las letras A y B se sustituyen por **α** y **β** en todo lo que el usuario ve: las letras del handle,
los overlays gigantes al resaltar, los botones de lado de las capas comparadas, los tooltips de las
píldoras de fecha y los del loop. El modelo no cambia —`paneA`, `paneB` y `activeSlot` siguen
llamándose igual—, sólo la etiqueta, que sale de `slotLabel()` en `swipeTheme`. Una A latina junto a
una capa llamada «Agua» se leía como parte del nombre; α no se confunde con nada.

### Cambiado: el panel de capas comparadas usa el mismo cascarón que capas activas

Fondo `#F9FBFF`, esquinas de 10 px y el mismo `box-shadow`; el encabezado pasa a `<h3>` de 18 px en
negrita con un icono de 32 px a la izquierda, igual que «Capas Activas». El icono es nuevo
(`ico_capas_comparadas.svg`): la pila de capas de siempre partida por la línea naranja del divisor.

### Cambiado: la barra del comparador se queda con dos botones

Sólo el de lista y el de orientación. El nombre de la capa y las dos píldoras de fecha salen de la
barra: las fechas ya viven en cada fila del panel, una por lado, y desde ahí abren su periodicidad.

### Cambiado: el panel de periodicidad pierde la franja de color

Se va el borde superior morado o naranja, y la X y el bote de basura suben a la esquina superior
derecha del panel en vez de competir por la fila del título, donde se envolvían cuando el nombre era
largo. Los dos reutilizan los iconos que ya existen (`cerrarModal`, `eliminar`) en vez de un SVG
dibujado a mano.

### Eliminado: el acceso al catálogo en la orilla del sider

`CatalogoSiderButton.jsx` sale de `SiderEdgeButtons`: el catálogo ya vive en Herramientas desde la
1.186.0 y el botón de la atribución sigue. Entró en el commit `4d5cb57`.

## [1.188.1] - 2026-09-23

### Corregido: la animación de fechas regresaba al año por defecto

- **El loop arranca desde la fecha seleccionada**, no desde el año más reciente. Sin fecha, aplica el
  primer valor en el acto para que la píldora y el mapa coincidan.
- **Reanudar ya no vuelve al año anterior**: si la fecha cambió durante la pausa, o la vista pide otro
  año, el loop arranca de nuevo. Todo play pasa por `toggleLoop(layerId, vista, slot)`; el modal, la
  barra del comparador y catálogo ya no deciden por su cuenta.
- Clicar un mes detiene el loop mensual. En raster mensual, cambiar de año conserva el mes o toma
  el último.
- El play de la píldora aparece aunque la periodicidad llegue tarde.

### Corregido: periodicidad en el comparador

- El loop pertenece al lado donde arrancó y se puede iniciar en el lado inactivo. Salir del
  comparador lo pausa.
- La fecha por defecto de un raster se aplica en los dos lados (`useRasterDefaultDate`) y no se
  reaplica al cambiar de lado.
- Varias fechas aplicadas al lado activo en el mismo lote ya no se pisan.
- «Limpiar fecha» detiene el loop y «volver a años» ya no pausa el loop del otro lado.
- El año abierto en el modal cuenta por lado.
- El enlace compartido guarda el loop con su velocidad, dirección, año y lado, y restaura velocidad
  y dirección. Salir de un comparador abierto desde un enlace ya no restaura el estado de otra sesión.

### Corregido: periodicidad en catálogo

- `?fecha=` se aplica al abrir y los rasters se comparten con su fecha.
- El loop raster manda TIME y espera a que cargue la imagen.
- El año abierto se reinicia al cerrar el panel o cambiar de capa, y cambiar rápido de capa ya no
  mezcla periodicidad ni geometría de la anterior.
- La leyenda y la descarga usan el mismo filtro que el mapa, y los polígonos admiten un solo mes.

## [1.188.0] - 2026-09-23

### Agregado: las capas de puntos se dibujan de pie en 3D

En la vista 3D los puntos ya no van pegados al terreno —donde la perspectiva los aplastaba y las
laderas los deformaban—: cada icono se dibuja **de pie, al ras del terreno y de frente a la cámara**
(`icon-anchor: bottom`, `icon-pitch-alignment` e `icon-rotation-alignment: viewport`).

- **Los iconos son los que ya dibuja GeoServer.** Cada regla de la leyenda en JSON trae en
  `Point.url` una imagen lista: el SVG original o un PNG que GeoServer renderiza para las marcas
  (`/kml/icon/...`). Nada se redibuja en el cliente. La URL trae el host interno y se reescribe a la
  ruta pública.
- **Las reglas se traducen a un `match`** (`billboardRules.js`): en el catálogo son igualdades sobre
  un campo, `IS NULL` o sin filtro.
- **Una fuente por entrada fusionada del WMS**, con su filtro CQL combinado: las 33 subcapas de
  unidades de salud se piden de una vez.
- **La capa WMS drapeada se oculta** cuando todas sus subcapas ya están de pie, para no dibujar cada
  punto dos veces.
- Se extrajeron `fetchLayerData` y `useOlWmsRevision`, que ahora comparten columnas y puntos.

## [1.187.0] - 2026-09-23

### Corregido: la configuración de mediciones no se veía

El panel se montaba en el `body` con `createPortal` y sin posición: sus clases solo daban fondo y
sombra, y el `anchorRef` del botón solo servía para detectar clics afuera. Se abría al final del
documento, fuera de la vista. Ahora usa `Panel`, anclado al botón.

### Agregado: eliminar todas las mediciones

«Mis mediciones» suma un botón para borrar todas las mediciones y anotaciones, con confirmación. La
función (`clearDrawings`) ya existía, pero en el visor nadie la llamaba; solo el catálogo.

### Cambiado: la imagen de Selección

- El polígono que define la selección ya no se imprime: su relleno teñía los colores de la capa.
- El ancho de la imagen sigue la proporción del polígono, entre 0.6 y 2.2 veces el alto, para no
  dejar franjas blancas a los lados.
- El conteo distingue «No aplica», para una capa sin WFS, de «Sin dato», cuando la consulta falla.
- En Selección no se dibujan las cruces de la retícula, que quedaban sueltas sobre el blanco.
- El bloque Selección sube junto a la leyenda; el espacio libre queda antes del mapa de ubicación.

### Corregido: espacios dobles entre palabras en la imagen

Las fuentes Garet usan `font-display: optional`: si no cargaban a tiempo, `html2canvas` medía las
palabras con la fuente de respaldo y las pintaba con Garet. Ahora se cargan los cuatro pesos antes de
capturar.

### Agregado: contar por clase dentro de la selección

El selector de cada leyenda suma «Contar por clase» con los campos de texto de la capa, sin las
claves. La imagen muestra las cinco clases con más elementos dentro del polígono y junta el resto en
«Otras». Lo calcula GeoServer con `gs:Aggregate` agrupando por el campo. Cuenta elementos, no
superficie: `gs:Aggregate` no calcula áreas.

## [1.186.0] - 2026-09-23

Pide mariachi 2.97.0: sin él, las propuestas con título fijo o con párrafos de texto fijo se rechazan.
Se despliega mariachi primero.

### Agregado: el editor de tarjetas del catálogo es un lienzo

El editor ciudadano (`/catalogo`, fuera de producción) deja de ser tres zonas de arrastrar y soltar y
pasa a ser la tarjeta misma, como el de mariachi: se toca el título o un bloque y se edita al lado.

- **Título** con cuatro modos: un campo, un texto fijo, campos combinados o sin título.
- **Bloques** Cifras, Detalles y hasta tres de Texto, que se agregan, quitan y reordenan con ▲▼.
  Cada fila elige campo, combinación de campos (con separador) o, en Texto, un párrafo fijo.
- **Opciones por fila**: solo el año; en Cifras, unidad, decimales y sumar campos combinados.
- **Deshacer, rehacer y Restaurar**, y hasta cinco registros de ejemplo para ver la tarjeta con datos
  distintos.
- Controles copiados de sieej (input de 40 px, botones píldora, chips con anillo naranja) y errores
  como descripción junto al campo, sin cajas de aviso.

Lo que el ciudadano no edita —etiquetas de color, íconos con texto, columnas de cifras,
transformación del título y links— **se conserva**: la propuesta solo lleva título, Cifras, Detalles
y Texto, y `helpers/tarjetaFusion.js` la fusiona sobre la tarjeta vigente igual que el backend, así
que la vista previa es lo que quedará publicado. Los bloques fijos conservan su posición al
reordenar. El texto libre no admite links, correos ni teléfonos, con la misma expresión que valida
mariachi.

### Agregado: tabla de datos en el catálogo

Botón debajo de mediciones que abre la misma ventana flotante del visor para la capa del catálogo.
`useCatalogoTabla` le da a la tabla el `MapsContext` que espera a partir de la capa seleccionada, y
`useCatalogoTiempo` pasa a manejar varios filtros: la fecha más los de la tabla (`tabla` y
`seleccion`), combinados con `AND` en el `CQL_FILTER` del WMS y en la consulta por polígono. El clic
en una fila abre la tarjeta del catálogo. En el catálogo la ventana no se acopla, porque el mapa no
cambia de tamaño, y guarda su estado aparte (`mapalab.catalogo.tabla.estado`).

`TablaAtributosProvider` acepta `tablasFijas`, `llavePersistencia` y `acoplable`; en el visor nada
cambia.

### Agregado: el Catálogo en Herramientas

Tarjeta BETA en el menú de herramientas del visor que lleva a `/catalogo`, fuera de producción como
los otros accesos.

### Cambiado: el botón de información del catálogo va junto a la lupa

Sale de la atribución y entra a la barra de búsqueda. La barra pasa a `CatalogoSearchInput` para que
`CatalogoSearchModal` baje de 300 líneas. El aviso de la primera visita se oculta solo a los ocho
segundos, para no quedar encima de los modales.

### Eliminado

`CatalogoInfoBoxZone.jsx` y `helpers/infoboxDraft.js`, reemplazados por `components/tarjeta/` y
`helpers/tarjetaModelo.js`.

## [1.185.0] - 2026-09-23

### Cambiado: los controles de la barra del comparador

- **Un botón de lista** a la izquierda del de orientación abre las capas comparadas. Antes el blanco
  era la barra entera, que se comía el clic en cualquier hueco y no se veía como algo pulsable.
- **Botones circulares A y B** en lugar de casillas para prender cada lado, con el color del slot
  cuando están activos y el gris de `#EFF3FC` cuando no.
- **El switch A/B sale de la barra.**
- **La X de cerrar pasa al costado derecho de la barra.** Arriba quedaba justo donde se despliegan
  los paneles: con las capas comparadas abiertas, `elementFromPoint` devolvía una fila y la X no se
  podía pulsar.

### Corregido: las filas del panel se alinean con el item de capas activas

Verificado en el navegador contra el item real, no a ojo:

| | Antes | Ahora |
|---|---|---|
| Alto | 48 px | 50 px, el del item colapsado |
| Hover | borde `#70308A` | borde `#EAEFFA`, como el item |
| Selección | `border-[#70308A]` | `border-transparent` + `ring-1 ring-[#70308A]` |

La tipografía ya coincidía: 14 px, peso 500, `#465055` en Garet.

## [1.184.0] - 2026-09-23

### Agregado: atajo para descargar el mapa desde la selección

La tarjeta de una selección por polígono suma un botón debajo del de descarga de datos. Abre el panel
de descarga con la vista **Selección** ya elegida, lista para bajar la imagen recortada a ese
polígono. En móvil entra a la misma lista de acciones. Con el mapa en 3D no hace nada, porque ahí esa
vista no aplica.

El aviso entre la tarjeta y el panel va por `helpers/descargaSeleccion.js`, un emisor mínimo al que
el panel se suscribe: no agrega estado al contexto del mapa.

## [1.183.0] - 2026-09-23

### Eliminado: los controles A/B salen del item de capa

El item del panel de capas activas deja de llevar dos controles que decían cosas distintas con la
misma letra. Los dos se fueron a la barra del comparador, donde los lados ya viven:

- **La píldora `<SlotBadge>`** —que ciclaba `A → AB → B` en tres pasos, con el estado escondido en
  el ciclo— la reemplazan las dos casillas de `<PanelCapas>`, una por lado. El componente se elimina.
- **El `<Switch>` A/B** de la barra de acciones se repetía en cada capa con membresía `AB`, pero
  `activeSlot` es uno solo para todo el comparador. Pasa a ser un único switch en la barra, que sigue
  gobernando lo que se muta desde el sider —opacidad, visibilidad, filtros— y a qué lado entra una
  capa nueva del catálogo.

Con la píldora fuera, `<LayerDateControls>` se queda sólo con fechas y controles de animación, y
`<ActiveLayerItem>` ya no calcula `hasAnyDateLabel`, que existía únicamente para decidir en qué fila
montar la píldora.

## [1.182.0] - 2026-09-23

### Corregido: una capa teselada tumbaba la vista 3D entera

`TileWMS` expone `getUrls()` en plural y `ImageWMS` `getUrl()` en singular. El reflejo de capas
llamaba el singular para todas, así que al activar una capa con `tiled: true` —cultivos, por
ejemplo— lanzaba `getUrl is not a function` dentro del render y React Router mostraba su pantalla
de error. El síntoma parecía otro: «la capa no se ve». Afectaba a toda capa teselada. Cubierto por
prueba en `map3dSync.test.js`.

### Cambiado: el clic en 3D abre el InfoBox de siempre

En 3D los clics se los quedaba MapLibre y nunca llegaban a OpenLayers, así que no salía la
tarjeta. Ahora la coordenada del clic sale de MapLibre y la consulta la resuelve `queryFeatures`
sobre el mapa de OpenLayers, igual que en 2D, con la tarjeta en el punto del clic. **Se retiró el
popup propio de las columnas**: el InfoBox trae más información y es el que ya se conoce.

### Corregido: el botón de órbita medía menos que los anillos

Pasa a 34 px, como los anillos de la pastilla.

## [1.181.0] - 2026-09-23

### Cambiado: la barra del comparador se vuelve el control del comparador

Las dos píldoras de fecha se van a las orillas de la barra, cada una del lado de su mitad del mapa,
y el nombre de la capa queda al centro.

- **La fecha de un lado** abre `PeriodicitySection` anclado a esa mitad, con el color del lado en el
  borde superior. Es el mismo componente que usa el catálogo en `CatalogoTimeBar`, y ya recibía
  `slot` y `loopAppliesToSlot`: elegir un año o un mes afecta sólo a ese lado, y su animación
  tampoco cruza.
- **Las capas comparadas** son una fila por capa con la forma
  `[casilla A] (fecha A) nombre (fecha B) [casilla B]`. Las casillas prenden y apagan la capa en cada
  lado —lo que antes hacía la píldora A|B ciclando en tres pasos— y cada fecha lleva al panel de
  periodicidad de su lado. La casilla del único lado que queda va deshabilitada: vaciar los dos
  lados se sigue haciendo con eliminar, en el panel de capas activas.

Antes las píldoras abrían el modal de detalle completo —descripción, fuentes, descargas y
numeralia— para acabar cambiando un mes.

### Cambiado: la X del comparador sale de la barra

Deja de colarse dentro de la píldora cuando no había fechas y vive siempre afuera, sobre la barra,
con el fondo blanco y el rosa en hover de las demás herramientas del mapa (`tone="herramienta"`).

### Agregado: `useSlotPeriodicity`

El cableado por slot que vivía suelto dentro de `LayerDetailModal` —aplicar y limpiar el filtro de
un lado, resolver si su loop puede correr y arrancarlo en el slot correcto— pasa a un hook. La barra
lo consume tal cual; el modal sigue con el suyo hasta que se le migre.

### Cambiado: `Checkbox` y `CloseButton` aceptan variante

`Checkbox` recibe `color` (morado por defecto) para poder pintarse con el color de su slot, y
`CloseButton` recibe `tone`. Ambos siguen igual donde no se les pasa nada.

## [1.180.0] - 2026-09-22

### Cambiado: la órbita es un play/pausa en la pastilla, y el terreno y el cielo van siempre puestos

El panel de interruptores duró una versión. **Terreno** y **cielo y neblina** no eran decisiones que
el usuario quisiera tomar —se quieren siempre— así que ahora se encienden solos y desaparecen de la
interfaz. La **órbita** se queda, pero como botón de play/pausa en la propia pastilla, con los
iconos y el tamaño del loop de periodicidad.

La órbita gira 8° por segundo contados **por tiempo y no por cuadro**, así que va igual en una
pantalla de 60 Hz que en una de 120.

## [1.179.0] - 2026-09-22

### Agregado: la barra del comparador nombra la capa que estás comparando

Entre las dos píldoras de fecha aparece el nombre de la capa seleccionada, truncado a 220 px —110 en
móvil— y con el mismo clic que las fechas: abre el detalle de capa. Antes la barra decía dos fechas
sin decir de qué. El nombre sale **una vez** porque `selectedLayerForSymbology` es una sola capa
compartida entre los dos lados; lo que difiere entre A y B es su fecha, no la capa.

### Cambiado: las letras A y B del handle dejan de ser pastillas

Pierden el fondo de color y pasan a ser la letra sola, en el color de su lado, con una sombra blanca
de 1 px para leerse sobre cualquier mitad del mapa. Rellenas competían por atención con el propio
handle naranja, que es lo que se arrastra.

## [1.178.0] - 2026-09-22

### Agregado: suma y promedio de un campo dentro de la selección

En el panel de descarga, con la vista Selección, cada leyenda marcada muestra debajo un selector con
los campos numéricos de esa capa. Al elegir uno, la imagen agrega dos renglones bajo el conteo de esa
capa: la suma y el promedio de ese campo dentro del polígono. Los nombres salen con el alias de la
tabla de atributos.

El cálculo lo hace GeoServer con `gs:Aggregate` contra su propio WFS, con el mismo filtro
`INTERSECTS(..., SRID=3857;...)` del conteo. Medido con datos reales: 4 200 elementos en dos
segundos, y su `Count` coincide con el conteo que ya mostrábamos. Mientras el selector diga «Sin
estadística» no se consulta nada, así que no gasta del límite de ejecuciones de WPS.

El motor de estadísticas del backend quedó fuera a propósito: saca el esquema y la tabla de la
configuración de numeralia de cada capa, y hoy ninguna capa la tiene dinámica; usarlo exigiría
capturar esa configuración capa por capa en el CMS.

La lista de leyendas se movió a `LegendPicker`, que es donde vive el selector.

## [1.177.0] - 2026-09-22

### Agregado: sol, cielo, altura de columnas, terreno y órbita

Cinco controles más para la vista 3D, junto a inclinación y relieve:

- **Sol**: dirección de la luz del sombreado, en anillo con el rumbo (`N`, `NE`, `NO`…). Cambia
  por completo cómo se leen las sierras.
- **Altura de las columnas**: escala de ×0.5 a ×3 lo levantado, para comparar sin que la zona
  metropolitana aplaste al resto. El anillo solo aparece cuando hay una capa levantada.
- **Terreno**, **cielo y neblina** y **órbita**: interruptores detrás del botón de ajustes de la
  pastilla. Sin terreno quedan las columnas sobre el plano; la órbita gira alrededor del centro
  para presentaciones.

### Cambiado: los controles del 3D, con el norte de la exportación y anillos de ajuste

- **Norte independiente.** El `ico_n.svg` que ya lleva la imagen exportada, arriba de la pastilla de
  zoom, sin fondo y centrado sobre ella. Gira con el rumbo del mapa y al hacer clic vuelve al norte.
- **Pastilla del 3D.** Al lado del botón 3D y a su misma altura, con un anillo por ajuste: el borde
  muestra cuánto está puesto y al hacer clic abre su deslizador, como la opacidad del panel de capas
  activas. Ya no va la barra fija con los sliders siempre abiertos.
- **El tooltip del botón 3D explica cómo mover el mapa**: arrastrar, rueda, clic derecho y
  Ctrl+arrastrar, y abajo los gestos de celular.
- **La barra de escala vuelve a salir en 3D.** La cámara de MapLibre se escribe en la vista de
  OpenLayers en cada `moveend`, así que la escala, la sesión y el enlace compartido siguen al 3D. En
  perspectiva el valor es el del centro de la cámara: aproximado por construcción.

### Corregido: el borde de Jalisco ya no cuelga picos

Fuera del estado el DEM venía sin datos y MapLibre lee un pixel transparente como 0 m, así que el
borde dentado colgaba un fleco hasta el nivel del mar. El terreno ahora viene relleno desde sextante
2.11.0 y encima se dibuja el límite estatal con una línea blanca de 3 px. **Se quitó la máscara
sólida de 1.175.0**: tapaba el mapa base alrededor del estado, que sí se quiere ver.

## [1.176.0] - 2026-09-22

### Cambiado: las letras A y B del comparador se minimizan junto al handle

Los paneles gigantes con la letra del lado ya no son un estado en el que el comparador se queda:
aparecen al entrar, y cuando el resaltado termina la letra viaja hasta el handle y se queda ahí
como una pastilla, dejando `A <> B` sobre la barra naranja. Así se sigue sabiendo qué lado es cuál
sin tapar el mapa. La geometría del viaje vive en `minimizeTransform` y respeta la orientación y la
posición del handle.

### Corregido: el resaltado A|B se quedaba encendido al pasar una capa a los dos lados

La píldora `<SlotBadge>` encendía el resaltado al hacer click y solo lo apagaba con el `mouseLeave`,
pero el cambio de membresía remonta el botón, así que ese evento nunca llegaba y los dos paneles se
quedaban tapando el mapa. El apagado automático pasa a `highlightSlots`, en el hook que es dueño del
estado, donde ningún remonte lo cancela.

### Corregido: el 3D ya no cierra la comparación por sorpresa

El botón **3D** y el de levantar capa se dibujaban durante el comparador, y al pulsarlos entraban a
3D llamando a `exitCompareMode`: la comparación se descartaba sin la confirmación que sí pide el
botón de cerrar. Ambos se ocultan mientras el comparador está activo; el camino inverso, salir de 3D
al entrar a comparar, ya estaba cubierto.

## [1.175.0] - 2026-09-22

### Cambiado: el 3D se descarga con la herramienta de siempre y su barra se simplifica

La vista 3D ya no tiene su propio botón de descarga ni saca al usuario a 2D para exportar: el mapa
de MapLibre se monta **dentro** del contenedor del mapa de OpenLayers, así que `Descargar` lo
captura como a cualquier otra vista, con su título, leyendas y formatos. En 3D la única vista
posible es **Área** —«Jalisco» y «Selección» dependen del extent de OpenLayers— y la captura espera
al `idle` de MapLibre además del `rendercomplete` de OpenLayers.

### Cambiado: el estado se lee como un bloque y los controles se homologan

- **Contorno de Jalisco.** Todo lo que queda fuera del límite estatal se cubre con una máscara
  sólida y el límite se dibuja con una línea blanca de 3 px. Antes el canto del terreno mostraba el
  mapa base estirado sobre la pendiente y el borde se veía sucio. La máscara sale de
  `general:limite_estatal` por WFS, una sola vez.
- **Botón 3D.** Igual que zoom y encuadre: sin fondo, y con el fondo morado solo cuando está
  activo.
- **Inclinación y relieve** pasan a un popover detrás de un botón, como la opacidad del panel de
  capas activas, en vez de ir siempre visibles.
- **Brújula** aparte de la pastilla y más grande, con los estilos del botón de descarga.

## [1.174.0] - 2026-09-22

### Agregado: la imagen de la vista Selección trae estadísticas

El panel lateral suma un bloque **Selección** con el área y el perímetro del polígono y, por cada
capa cuya leyenda esté marcada, cuántos de sus elementos caen dentro y su densidad por km².

El conteo se le pide a GeoServer con `resultType=hits`: una petición por capa que no descarga ni un
elemento y que respeta el filtro activo de esa capa. El polígono viaja como
`INTERSECTS(geom, SRID=3857;POLYGON(...))`: los datos están en EPSG:6368 y sin el SRID el filtro
devuelve cero. Un polígono a mano alzada se simplifica hasta 120 vértices y la consulta va por POST,
para no chocar con el límite de la URL.

Las capas sin WFS, como los rásteres, salen con un guion. Si una consulta falla o tarda más de 8
segundos, la descarga sigue sin el bloque: las estadísticas nunca detienen la imagen.

## [1.173.1] - 2026-09-22

### Cambiado: el botón 3D se queda visible y deshabilitado sin WebGL2

Antes, un navegador sin WebGL2 no veía **nada**: ni el botón 3D ni el cubo de las tarjetas, sin
explicación. Pasó en una máquina sin aceleración de gráficos y parecía que la función no se había
desplegado. Ahora el botón se muestra deshabilitado con el motivo en el tooltip; el cubo sigue
oculto, porque el botón ya lo explica una vez.

El contexto distingue los dos casos con `present`: fuera del proveedor —el embed y el catálogo— no
se dibuja nada, como antes.

## [1.173.0] - 2026-09-21

### Agregado: vista 3D del mapa

Botón **3D** en la pastilla de controles, entre encuadrar y alejar. Cambia el mapa a MapLibre GL
con el relieve real de Jalisco y conserva centro, zoom, mapa base y capas activas; al volver a 2D la
cámara regresa a OpenLayers. Solo aparece si el navegador tiene WebGL2.

- **Terreno** del DEM de sextante (`raster:elevacion_terreno_rgb`, 15 m), servido por el WMTS de
  GWC con la altura en RGB (`R*256+G`, `encoding: 'custom'`). El sombreado sale del mismo DEM.
- **Las capas WMS se reflejan tal cual**: se leen del mapa OL (`mergedLayers` + `getParams()`), así
  que filtros, `TIME`, `ENV`, opacidad y orden son los mismos que en 2D. Hexbin y capas vectoriales
  se pasan con el color de su estilo.
- **Barra 3D** junto a los controles: brújula, inclinación (0–80°), exageración del relieve (×1–×5)
  y descarga de la imagen 3D. La escala se oculta en 3D.
- **Cubo en la tarjeta de la capa** para levantarla en columnas. Aplica a polígonos con WFS y a
  hexbin. La altura es proporcional al valor y el color sale de las reglas del SLD
  (`GetLegendGraphic` en JSON); si no se pueden leer, por cuantiles. Con más de 20 000 elementos no
  se levanta. En 2D, el cubo entra a 3D y levanta la capa de un clic.
- **URL**: `vista=3d`, `inclinacion` y `extruir` se escriben al vuelo, así que un enlace copiado
  abre igual.
- Medir, anotar, comparar y descargar regresan a 2D antes de abrirse.

MapLibre (6.10) va en su propio chunk y en carga diferida: la vista inicial no descarga nada nuevo.
Su worker se empaqueta con `?worker&url` y se sirve del mismo origen, por eso la CSP de
`index.html` pasa a `worker-src 'self' blob:`.

**Requiere sextante 2.10.0** (la capa `raster:elevacion_terreno_rgb`). Sin ella el 3D abre sin
relieve.

## [1.172.2] - 2026-09-21

### Corregido: Seleccionados salía recortado y las coordenadas del borde, descentradas

La vista del mapa redondea la resolución al zoom más cercano (`constrainResolution`), así que
asignarle la resolución calculada podía acercar la imagen y cortar el polígono arriba y abajo.
Seleccionados ahora encuadra con `view.fit(..., { nearest: false })`, que elige el zoom que deja
entrar el polígono completo, y la composición usa el extent realmente capturado para las
coordenadas, la escala y el minimapa.

Las etiquetas de coordenadas se centraban en franjas de 10 y 40 px de alto y 8 px de ancho, cuando
el margen alrededor del marco es de 27 px arriba y abajo y 23 px a los lados: las de arriba y la
izquierda quedaban pegadas al borde de la imagen y las de abajo y la derecha, al marco. Cada franja
mide ahora lo mismo que su margen, en todas las descargas.

### Cambiado: la opción se llama Selección, se oculta sin polígono y sin nota bajo la vista

Seleccionados pasa a **Selección** para que quepa en el Segmented, y se quita la línea de ayuda que
iba debajo de la vista: cada opción se explica con su tooltip. Sin polígono, o en el comparador, la
opción ya no aparece deshabilitada: se oculta.

## [1.172.1] - 2026-09-21

### Corregido: el respaldo de fechas de 1.171.1 nunca se activaba

Buscaba `timeEnabled` en el nodo del arbol, pero el backend lo entrega dentro de `wmsConfig`. La
condicion salia falsa para toda capa y `nddi` seguia sin periodicidad. Las pruebas pasaban porque su
dato ponia `timeEnabled` donde el arbol real no lo pone; ahora usan la forma real, y contra la
GetCapabilities de GeoServer el respaldo devuelve los doce meses de 2025 de `nddi`.

## [1.172.0] - 2026-09-21

### Agregado: descargar solo lo seleccionado

Descargar mapa suma la vista **Seleccionados**. Toma el último polígono visible dibujado con «Medir
área y seleccionar» y descarga solo su interior; lo de afuera queda en blanco. Lo encuadra completo
aunque su forma no tenga la proporción de la imagen, y durante la captura pone una capa blanca con el
polígono como hueco, encima de todo, así la escala del mapa no queda tapada. Sin polígono, o en el
comparador, la opción aparece deshabilitada con un tooltip que explica por qué.

### Cambiado: Descargar, Compartir y Vista por municipio, homologados

Los tres paneles comparten contenedor y encabezado (`PanelHoja`) y pestañas (`Segmented` con
`variant="panel"`, que además acepta opciones deshabilitadas). En Descargar, formato y vista pasan
de botones a pestañas —primero formato, luego vista y después la calidad—, se quitan los títulos de
sección y la leyenda va en tarjeta blanca. Todos los controles de los tres paneles llevan tooltip.

## [1.171.1] - 2026-09-21

### Corregido: un raster con TIME ya no depende de que alguien capture sus fechas

El selector de fechas de una capa raster leia solo `raster_periodicity` del catalogo, una columna
que el editor de mariachi no expone: las dos capas que la tienen la recibieron por seed. Una capa
nueva publicada como ImageMosaic —`nddi`— salia sin selector aunque GeoServer anunciara sus doce
meses en la dimension `TIME`.

Al cargar el arbol, las capas con `timeEnabled` y sin periodicidad en el catalogo la toman de la
GetCapabilities del workspace, con `getLayerTimePeriodicity`, que ya usaba la pagina de catalogo y
cachea por workspace. Lo capturado en el catalogo sigue ganando. Corre despues del primer pintado,
asi que no retrasa el arranque, y si GeoServer no responde el arbol queda como estaba. Las capas
vectoriales quedan fuera aunque tengan `timeEnabled`.

El detalle de capa recalcula la definicion cuando el arbol se completa; antes la congelaba al abrir
y, si las fechas llegaban despues, el bloque de periodicidad no aparecia hasta reabrirlo.

## [1.171.0] - 2026-09-11

### Agregado: la tarjeta del marcador embebido la define el sitio que embebe (widget 1.5.0)

- `<iieg-mapalab>` gana `marker-card`: un JSON con chips, filas, contacto y cifras que el visor
  pinta con los bloques del InfoBox (`labelGroups`, `list`, `iconText`, `cards`). El sitio es
  dueño del contenido y lo cambia sin desplegar MapaLab; el visor no consulta ningún dato propio
  para armarla. Saneado por campo: topes por bloque, textos recortados, iconos de una lista,
  `href` solo `https:`, `http:`, `tel:` y `mailto:`, y `"@visor"` como único valor especial (el
  enlace al visor completo, que ya armaba la marca del embed). Más de 4 KB o JSON ilegible se
  ignora y el pin conserva la tarjeta de título y descripción. `order` fija el orden de los
  bloques y `open` abre la tarjeta al cargar.
- Las filas del InfoBox admiten `**negritas**`; ningún otro markdown.

### Cambiado: el InfoBox embebido se arrastra desde la tarjeta y pierde «centrar selección»

- En `/embed` la tarjeta se toma de cualquier parte para moverla (umbral de 4 px, así que los
  enlaces siguen respondiendo al clic) y desaparece el botón de centrar, que en un mapa de una sola
  sede no aporta. El visor completo no cambia.

## [1.170.0] - 2026-09-10

### Agregado: simulador de pantallas en la etiqueta `dev`

El popover de la etiqueta `dev` suma «Simular pantalla», un segmented con Real, 390, 768, 1280 y
1920: móvil, tablet, laptop y escritorio, uno dentro de cada rango de breakpoints del visor. Al
elegir uno, la app se abre en un marco de ese ancho sobre un fondo gris, con el mismo segmented y
una X arriba; Escape también sale.

Es un marco y no una vista achicada a propósito: dentro del iframe, `window.innerWidth` y
`matchMedia` miden el marco, así que cambian igual las clases `md:`/`lg:` de Tailwind que
`MOBILE_BREAKPOINT` y `TOOLS_COMPACT_BREAKPOINT`. Si la pantalla no cabe, se reduce con `scale` y la
barra dice a qué porcentaje; el ancho que ven las media queries no cambia. Cambiar de ancho no
recarga el marco.

La elección vive en `devToolsStore`, en `sessionStorage`, y sobrevive a recargar. Dentro del marco
no se ofrece el simulador, para que no se anide. «Ver como producción» y «Panel de analítica» se
sincronizan ahora entre ventanas del mismo origen con el evento `storage`, así que el switch del
visor de afuera llega al de adentro.

El CSP de `index.html` no admitía iframes del mismo origen. `frame-src` recibe `'self'` solo cuando
`VITE_APP_ENV=dev`, a través del mismo plugin que ya reemplaza `__ACERVO_ORIGIN__`; beta y
producción se construyen con el CSP de siempre.

## [1.169.3] - 2026-09-10

### Corregido: «Ver como producción» no ocultaba el servicio vectorial

El switch de la etiqueta `dev` oculta en vivo todo lo que no sale a producción, pero el servicio
vectorial se decidía con `VECTOR_SERVICE_ENABLED`, una constante que se evaluaba una sola vez al
cargar el módulo. Con el switch encendido, el segmento de Puntos y Hexágonos seguía a la vista y un
mapa compartido restauraba sus capas en hexágonos.

Ahora `LayerServiceSegmented` lee el estado con `useIsNonProd`, y `useShareDeserializer` lo consulta
al aplicar el mapa compartido, así que los dos siguen al switch. La constante desaparece de
`serviceMode.js`.

## [1.169.2] - 2026-09-09

### Corregido: el catalogo y el embed reventaban al renderizar los controles del mapa

`Cannot read properties of undefined (reading 'left')` en cuanto se abria `/catalogo` o `/embed`: el
error boundary de React Router atrapaba el fallo y la ruta terminaba en la pantalla de error.

La causa es una linea de `AreaUtilContext`. El contexto se creaba con `SIN_MARGENES`
—`{ left: 0, right: 0, top: 0, bottom: 0 }`— como valor por defecto, que es el objeto de **margenes**,
no la forma del contexto. `AreaUtilProvider` solo envuelve a `Maps`, asi que en el catalogo y en el
embed los consumidores recibian ese objeto, destructuraban `{ margenes }` y obtenian `undefined`.
`MapControls` lee `margenes.left` para posicionarse, y ahi tronaba.

El `|| { margenes: SIN_MARGENES, acoplado: false }` de `useAreaUtil` estaba puesto justo para eso,
pero no podia funcionar nunca: `SIN_MARGENES` es truthy, asi que el fallback jamas se evaluaba. El
valor por defecto ahora trae la forma completa y ese guardia sobra.

`ScaleLineControl`, `MapAttribution` y `MapControls` se renderizan en las tres vistas —visor,
catalogo y embed— y solo la primera tiene el provider. Con el arreglo, las otras dos leen margenes en
cero, que es lo correcto: ahi no hay tabla acoplada que recorte el area util.

### Cambiado: el smoke test tambien vigila lo que atrapa el error boundary

Este fallo pasaba entero por debajo del smoke test, y por una razon que vale registrar: sus dos
señales son `#root` vacio y excepciones **sin capturar**. Un error de render que el boundary atrapa no
dispara ninguna: el boundary llena `#root` con la pantalla de error y la excepcion queda manejada.

Ahora el script tambien escucha la consola y falla si aparece el log del boundary. No sirve mirar la
pantalla de error en si: el smoke corre sin backend, donde esa misma pantalla es la respuesta legitima
a que no carguen las capas.

## [1.169.1] - 2026-09-07

### Corregido: dos guardas de la tabla de atributos existian pero nunca se aplicaban

`MAX_PAGINAS` y `ACOPLES` estaban declaradas y ningun codigo las leia. Salieron a la luz porque el
chequeo de codigo muerto bloqueo el push, y resultaron ser dos protecciones a medio cablear.

**El tope de paginacion.** `cargarMas` en `useTablaDatos` pedia paginas mientras
`filas.length < total`, sin limite. En una capa de cientos de miles de registros eso son cientos de
peticiones acumulando filas en memoria hasta tumbar la pestaña. Ahora `hayMas` respeta
`MAX_PAGINAS`: 200 paginas de 100 registros, veinte mil filas.

**El modo de acople.** `acoplar()` aceptaba cualquier cadena, y peor: el valor restaurado de
`localStorage` entraba directo a `useState` **sin pasar por ahi**, asi que un estado viejo o
manipulado quedaba como acople activo. La validacion vive ahora en `normalizarAcople`, en el helper
que ya tenia pruebas, y la usan los dos caminos.

### Cambiado: el chequeo de codigo muerto deja de marcar lo que si se usa

`knip.json` estrena `ignoreExportsUsedInFile`, que mariachi ya tenia: sin esa opcion, un export
consumido dentro de su propio archivo se reportaba como muerto. Eran 20 hallazgos, de los cuales 17
no eran codigo muerto.

`src/utils/infoboxPlan.js` queda exento: es **byte a byte identico** al `src/shared/infoboxPlan.js`
de mariachi, un modulo compartido por copia, y cada repo consume una mitad distinta de su API. Lo que
aqui sobra —`referencedFields`— alla se usa en nueve lugares. Sin la exencion, cada repo empuja a
borrar lo que el otro necesita.

`Cuerpo.jsx` dejo de redeclarar `new Set(['entero', 'decimal', 'moneda'])` y usa
`FORMATOS_NUMERICOS`, que ya existia para eso.

## [1.169.0] - 2026-09-07

### Agregado: la grafica del comparador se puede leer por municipio o por propiedad

La grafica de perfiles trazaba una sola lectura: una propiedad a la vez, con los municipios en el
eje. Servia para comparar municipios entre si, pero no para ver el perfil de uno solo.

Ahora el eje se conmuta. **Municipio** deja los municipios en el eje y elige que propiedad trazar;
**Propiedad** los invierte —las propiedades en el eje— y deja elegir **varias a la vez**, cada una
con su tono, para superponer municipios sobre el mismo perfil.

`DropdownPill` gana modo `multiple` para eso: casillas en las opciones, un resumen configurable en
la pastilla y un minimo de una opcion elegida, que impide dejar la grafica sin series.

La eleccion —vista, eje, municipios y propiedad por capa— **se guarda con el resto de la sesion del
panel**, asi que volver a abrirlo no reinicia la lectura.

El calculo de las series sale de los componentes a `comparadorSeries.js`, con pruebas propias: es
donde vivian los porcentajes nulos y el reparto de colores.

### Corregido: el boton de cerrar de una pastilla ya no exige tooltip

`PillCloseButton` siempre envolvia su boton en un `Tooltip`. Sin `tooltip` el envoltorio quedaba
vacio y seguia capturando el hover; ahora, si no hay texto, se renderiza el boton solo.

## [1.168.6] - 2026-09-07

### Cambiado: `docs/infobox.md` se pone al dia

Describia un InfoBox que ya no existe: `cardTemplates.js` y sus plantillas `TDEMEC*` —borradas—,
`SwipeToRemove.jsx`, un `renderCard` que decidia el formato, y un editor de mariachi hecho de
presets (`punto_ubicacion`, `punto_completo`) que el admin dejo de emitir.

Ahora documenta lo que hay: el paso de configuracion a **plan** con `infoboxPlan.js` y su copia
byte a byte en mariachi, los campos compuestos, las instancias multiples del mismo bloque, el
separador `; ` de las columnas multivalor, los tres modos del editor —Lienzo, Lista, JSON— y la
herencia de un grupo hacia sus propiedades, que se resuelve al construir el arbol y esta duplicada
en el job de dataengine.

Solo documentacion: no cambia una linea de codigo.

## [1.168.5] - 2026-09-04

### Corregido: el visor se caia al entrar por una variable usada antes de declararse

`TablaAtributosProvider` leia `guardado.modoPrevioSider` en un `useState` **una linea antes** de
declarar `guardado`. Es el error que tumbaba la pantalla completa con
`Cannot access 'c' before initialization`: como revienta durante el render del proveedor, se lleva
al visor entero, y minificado no dice ni el archivo ni la variable.

Lo encontro `eslint --rule no-use-before-define`, que no esta en la configuracion del proyecto.
Vale la pena prenderla: hoy reporta quince casos mas, casi todos dentro de funciones —donde son
inofensivos— pero es la unica red que atrapa este error antes de producirse.

## [1.168.4] - 2026-09-04

### Corregido: `Cannot access 'c' before initialization` al entrar al visor

`Icon` importaba `Tooltip` y `Tooltip` importaba `Icon`: un ciclo que estaba desde antes pero que no
molestaba hasta que el reparto de chunks cambio y el bundle empezo a evaluar `Tooltip` primero. Ahi
`Icon` queda a medio inicializar cuando se le llama, y la pantalla se cae entera con un
`ReferenceError` en pleno render.

El ciclo se rompe del lado barato: `Icon` ya no importa `Tooltip`. Su prop `tooltip` —que usaban tres
lugares en todo el proyecto— se cambio por `title`, y esos tres se envuelven con `Tooltip` ellos
mismos, que es como lo hace el resto del visor. **El proyecto queda sin ninguna dependencia
circular.**

## [1.168.3] - 2026-09-04

### Cambiado: el panel de datos usa el `Loading` del visor

Tres momentos que antes solo se anunciaban con texto ahora traen el mismo girito del resto de la
interfaz: la primera consulta —centrado, con la tabla todavia vacia—, el scroll que trae mas
registros y el conteo del pie mientras se recalcula.

## [1.168.2] - 2026-09-04

### Corregido: el sider compacto no se abria con clic, y no volvia a su modo

- **`toggleSider` y `closeSider` solo miraban si el dispositivo era movil**, no si el candado estaba
  en `mobile`. Con la tabla fijada el sider se veia compacto pero el clic no hacia nada: ahora
  cualquiera de las dos condiciones lo abre y lo cierra.
- **El modo previo del sider se guarda con el resto del estado**, asi que soltar o cerrar la tabla lo
  devuelve a como estaba aunque hayas recargado la pagina entre una cosa y otra. Antes vivia en una
  referencia en memoria y un refresco lo perdia: el sider se quedaba compacto para siempre.

## [1.168.1] - 2026-09-04

### Cambiado: la descarga de la tabla usa el mismo menu que el resto del visor

Se cambio el menu propio de 1.168.0 por `DownloadMenu` y `useLayerDownload`, que ya estaban
resueltos: los cinco formatos, los metadatos en TXT y XLSX, el guardado con el selector de archivos
del navegador, el progreso en bytes y el boton que cancela a medio camino.

Para que respete lo que muestra la tabla, el servicio de descarga aprendio dos opciones nuevas:
`cqlBase`, que impone el filtro de la tabla sobre el que calcularia por su cuenta, y
`propertyNames`, que recorta las columnas —en CSV las visibles, y sumando la geometria cuando el
formato la necesita—. Ambas son opcionales, asi que la descarga de capas y la del catalogo siguen
comportandose igual.

## [1.168.0] - 2026-09-04

### Agregado: descargar lo que muestra la tabla

Un boton en la barra de acciones del panel baja **los registros con los filtros puestos**, no la capa
completa: viaja el mismo CQL que arma la consulta —lo heredado, el municipio, los filtros por
columna y el recorte por pantalla si esta encendido—.

Dos formatos, a proposito: **CSV**, que es la tabla tal cual, y **GPKG**, que conserva tipos y
geometria en un solo archivo para quien se la lleva a QGIS. Se dejo fuera SHP porque trunca los
nombres de columna a diez caracteres y destroza los alias que se configuran desde mariachi.

Las columnas ocultas no viajan, con una casilla para incluirlas. En GPKG la geometria siempre se
suma aunque no sea una columna visible, porque sin ella el archivo no sirve; si no se pudo resolver
cual es la columna de geometria, se bajan todas antes que entregar un archivo roto.

## [1.167.2] - 2026-09-04

### Cambiado: el panel fijado ya no lleva borde de color

El borde morado marcaba la tabla activa cuando flota sobre el mapa, pero fijada al pie se leia como
una linea que partia la pantalla. Fijada va sin borde: el unico separador es el tirador del alto,
que ademas se atenuo para que se note al pasar el mouse y no antes.

## [1.167.1] - 2026-09-04

### Cambiado: los botones del selector de columnas se acortan cuando conviven

Con columnas ocultas y visibles a la vez salen los dos botones, y ahi dicen «Mostrar» y «Quitar» a
secas. Cuando solo cabe uno conservan su «todas», que es cuando la palabra aporta.

## [1.167.0] - 2026-09-04

### Agregado: el sider recuerda su candado, y la tabla afina sus menus

- **El candado del sider se guarda en el navegador.** Los cuatro modos de su boton —automatico,
  expandido, contraido y movil— sobreviven al refresco. Ademas de ser util por si mismo, es lo que
  hace que la tabla fijada conserve el sider compacto al recargar la pagina.
- **Las casillas de los menus ya responden al clic.** Estaban dentro de un boton, y un boton dentro
  de otro no recibe el clic: solo funcionaba la etiqueta. Ahora la fila entera alterna, casilla
  incluida, y responde a Enter y espacio.
- **«Quitar todas» junto a «Mostrar todas»** en el selector de columnas.
- **Se fue el boton de pausa**: el boton principal del recorte por pantalla ya prende y apaga el
  modo, asi que congelar dejo de tener boton propio.

## [1.166.0] - 2026-09-04

### Agregado: el sider se compacta al fijar la tabla, y la tabla recuerda su estado

- **Fijar la tabla pone el sider en su trato movil** usando el candado que el propio sider ya tiene
  (`lockMode = 'mobile'`, el cuarto estado de su boton). Al soltarla se restaura el modo que tenia
  antes. Es lo que se buscaba con el modo zen, pero por la puerta correcta: sin apagar la interfaz
  ni impedir que se abran los paneles.
- **La tabla recuerda su estado entre sesiones**, en `localStorage` y con version para poder
  invalidarlo: si estaba fijada y con que alto, cual pestana estaba viendose, y por capa sus
  filtros, su orden, las columnas ocultas y los registros seleccionados.

## [1.165.1] - 2026-09-03

### Corregido: fijar la tabla ya no bloquea los paneles, y la seleccion no se pierde

- **Fijar el panel dejo de encender el modo zen.** En zen el sider pasa a su trato movil y se cierra
  solo en cuanto no hay menus abiertos (`MapSider.jsx:127`), asi que abrir un panel era imposible.
  Fijar ahora hace exactamente lo que tiene que hacer: recoge el panel de capas activas, recoge el de
  descargas y cierra el sider **una vez**. De ahi en adelante todo se abre normal. El modo zen se
  queda para lo suyo, la vista previa de exportacion.
- **La seleccion de registros vive en el contexto**, no dentro de la ventana: cualquier remontaje del
  panel —cambiar de pestana, fijarlo, soltarlo— la conservaba a medias o la perdia. Ahora es estado
  por capa, como los filtros y las columnas ocultas.
- **La herramienta ya no se cierra sola** cuando la lista de tablas queda vacia un instante. Antes,
  cualquier parpadeo del arbol de capas la apagaba entera.

## [1.165.0] - 2026-09-03

### Corregido: la tarjetita de un grupo ahora si llega a sus propiedades

Una propiedad —hoja hija de un grupo— es un filtro CQL sobre el mismo feature type, asi que su
tarjetita deberia ser la del grupo cuando no tiene una propia. **No lo era.** `InfoBox` lee el
`littleCard` de la capa del clic y nada mas, sin recorrer ancestros, asi que una propiedad sin
tarjetita caia en la que `generateDefaultConfig` inventa de las propiedades del feature.

Y era peor que eso: el clic se resuelve por nombre de capa de GeoServer, que el grupo y sus
propiedades **comparten**, y `layerMap[layerName] = group[0].layer` se queda con la primera
activa. O sea que veias la del grupo o una inventada **segun el orden en que se encendieron las
capas**. No era herencia, era azar.

`_inherit_little_card` resuelve la propagacion **al construir el arbol**: quien no tiene tarjetita
propia recibe la del grupo ancestro mas cercano, mas un `inheritedFrom` con el id de ese grupo. El
visor no aprende ninguna regla nueva y el azar del `layerMap` deja de importar para la tarjeta.

**Es un espejo exacto de `_inherit_little_card` de `dataengine/jobs/run_refresh_layer_tree.py`,
que ya lo hacia.** Ahi estaba la divergencia: el cron de las 04:00 propagaba y el
`refresh-cache` de este backend no, asi que la tarjetita de una propiedad cambiaba segun quien
habia reconstruido el cache. Es justo el riesgo que `ecosistema/contratos.md` advierte sobre los
dos serializadores del arbol.

`_TREE_SCHEMA` sube a **3** para que los caches sin el campo se invaliden solos.

## [1.164.0] - 2026-09-03

### Agregado: el panel fijado se puede redimensionar, y la interfaz solo se recoge

- **Tirador en el borde superior** del panel fijado: se arrastra para darle mas o menos alto y el
  mapa cede exactamente lo mismo. Con tope de 180 px abajo y del 80 % de la pantalla arriba, para
  que nunca quede un panel inservible ni un mapa invisible.
- **Recoger no es bloquear.** Los paneles de capas activas y de descargas se recogen al fijar la
  tabla, pero se pueden volver a abrir: antes el de descargas se quedaba forzado mientras el panel
  estuviera fijo. Recoger todo es lo unico que hace el modo, como debe ser.
- **El modo comparar tambien cede el espacio**: el swipe vive dentro del mismo contenedor que el
  mapa, asi que sus dos paneles se encogen igual y reciben `updateSize()`.

Nota: el encuadre automatico no necesito cambios. Como el contenedor del mapa se encoge de verdad,
`map.getSize()` ya llega reducido y `getFitPadding` sigue calculando bien sin saber del acople.

## [1.163.0] - 2026-09-02

### Cambiado: el acoplado se queda solo con el borde inferior

Los tres bordes restantes chocaban con la interfaz —el sider a la izquierda, los paneles de capas
activas y descargas a la derecha—, asi que el acoplado se queda con el unico que no pelea con nadie.
Con eso, el gesto deja de ser lo unico que acopla: hay un boton fijo en el encabezado que fija y
suelta el panel, y se pinta encendido mientras esta fijo.

Al fijarlo, la interfaz se hace a un lado sola: el panel de capas activas y el de descargas se
recogen, y el visor entra en modo zen. Al soltarlo todo vuelve.

## [1.162.1] - 2026-09-02

### Corregido: el acoplado tapaba la interfaz, y ya se puede acoplar arriba

- **Faltaba el borde superior.** `zonaDeSnap` solo miraba abajo y los lados; ahora tambien detecta
  arriba, y el mapa cede alto por ese lado como lo hace por los demas.
- **El panel acoplado tapaba los paneles de capas activas y de descargas**, que viven a la derecha
  con `z-10` y `z-11` mientras el panel iba en `z-13`: por eso dejaban de responder. Acoplado baja a
  `z-9`, debajo de toda la interfaz del visor, asi que el sider y los paneles siguen encima y se
  pueden usar.
- **Acoplar entra en modo zen** y soltar o cerrar la tabla lo apaga. Con el panel pegado a un borde
  el sider pasa a su trato compacto y deja de pelear por el espacio.

## [1.162.0] - 2026-09-02

### Agregado: el area util del mapa como fuente de verdad de los flotantes

Con el panel acoplado, los elementos que viven encima del mapa seguian calculando su posicion contra
el sider y quedaban debajo del panel. Ahora hay un contexto —`AreaUtilContext`— con lo que el mapa
cede por cada lado, que publica el propio acople y consumen los flotantes: el dock de las pastillas,
los controles de zoom, la barra de escala y la atribucion.

Es la pieza que faltaba para que el acoplado se sienta como una ventana de escritorio y no como un
panel encimado, y deja el camino para que lo mismo aplique a cualquier panel que se acople despues.

## [1.161.0] - 2026-09-02

### Agregado: el panel de la tabla se acopla a los bordes y el mapa le cede el espacio

Primera pasada del acoplado tipo ventanas de escritorio. Arrastrando el panel por su encabezado
hacia un borde aparece la vista previa del area que va a ocupar; al soltar se acopla, y **el mapa se
angosta** de verdad en vez de quedar tapado: su contenedor cede el ancho o el alto y OpenLayers
recibe `updateSize()` mientras dura la transicion, para que no quede el lienzo viejo.

- Izquierda y derecha toman el 42 % del ancho; abajo, el 40 % del alto.
- El borde inferior gana en las esquinas, que es lo que se espera al arrastrar hacia abajo.
- Un boton en el encabezado suelta el panel y lo devuelve a ventana flotante.
- Minimizar la tabla devuelve el mapa a pantalla completa sin perder el acople.

La geometria vive en `helpers/tablaAcople.js`, aparte y con tests, porque de ahi salen tanto el
tamano del panel como lo que cede el mapa y tienen que coincidir exactamente.

## [1.160.2] - 2026-09-02

### Eliminado: la primera columna y la casilla ya no quedan ancladas

Se retira el anclado que llego en 1.160.0. El selector de columnas resuelve mejor el mismo problema
—que hay mas columnas de las que caben— sin dejar celdas flotando sobre las que se desplazan.

## [1.160.1] - 2026-09-02

### Cambiado: las listas de los menus de la tabla usan `ScrollContainer`

La lista de columnas y la de valores de un filtro pasaron a `ScrollContainer`, asi que traen las
flechas y el difuminado de los bordes que ya usa el resto del visor, con la barra de scroll del
`index.css` en vez de la del navegador.

## [1.160.0] - 2026-09-02

### Agregado: elegir que columnas se ven, y la primera se queda fija

Las dos atacan lo mismo: que hay mas columnas de las que caben y navegar a lo ancho es incomodo.

- **Selector de columnas** en el encabezado del panel: apagas las que no te importan y la tabla se
  angosta hasta caber sin desplazarse. El boton se pinta encendido y dice cuantas hay ocultas. La
  eleccion es de la sesion y se apoya en la visibilidad que ya trae configurada la capa.
- **La casilla y la primera columna se quedan pegadas** a la izquierda al desplazarse a lo ancho,
  para no perder de vista de que registro es cada fila.
- El badge `grupo · n` explica en su tooltip que la capa es un grupo cuyas capas comparten tabla, y
  que ahi se ven los registros de todas juntas.

## [1.159.1] - 2026-09-02

### Corregido: aplicar un filtro ya no regresa la tabla a la primera columna

Al recargar las filas, el contenedor perdia su desplazamiento horizontal y quedabas en la columna
uno aunque estuvieras filtrando la penultima. Ahora se recuerda el desplazamiento y se restaura
cuando llegan los datos nuevos.

## [1.159.0] - 2026-09-02

### Cambiado: la seleccion multiple recorta el mapa y la tarjeta vuelve a ser la de siempre

- **Es la misma tarjeta del visor, ahora tambien en los grupos.** El `InfoBox` arma la tarjeta con
  el `littleCard` de la capa, y un grupo no tiene: lo tienen sus hojas. Por eso al elegir un
  registro de una tabla de grupo salia la version generica. La tabla ahora resuelve el `littleCard`
  de la primera hoja que lo declare y lo manda en el resultado.
- **La casilla selecciona sin teclado.** Tocar la casilla ya no dispara ademas el clic de la fila,
  que reemplazaba la seleccion: cada casilla agrega o quita su registro por su cuenta. `Shift` y
  `Ctrl` siguen sirviendo.
- **Con dos o mas registros elegidos, el mapa deja de dibujar el resto.** Se escribe un filtro por
  id de feature bajo la llave `seleccion`, que la tabla excluye de lo que hereda para no recortarse
  a si misma. Al bajar de dos, el mapa vuelve a la capa completa.
- **La columna de casillas tiene su propia casilla en el encabezado**: con algo seleccionado limpia
  todo de un toque, y sin nada selecciona los registros ya cargados.

## [1.158.4] - 2026-09-02

### Cambiado: el recorte por pantalla se explica solo y se apaga de un toque

Es un poligono de seleccion, pero dibujado por lo que abarca la pantalla en vez de a mano, asi que
las dos cosas que lo controlan quedaron como interruptores con estado en vez de pares de botones:

- El boton de recorte se pinta encendido mientras el modo esta activo y lo apaga —descongelando de
  paso— con un segundo toque.
- Congelar dejo de alternar entre pausa y play: es un solo boton que se pinta encendido cuando el
  area esta fija.
- Los tooltips dicen que hace cada uno con todas sus letras, porque el comportamiento no se adivina
  del icono.

Sigue sin ser el comportamiento por defecto: una tabla recien abierta trae la capa completa.

## [1.158.3] - 2026-09-02

### Corregido: la tarjeta de un registro de la tabla sale al centro

Colocarla sobre el feature no bastaba: el pixel se calculaba antes de que el mapa terminara de
moverse y podia quedar fuera de la pantalla, o en la esquina si la geometria no resolvia. Para las
selecciones **de la tabla** la tarjeta va al centro del viewport, que es justo donde queda el
registro despues de que el mapa se centra en el. Los clics sobre el mapa conservan su
comportamiento: ahi la tarjeta sigue saliendo donde se toco.

## [1.158.2] - 2026-09-02

### Cambiado: el filtro de cada columna se ve, se abre y dice donde estas parado

- **Cada encabezado lleva su embudo**: gris cuando la columna no esta filtrada y naranja cuando si,
  para que se note de un vistazo cuales recortan la tabla.
- **El menu de la columna ya se ve.** Estaba dentro del contenedor con scroll, que recorta a sus
  hijos absolutos, asi que se cortaba: no era z-index. Ahora sale por el componente `Panel`, que lo
  saca con un portal y lo ancla al encabezado.
- **El chip de municipio nombra el alcance.** Si la seleccion es la ZMG o una region, dice «ZMG» o
  «Region Altos Norte» en vez de «9 municipios». Sale de `scopeLabel`, que el modo municipio ya
  calculaba para su propio chip.

## [1.158.1] - 2026-09-01

### Corregido: el filtro de capas disparaba la firma de inyeccion SQL del WAF

El 2026-09-01 el FortiWeb **denego** una peticion legitima del visor: la firma `030000136` matcheo
`OR (grupo = 'Asentamiento` dentro de `CQL_FILTER`, porque `OR <columna> = <valor>` es la forma
canonica de una inyeccion SQL. El usuario perdia la capa.

El `OR` no era arbitrario. Los sublayers se agrupan por `layerName|styles` —la misma capa fisica de
GeoServer— y cada grupo de uso de suelo es una entrada del catalogo con su propio `cqlFilter`, asi
que al activar varios se colapsan en una sola peticion WMS y sus filtros se unen para mostrar la
union.

`joinCQLFilters` reemplaza a los cuatro `join(' OR ')` repartidos por el codigo. Cuando **todos** los
subfiltros son una igualdad simple sobre **el mismo campo**, emite `grupo IN ('Agricultura','Bosque')`
en vez de `(grupo = 'Agricultura') OR (grupo = 'Bosque')`: mismo resultado en GeoServer, URL mas
corta y sin el patron que dispara la firma. En cualquier otro caso —campos distintos, rangos de
fecha, filtros compuestos— conserva el `OR` exactamente como estaba, incluidos los parentesis.

**No sustituye a la excepcion del WAF.** Los filtros por periodo generan
`(fecha >= 'x' AND fecha < 'y') OR (...)`, que no tiene equivalente con `IN` y va a seguir
disparando firmas genericas. Esto solo reduce la frecuencia en el caso mas comun.


## [1.158.0] - 2026-09-01

### Agregado: seleccion multiple de registros y pestanas que mandan sobre las capas activas

- **Varios registros a la vez.** Cada fila lleva casilla, `Ctrl`/`Cmd` alterna de a uno y `Shift`
  toma el rango desde el ultimo tocado. Todos los elegidos se resaltan juntos en el mapa y el pie
  dice cuantos van, con un enlace para limpiar.
- **Las pestanas seleccionan la capa** en el panel de capas activas al tocarlas, asi que abrir una
  tabla deja esa capa en foco para simbologia y estadisticas.
- **Las pestanas se arrastran para reordenar** y el orden se escribe en las capas activas. Un grupo
  arrastra a sus hojas: se expande a los ids reales antes de guardar el orden, y las capas activas
  que no son pestana —etiquetas, categorias— se quedan donde estaban.

Se reusaron `SortableList` y `SortableItem` del panel de capas activas, que ahora aceptan
`modifiers` y `className` para poder ordenarse en horizontal.

## [1.157.3] - 2026-09-01

### Corregido: la tarjeta salia en la esquina al elegir un registro de la tabla

`centerOnResults` ya sabia colocar la tarjeta sobre el feature —recibe `clickPosition` y le pasa el
pixel del centro cuando termina la animacion—, pero la tabla no se lo estaba pasando, asi que la
tarjeta se quedaba sin posicion y aterrizaba arriba a la izquierda. Ahora la tabla marca el pixel
del feature **antes** de animar, para que la tarjeta no parpadee en la esquina, y deja que
`centerOnResults` la reacomode al terminar. De paso viaja el `lngLat` del centro, que antes iba en
`null`.

## [1.157.2] - 2026-09-01

### Cambiado: las pills del dock ya no muestran tooltip

La pastilla dice lo mismo que decia su tooltip, asi que el globo solo tapaba el mapa al pasar por
encima. Aplica a las dos, porque comparten `PillMinimizada`. El boton de cerrar conserva el suyo,
que si aporta: aparece al pasar el mouse y aclara que cierra.

## [1.157.1] - 2026-09-01

### Corregido: el backend y el MCP no arrancaban por `httpx`

`fastmcp` no esta pineado y su 4.0.0 cambio de cliente HTTP: ahora trae **`httpx2`** en vez de
`httpx`. El backend importa `httpx` directo en `embed.py`, `access_logger.py`, `api_key_quota.py` y
`api_key_validator.py`, pero **nunca lo declaro**: venia de arrastre por fastmcp. Al reconstruir, el
worker moria con `ModuleNotFoundError: No module named 'httpx'` y el deploy fallaba con
`container mapalab-backend-1 is unhealthy`. El MCP se cae igual porque comparte
`backend/requirements.txt`.

`httpx` queda declarado como lo que es: una dependencia directa.

## [1.157.0] - 2026-09-01

### Corregido: ante un 429 el recuperador de chunks amplificaba la saturacion

`error-recovery.js` respondia a cualquier fallo de chunk con `window.location.reload()`, hasta dos
veces. Una recarga completa vuelve a pedir el HTML y los ~25 assets, asi que **cada visitante
afectado sumaba ~50 peticiones** contra el mismo cubo de rate limit que ya estaba saturado, mas un
beacon a `/mapalab/api/log/client-error` por intento. El 2026-08-31, con el gateway rechazando los
bundles por 429, el propio frontend multiplicaba la inundacion que le impedia cargar.

Ahora sondea con `HEAD` la URL que fallo antes de decidir:

- **429** — no recarga nada. Espera con backoff exponencial y jitter (4 s de base, tope 60 s, seis
  rondas), reintentando solo el sondeo, y recarga una vez cuando el gateway vuelve a responder
  2xx/3xx. El beacon se manda **una sola vez** por sesion.
- **Cualquier otro fallo** — el comportamiento de siempre, que es el correcto para el caso para el
  que se escribio: hashes viejos en cache tras un deploy.

Tambien se separo el mensaje. Ante un 429 decia «Tu navegador guardo una version anterior de la
aplicacion», diagnostico equivocado que manda al usuario a hacer Ctrl+F5 —o sea, a inundar mas—.
Ahora hay uno propio, «MapaLab esta saturado», sin boton mientras reintenta solo.


## [1.156.0] - 2026-08-28

### Cambiado: cerrar cierra la herramienta, y el municipio se ve como filtro

- **La seleccion de municipio aparece en el renglon de filtros**, como un chip gris sin boton de
  quitar: no es un filtro de la tabla, viene de la seleccion del mapa y se cambia desde ahi. Dice el
  nombre cuando es uno solo y «3 municipios» cuando son varios.
- **El boton de cerrar cierra toda la herramienta.** Ya no se quitan tablas de una en una: las
  tablas son el reflejo del panel de capas activas, y ahi es donde se agregan y se quitan. Con eso
  desaparecio el estado de tablas cerradas a mano.
- **El cerrar de las pills quedo arriba de la pastilla**, centrado, en vez de a su derecha. Aplica a
  las dos, porque las dos usan `PillMinimizada`.

## [1.155.0] - 2026-08-28

### Cambiado: las pills minimizadas comparten un solo dock

Hasta ahora cada flotante se posicionaba solo y se apartaba de los demas con `useClearance`, asi que
la pill de estadisticas y la de la tabla se apilaban una encima de otra. Ahora hay un **dock**:
un renglon fijo al pie del mapa, centrado, que se aparta de la escala y de la atribucion y respeta
el estado del sider. `PillMinimizada` se rinde ahi con un portal, asi que **cualquier pill del visor
cae en el mismo renglon** sin que su panel tenga que saber de las demas.

En escritorio quedan una al lado de otra; en movil el dock se apila, porque a lo ancho no caben.

Se fueron con esto dos parches que ya no hacen falta: el hook que media el borde del control de zoom
y el que corria una pill a la derecha de su vecina.

## [1.154.0] - 2026-08-28

### Corregido: la tabla ignoraba la seleccion de municipio

El filtro de municipio **no vive en `useCQLFilter`**: se arma en cada peticion WMS con
`buildLayerMunicipioCql(searchMeta, municipioContext)`, asi que la tabla nunca lo veia y seguir con
Atoyac seleccionado devolvia el estado completo. Ahora la tabla lo construye igual que el WMS, con
el `searchMeta` de la capa —o el de la primera hoja, si es un grupo— y lo suma al resto de la
consulta.

### Cambiado: pestanas parejas y las dos pills en el mismo renglon

- Las pestanas se reparten el ancho en partes iguales (`flex-1 basis-0`), que es lo que las hacia
  verse con separacion despareja, y perdieron su boton de cerrar: son el reflejo de las capas
  activas, asi que se quitan desde el panel de capas y no desde aqui.
- **La pill de tablas se acomoda al lado de la de estadisticas** en vez de apilarse encima. Se mide
  la vecina por `[data-pill-minimizada]` y, si se encimarian, la de tablas se corre a su derecha; al
  moverse avisa por `mapalab:layout` para que la vecina vuelva a bajar. En movil se conserva el
  apilado, porque a lo ancho no caben.

## [1.153.1] - 2026-08-28

### Cambiado: las pestanas del panel dicen que capa esta en foco y cual esta apagada

Se les quito el icono y el conteo en gris, y ahora ocupan el ancho completo del panel repartiendose
entre ellas. Toman prestado el lenguaje del panel de capas activas para que signifiquen lo mismo:
la capa seleccionada ahi va con el aro morado sobre `#F7F0FA` y las que estan sin visibilidad, con
el fondo `#EFF3FC`. La pestana cuya tabla se esta viendo se distingue aparte, con borde morado y
texto en negritas, asi que las tres cosas se pueden ver a la vez. En un grupo, el aro tambien
aparece cuando la capa en foco es una de sus hojas.

## [1.153.0] - 2026-08-28

### Cambiado: la tabla de datos carga por scroll infinito y su barra es una sola pill

- **Se acabo el paginador.** Las filas se acumulan al llegar al final del scroll, con el pie
  diciendo «125 de 1 248 registros». El tope por peticion sigue siendo 100, pero el usuario ya no
  tiene que saberlo.
- **La barra minimizada es una sola pill**, como la de estadisticas: icono, «3 tablas» y la X por
  fuera. Se abre tocandola. Los badges por tabla se quedan dentro del panel, que es donde hay
  espacio para distinguirlos.

### Corregido: los filtros de un grupo y el traslape con la pill de estadisticas

- **Un grupo hereda los filtros que ya estaban puestos.** `useCQLFilter` los guarda por capa hoja y
  su busqueda va de hijo a padre, asi que al abrir la tabla de un grupo no se encontraba nada:
  filtrar por Atoyac no llegaba a la tabla de centros educativos. Ahora se toma la **interseccion**
  de los filtros de sus hojas —lo que todas comparten, como el municipio— y se descarta lo que
  distingue a una de otra, que es justo lo que el grupo no debe recortar.
- **`useClearance` solo observaba los obstaculos pasados como ref, nunca los que son selector.**
  Por eso la pill de estadisticas no se enteraba de que aparecia la barra de tablas y se
  encimaban. Ahora tambien observa los nodos que hacen match con el selector y escucha un aviso
  (`mapalab:layout`) que emite quien aparece o desaparece.

## [1.152.1] - 2026-08-28

### Corregido: la tabla de un grupo devolvia 400 y se quedaba sin datos

`educacion:centros_educativos` son ocho capas del catalogo que apuntan al **mismo** feature type,
cada una con su `cqlFilter` por nivel educativo. Al abrir el grupo, el `GetFeature` salia con
`startIndex=0` y GeoServer respondia 400: sin llave primaria no puede resolver el orden natural que
exige el paginado, y pide un `sortBy`.

Ahora la primera pagina no manda `startIndex` —no lo necesita— y de la segunda en adelante viaja
con un orden estable: el que haya elegido el usuario o, si no eligio ninguno, la primera columna
visible.

### Cambiado: detalles del panel de la tabla

- El encabezado va en blanco, con el titulo en la tipografia de los demas paneles del visor
  (`font-garet` bold a 18px en morado) y sin la linea que lo separaba de las pestanas.
- Los errores del servicio dejaron de ocupar su propio renglon: ahora salen junto al conteo de
  registros, al pie.
- La X de cada badge de la barra minimizada salio del badge, como la del contenedor y como la del
  chip de municipio.

## [1.152.0] - 2026-08-28

### Cambiado: la barra de la tabla de datos se comporta como el resto de las pills

- **El contenedor es la pill y adentro van los badges.** Un solo bloque redondeado con los badges de
  las tablas dentro, sin icono ni conteo, para gastar el menor ancho posible.
- **Los grupos son una capa.** Los badges salen de `unifiedLayers`, que es la misma lista que pinta
  el panel de capas activas: grupos colapsados, con sus alias. Antes se desagregaban en sus hojas.
- **La posicion respeta el estado del sider, no su ancho maximo.** Usa
  `useSiderAdaptivePosition`, igual que los controles del mapa: solo se corre por el sider si el
  sider de verdad llega a esa altura. Encima toma el borde derecho real del control de zoom, medido
  con `ResizeObserver`, y acompana la animacion del sider en vez de saltar.
- **La barra le avisa a la pill de estadisticas.** Numeralia suma `[data-barra-tabla]` a los
  obstaculos de su `useClearance`, asi que su pill se desplaza hacia arriba con la separacion que ya
  usaba. El aviso va en un solo sentido a proposito: si las dos se observaran, `useClearance` se
  perseguiria a si mismo. La regla es entre pills y barras; cuando alguna esta abierta como panel,
  no hay interaccion.
- Una capa activa pero oculta en el mapa aparece atenuada, y el panel toma los mismos estados que su
  badge: borde morado cuando es la tabla activa, titulo atenuado cuando la capa esta oculta.

### Corregido: 400 del WFS al abrir la tabla de un grupo

Las filas y el conteo se pedian en paralelo con el sondeo de columnas, asi que el `GetFeature`
salia antes de saber si la capa era consultable. Con los grupos se notaba porque su nombre
compartido suele ser un **layer group de GeoServer**, que es una entidad de WMS y no un feature type
de WFS. Ahora el `DescribeFeatureType` decide: sin columnas no hay consulta, y el panel dice que las
capas del grupo no comparten una tabla consultable.

## [1.151.0] - 2026-08-28

### Agregado: el comparador de municipios se puede leer como grafica

Un segmento de dos iconos alterna entre la tabla y una grafica de lineas, junto al boton de agregar
municipio y solo dentro del comparador. La grafica traza **un perfil por municipio** —el porcentaje
que representa cada indicador sobre el total de ese municipio— y se elige cual ver con un selector
que existe solo en modo grafica, para no estorbar en la tabla. Seis lineas encimadas no se leian;
una sola si, y deja lugar para etiquetar su indicador mas alto y el mas bajo.

La linea **se corta donde falta el dato** en vez de interpolar entre los vecinos, que seria dibujar
un valor que nadie midio. La fila de totales queda fuera del trazo: tiene otra escala y aplastaria
todo lo demas, o exigiria un segundo eje.

### Corregido: la paleta que distingue municipios no era distinguible

Los seis colores del comparador se habian elegido a ojo. Medidos, fallaban tres comprobaciones: dos
quedaban fuera de la banda de luminosidad, tres por debajo del piso de croma —leen como gris— y
`#2E4372` contra `#24573F` daban una diferencia de 12.3, por debajo del piso de 15, o sea dificiles
de separar **incluso con vision de color normal**. La paleta nueva pasa las seis comprobaciones
sobre la superficie del panel, incluido contraste 3:1 y separacion para daltonismo. Como esos
colores tambien identifican cada columna, el arreglo alcanza a la tabla.

### Corregido: los tres modos desaparecian en casi todas las capas

Comparar, ranking y crear se dibujaban solo si la capa tenia estadisticas dinamicas. Como hoy solo
**una capa de 209** las tiene, los botones no aparecian en ninguna otra y la funcion se leia como
rota. Ahora los tres se dibujan siempre y salen deshabilitados donde no aplican, con la razon en su
tooltip. Ademas, si el modo guardado no lo soporta la capa en foco, el panel vuelve solo al resumen:
antes se podia quedar atrapado en comparar sin botones para salir.

### Corregido: la tarjeta impar nunca ocupo el hueco de su acompañante

`StatCard` aplica el `className` que recibe a su elemento interno, pero el item de la rejilla es el
contenedor externo, asi que el `row-span-2` se pintaba donde no tenia efecto. Con `contenedorClassName`
la clase llega al item correcto y la ultima tarjeta rellena el hueco cuando el total es impar.

El panel vuelve a centrarse dentro del area libre —seguia contemplando el sider, pero `justify-start`
lo pegaba a la izquierda en vez de balancearlo—, las acciones regresan a la fila de los titulos de
columna, y el segmento adopta el componente `Segmented` que ya usaba el selector de puntos y
hexagonos, en vez de una copia parecida.

## [1.150.0] - 2026-08-31

### Cambiado: la tarjetita se resuelve en un solo lugar

`utils/infoboxPlan.js` es ahora la **copia canonica** de toda la resolucion de la tarjetita:
configuracion mas propiedades de una feature dan un *plan* —titulo y bloques con sus valores ya
resueltos y formateados— y el visor solo lo pinta. Es un modulo puro, sin React y sin estilos, y
mariachi tiene una copia byte a byte que su `scripts/sync-infobox-plan.sh --check` vigila.

El motivo es concreto: el editor de mariachi reimplementaba esta logica y ya divergio una vez esta
semana —los campos compuestos servian en el visor y el preview los ignoraba—. Con una vista previa
chica al lado eso es un defecto; con el editor de lienzo que viene, seria el producto.

**Nada cambia en pantalla.** Los 1113 tests pasan sin tocarse.

### Eliminado: tres modulos que la resolucion absorbio

`resolveFieldValue.js`, `infoBoxTextBlocks.js` y `cardTemplates.js` desaparecen, y con ellos
`constants/multivalor.js`. Sus decisiones —resolver un campo, unir columnas, partir por `; `,
normalizar la forma vieja, inferir una tarjeta cuando no hay configuracion— viven ahora en
`infoboxPlan.js`. Las plantillas `TDEMEC*` que quedaban en `cardTemplates.js` no las importaba nadie.

`List`, `Cards` e `IconText` dejan de decidir: ya no formatean numeros ni fechas, no deducen el
icono de genero ni arman el link de Google Maps. Reciben el valor listo y lo pintan.

## [1.149.0] - 2026-08-31

### Agregado: una tarjeta puede repetir el mismo tipo de bloque

Hasta ahora cada tipo de bloque —etiquetas, lista, cifras, iconos, texto— existia una sola vez,
porque vivia bajo su propia clave del JSON. Ahora cualquiera de los cinco acepta **varias
instancias en posiciones distintas**: un grupo de etiquetas arriba y otro al final, dos listas
separadas por un bloque de cifras, lo que haga falta.

La forma en disco es la que `text` ya usaba, extendida a los otros cuatro:

```json
{ "list": [ { "id": "a", "items": [ … ] }, { "id": "b", "items": [ … ] } ],
  "blockOrder": ["list:a", "labelGroups", "list:b"] }
```

**La forma de siempre sigue valiendo y es la que se guarda mientras haya una sola instancia**:
`list` como arreglo plano de renglones. Solo al duplicar se convierte a la forma con ids, y al
quedar una sola vuelve sola a la forma plana. Ninguna tarjetita existente cambia.

Por dentro los cinco renderizadores dejaron de leer `finalConfig[tipo]` y reciben los items de su
instancia, asi que `text` dejo de ser un caso aparte con su propio despacho: es un tipo mas de la
tabla `BODY_RENDERERS`.

## [1.148.0] - 2026-08-28

### Cambiado: la tabla de atributos navega por pestanas y se ve como el resto del visor

- **Las pestanas son las capas activas.** Ya no hay una lista propia de tablas abiertas: se navega
  entre las capas del panel de capas activas que tienen datos. Quitar una pestana la saca de la
  herramienta; volver a activar la capa la trae de vuelta.
- **La barra inferior solo aparece minimizada.** Con la ventana abierta, las pestanas viven debajo
  de su encabezado. Antes la barra estaba siempre y duplicaba la informacion.
- **Las pestanas son pills.** La pastilla de numeralia se generalizo a `components/PillMinimizada`
  y ahora la usan las dos: misma forma redondeada, misma sombra, mismo boton de cerrar rosa. La de
  numeralia quedo como una envoltura con sus textos, asi que se ve y se comporta igual que antes. A
  la compartida se le agregaron un tamano compacto, el conteo como sufijo y la variante con el
  cierre **dentro** de la pastilla, que es la que necesitan las pestanas para que la X no tape a la
  vecina. Aparece al pasar el mouse por esa pestana, no por toda la barra.
- Se fueron el separador vertical y el boton de flecha de la barra: se abre tocando su pestana, como
  cualquier pill del visor.

### Corregido: el encabezado de la tabla se desalineaba de sus columnas

El encabezado y las filas se dibujaban en dos contenedores distintos —uno `flex`, otro `min-w-max`—
asi que con scroll horizontal las columnas dejaban de coincidir con sus celdas. Ahora comparten un
`grid-template-columns` y viven en el mismo contenedor con scroll, con el encabezado `sticky`.

Los estilos se homologaron con las tablas de estadisticas dinamicas: encabezado en `#2E4372` a 11px,
celdas a 13px en `#454545`, numeros alineados a la derecha con `tabular-nums` y la fila seleccionada
en el mismo ambar del ranking.

## [1.147.1] - 2026-08-28

### Corregido: la tabla de atributos, contra capas reales

Cinco cosas que aparecieron al usarla:

- **Los grupos de capas ya abren tabla.** Un grupo suele ser la misma tabla publicada con distintos
  filtros —las once de delitos son `delitos_fiscalia`—, asi que ahora se resuelve a la tabla que
  comparten sus hojas y se consulta **sin el filtro de ninguna**, que es lo que significa abrir el
  grupo. Si las hojas apuntan a tablas distintas se usa la primera. La barra de la ventana lo dice
  con una etiqueta `grupo · n`.
- **Minimizar y cerrar no respondian.** El encabezado tomaba `setPointerCapture` en el `pointerdown`
  para poder arrastrar, y con el puntero capturado el `click` nunca llegaba al boton. El arrastre
  ahora ignora los `pointerdown` que nacen sobre un control.
- **Una capa sin columnas de datos ya no truena con 400.** Si el `DescribeFeatureType` no devuelve
  ninguna columna que no sea la geometria, la tabla lo dice en vez de mandar un `GetFeature` que el
  servicio rechaza. Los codigos de estado tambien se traducen a mensajes legibles, y el mensaje de
  GeoServer gana sobre el codigo cuando viene en el cuerpo.
- **La ventana abre centrada** en la pantalla, con su desfase por cada tabla abierta, en vez de
  aparecer pegada a la esquina superior izquierda.
- **`GET /metadata/columnas` responde 200 aunque `atributos.columnas` no exista.** Mientras la
  migracion 0046 de dataengine no corra, la tabla se sirve con los nombres crudos: es la misma regla
  que hace que una capa sin configurar funcione igual.

## [1.147.0] - 2026-08-28

### Agregado: tabla de atributos del visor

Una herramienta nueva en el menu de Herramientas —solo en `dev` y `beta`, como el swipe— que abre
los datos crudos de una capa en una ventana flotante: columnas, celdas y filtros por columna, como
en QGIS. Se pueden abrir varias a la vez y todas se recogen a una sola barra de estado al pie del
mapa, con una pastilla por tabla, su conteo y los chips de filtro de la que este activa.

Los filtros son una sola expresion CQL vista con tres lentes: el menu de cada columna la escribe
—con el control que corresponde a su tipo, y la lista de municipios cuando la capa declara su
`municipioField`—, los chips la muestran y `Ver como CQL` la deja editar a mano. Editarla colapsa
los chips en uno solo: no se intenta reconstruir chips desde CQL arbitrario. Lo que se filtra en la
tabla recorta la capa en el mapa bajo la llave `tabla`, que se limpia al cerrar la ventana.

`Solo lo visible` ata la tabla al extent del mapa y `Congelar` fija ese recorte para poder navegar
sin que la tabla cambie bajo los pies. Se usa el extent completo de la vista aunque la ventana tape
una parte: restar ese rectangulo haria cambiar el conteo al mover la ventana sin mover el mapa.

Una capa sin configurar funciona igual, con los nombres crudos que entrega el WFS. Los alias, el
orden, la visibilidad y el formato se administran desde la pestana Columnas del CMS de mariachi y
viven en el schema `atributos` de dataengine.

Detalles que costaron y quedan cubiertos con tests: la excepcion que GeoServer devuelve **con HTTP
200** y cuerpo XML se convierte en un mensaje visible en vez de una tabla vacia; el filtro `date` de
una capa `timeEnabled` no viaja como CQL; y cada peticion nace cancelable, porque arrastrar el mapa
encadena consultas cuyas respuestas llegan desordenadas.

## [1.146.0] - 2026-08-28

### Cambiado: el estado «deshabilitada» viaja como dato, no como asterisco en el nombre

`/layers/tree` dejo de anteponer `*` al `label` de una capa deshabilitada y ahora publica
`disabled: true` en el nodo. El asterisco era la unica senal de ese estado: nadie fuera del arbol
podia distinguir una capa apagada sin inspeccionar la primera letra de su nombre, y el nombre
llegaba sucio a todo lo que lo muestra —leyenda, capas activas, exportacion del mapa y el titulo
de la tarjeta—.

`LayerItem` deduce el estado del campo nuevo. El resto del visor no cambia de comportamiento:
solo deja de arrastrar el asterisco en el texto.

**El ETag ahora lleva el numero de esquema del arbol** (`W/"2-..."`). Sin eso el deploy no se
notaba: la cache materializada en `mapalab.layer_tree_cache` solo se regenera cuando cambia una
capa o a las 04:00, asi que produccion habria seguido sirviendo el arbol viejo —con asteriscos y
sin `disabled`— hasta la madrugada siguiente. Al arrancar con un esquema distinto al cacheado, la
cache se reconstruye sola.

**Consumidores.** El complemento de QGIS lee este arbol y detectaba el estado por el asterisco; su
0.14.1 acepta las dos formas, porque vive instalado en maquinas que no se actualizan al mismo
tiempo. El admin de mariachi hace lo mismo durante la ventana de deploy.

## [1.145.0] - 2026-08-28

### Agregado: una tarjeta puede armar un dato con varias columnas

`compose` sustituye a `field` en cualquier bloque de la tarjeta —titulo, lista, cifras, etiquetas,
iconos con texto— y une varias columnas en un solo valor. El caso que lo pidio es la direccion, que
casi siempre llega partida en `calle`, `numero`, `colonia` y `cp`.

```json
{ "label": "Direccion", "compose": ["calle", { "field": "numero_ext", "prefix": "#" }, "colonia"], "sep": ", " }
```

Cada parte es un nombre de columna o un objeto con `prefix` y `suffix`. **Una parte vacia se va con
su prefijo y su sufijo**: sin esa regla, la capa sin numero mostraba `Calle Hidalgo #, Col. Centro`
con el gancho colgando. El pegamento es `sep`, que por defecto es `", "`. Si todas las partes
quedan vacias, el renglon desaparece, igual que un `field` sin valor.

Con `"op": "sum"` las partes se suman en vez de unirse, para las cifras que hoy exigen una columna
calculada en la base (`hombres` + `mujeres`). Las partes que no sean numericas se ignoran.

Un valor unido **no pasa por el formato de numeros**: una direccion que se reduzca a su codigo
postal se veia como `45 010`. Una suma si se formatea.

### Cambiado: las columnas multivalor se separan con `; `

El separador de una celda con varios valores queda fijado en `; ` —punto y coma mas un espacio— y
`splitValues` parte estricto por punto y coma, sin respaldo por coma. La coma vive dentro de los
valores reales (`Zapopan, Jal.`, `React, OpenLayers`) y partir por ella los destroza; ademas la
descarga de tarjetas es CSV delimitado por comas. Ninguna capa usaba `splitValues` todavia: el
unico dato afectado era el `tecnologias` quemado del marcador del IIEG.

La bandera deja de vivir solo en `labelGroups`: un renglon de `list` con `split: true` se pinta
como varios valores en vez de una linea larga.

### Cambiado: una sola forma de leer un campo de la tarjeta

`renderCard` leia una propiedad en seis lugares y de dos maneras distintas. Todas pasan ahora por
`makeValueResolver`, y los cinco renderizadores de bloque salieron a `cardBlocks.jsx`: el archivo
baja de 316 a 87 lineas.

### Corregido: la tarjeta ignoraba las columnas publicadas en mayusculas

`headerField` y los bloques de texto resolvian sin distinguir mayusculas; la lista, las cifras, las
etiquetas y los iconos con texto comparaban exacto. Una capa con `CALLE` mostraba el titulo y se
comia el renglon. Ahora las seis lecturas son insensibles a mayusculas.

### Corregido: el editor de tarjeta del catalogo borraba las filas compuestas

`draftFromConfig` filtraba por `row.field`, asi que una capa con campos compuestos perdia esos
renglones al abrir el editor ciudadano y la propuesta enviada los borraba. Ahora sobreviven como
chip bloqueado, sus columnas cuentan como usadas y vuelven intactas al guardar.

## [1.144.2] - 2026-08-28

### Corregido: se retira codigo muerto que dejo el panel de estadisticas

`AccionesEncabezado` se extrajo para sacar los botones del encabezado y quedo huerfano al aparecer
`PanelHeader` y `ActionIconButton`, que hacen lo mismo de forma reutilizable. Se borra.

En `avisoSeleccion` tres simbolos estaban exportados sin que nadie los importara: solo se usan
dentro del propio modulo, detras de `useAvisoSeleccion`. Pasan a ser privados, que es lo que
siempre fueron en la practica.

## [1.144.1] - 2026-08-28

### Cambiado: un solo hook aparta a los controles flotantes que se tapan

`useOverlapOffset` y `useBottomClearance` nacieron el mismo dia en sesiones distintas y median lo
mismo en direcciones opuestas: cruzar la caja propia contra la ajena y devolver cuanto hay que
moverse. Quedan fusionados en `useClearance`, que recibe el lado (`top` o `bottom`) y los obstaculos
—referencias o selectores CSS, que es como se alcanzan la escala y la atribucion de OpenLayers—.

De paso se corrige que el de abajo solo cruzaba las cajas en horizontal: un elemento que estorbara
en X pero estuviera lejos en Y tambien levantaba el piso. Ahora se exige cruce en los dos ejes.

Tambien desaparece la correccion de realimentacion que arrastraba el otro. En un elemento `fixed`
posicionado por `top` o `bottom`, la posicion natural **es** la base, asi que no hace falta recordar
el desplazamiento previo para no oscilar.

Ninguno de los dos tenia pruebas; el unificado estrena seis.

## [1.144.0] - 2026-08-28

### Agregado: el panel de estadisticas recuerda la sesion y homologa su interfaz

Las tres herramientas nuevas —comparador, ranking y constructor— ahora **sobreviven al refresco**.
El estado completo vive en una sola llave del navegador y se borra al cerrar la herramienta, que es
el gesto de «ya termine». Los municipios comparados son globales y te siguen al cambiar de capa,
porque comparar Guadalajara contra Zapopan tiene sentido en cualquiera. El indicador del ranking y
el borrador del constructor son por capa, porque el indicador numero tres de una capa no es el
mismo que el de otra y las columnas pertenecen a su tabla.

Las estadisticas propias se separan de ese estado: viven en su propia llave y **no se borran al
cerrar**, porque son trabajo guardado y no sesion. Para que el panel de capas activas pudiera
avisar de ellas en vivo, la lista dejo de leerse suelta en cada componente y paso a una sola
fuente; el boton de estadisticas del item activo estrena un badge que cuenta lo propio de la capa
y la comparacion en curso, con el detalle en su tooltip.

Ese mismo boton dejo de ser decorativo cuando las estadisticas ya estan en el panel: **contrae y
expande**, muestra la flecha cuando esta abierto, y el destello del panel pasa al naranja
institucional.

### Cambiado: la interfaz del panel adopta el lenguaje del resto del visor

Salieron tres componentes reutilizables —`PanelHeader`, `ActionIconButton` y `DropdownPill`— mas un
hook `useBottomClearance` que levanta la pastilla contraida solo si de verdad se cruza con la barra
de escala o las atribuciones, en vez de reservar un margen fijo.

La pastilla contraida adopta la forma de la de municipio: misma altura, mismo radio, mismo borde
que se pone morado, y el boton de cerrar rosa que aparece al pasar por encima. Se le quito la
flecha, que ninguna otra pastilla tiene. El encabezado del panel se vuelve pegajoso con desenfoque,
cambia el icono por una flecha de regreso al entrar a una seccion, y sus acciones se pintan de
naranja cuando estan activas, como en el buscador del catalogo.

En el comparador cada columna se arrastra con dnd-kit, se quita desde su propio encabezado y solo
las columnas de municipio se desplazan: la de indicadores queda fija. Los numeros se muestran en
absoluto con su porcentaje al lado, y el que manda o el que menos tiene se encierra en un recuadro
verde o rojo con su diferencia, en vez de teñirse entero. En el ranking los desplegables se
construyen con el lenguaje del selector de municipio, el municipio seleccionado queda pegado a la
vista mientras se recorre la lista, y el conteo se mudo al pie porque es resultado de la consulta y
no atributo de la capa.

### Corregido: los desplegables ya no los recorta el panel

El selector de municipio del comparador y los del ranking se abrian hacia arriba y **el
`overflow` del panel los cortaba**. No era z-index: ningun valor los hubiera salvado desde adentro.
Los dos se dibujan ahora fuera del panel con posicion fija, anclados a su boton y con tope en los
bordes de la pantalla.

El `.scrollbar-thin` del proyecto solo definia ancho, asi que toda barra horizontal salia gruesa;
ahora tambien define alto. Y las estadisticas armadas en el visor dejan de mostrar decimales
siempre: un maximo entero se lee `3192` y no `3192.00`.

El panel de capas activas homologa su relleno inferior con el de los costados, que venia mas
apretado.

## [1.143.0] - 2026-08-28

### Cambiado: la pill de municipio baja solo cuando algo la tapa

Bajaba en toda pantalla movil, con un `74px` escrito a mano que era el alto de la barra de
herramientas. La barra esta anclada a la derecha y la pill va centrada, asi que **verticalmente
siempre coinciden**: que se estorben depende del ancho de la barra y del largo del nombre del
municipio. Con la barra compacta y un nombre corto no habia estorbo y la pill bajaba igual.

Ahora la decision se mide. El nuevo `useOverlapOffset` recibe dos referencias y devuelve cuantos
pixeles hay que bajar: cero si las cajas no se cruzan, y lo justo para librar el obstaculo si se
cruzan. Un `ResizeObserver` sobre ambos elementos lo recalcula cuando la barra se compacta, cuando
cambia el municipio o cuando gira el dispositivo.

`SiderContext` expone `toolsPanelRef` junto a los refs de geometria que ya guardaba, que es como
`useSiderAdaptivePosition` resuelve lo mismo para el sider.

Detalle de implementacion: el hook recuerda su propio desplazamiento para medir siempre la posicion
natural del objetivo; sin eso, medir un elemento ya desplazado realimenta el calculo y oscila. Y
mueve con `top`, no con `transform`, que crearia bloque contenedor para cualquier hijo `fixed`.

## [1.142.1] - 2026-08-28

### Cambiado: el chip de aislar capa cierra con el mismo boton que las pills flotantes

La × que estrenó 1.135.0 vivía **dentro** del chip, como un adorno sin foco propio ni nombre
accesible: el chip entero apagaba el modo y la × solo señalaba por dónde. Ahora la salida es el mismo
botón rosa que usan las pills flotantes del visor —`#FFE6EC` en reposo, `#FF577D` al pasar encima,
ícono `cerrar`—, con su propio `aria-label` y su tooltip, y **revelado en hover** igual que aquellas:
oculto por defecto de `md` para arriba, visible siempre en móvil, donde no hay hover que valga.

Va en tamaño `sm`: 24 px de botón contra los 40 px de las pills flotantes, para no pasarse de la
altura del chip, que es `h-6`.

Ese patrón estaba **duplicado literal** en dos componentes, así que salió a
`components/PillCloseButton.jsx` con dos tamaños. Hoy solo lo consume el chip: la pill de municipio y
la de estadísticas siguen con su copia porque ambas están siendo reescritas en otra rama de trabajo,
y migrarlas ahí es cambiar el bloque por una etiqueta de cuatro líneas.

A diferencia de las pills flotantes, que colocan su botón en absoluto sobre el mapa, aquí el botón va
**en el flujo**: colapsado a `max-width: 0` con `overflow-hidden`, y al pasar el mouse se abre a 28 px
—4 de separación más 24 de botón— empujando a los botones que siguen. Así no queda hueco reservado
cuando no se usa, ni el botón cae encima del ícono de eliminar capas, que está a solo 12 px.

Medido en el navegador contra el CSS compilado: en reposo el contenedor mide 0 px y el vecino arranca
en x=187; con el hover mide 28 px y el vecino se recorre a x=215.

`PillCloseButton` toma esa diferencia como prop `reveal`: `overlay` para las pills flotantes —oculta
por visibilidad, sin tocar el layout— e `inline` para el chip.

## [1.142.0] - 2026-08-28

### Agregado: el panel de estadisticas gana comparador, ranking y estadisticas propias

El encabezado del panel estrena tres botones. Aparecen solo cuando la capa los merece: comparar y
ranking exigen que la capa declare su campo de municipio, y los tres exigen que tenga estadisticas
dinamicas. En una capa con valores capturados a mano no sale ninguno, porque no tendrian nada que
calcular.

**Comparar** transpone la tabla: cada indicador baja a una fila y cada municipio gana una columna,
que se quita con la equis de su propio encabezado y se agrega con la columna del mas al final. Las
celdas hablan en porcentajes del total de ese municipio, para que Guadalajara y Etzatlan se puedan
poner lado a lado sin que los absolutos aplasten la lectura. El interruptor de mas y menos resalta
una sola celda por renglon —la mas alta o la mas baja— con su ventaja sobre el segundo lugar, asi
que la comparacion no gasta una columna y funciona igual con dos municipios que con seis. No hay
backend nuevo: cada columna es la misma peticion de siempre con otro municipio.

**Ranking** ordena los 125 municipios por el indicador que se elija, en total o en porcentaje, y
resalta el que este seleccionado en el visor aunque caiga en el lugar ochenta. Aqui si hubo motor
nuevo: una consulta agrupada por municipio en vez de 125 sueltas. El filtro de municipio de la
configuracion se ignora a proposito, porque en este modo el municipio es la llave de agrupacion.

**Crear** entrega el panel completo a un constructor guiado, con un boton discreto para volver. Los
pasos se leen como una frase y las opciones salen de la propia tabla: las columnas de texto con
pocos valores distintos se vuelven selectores con sus valores reales, y las de alta cardinalidad se
omiten porque no sirven para elegir. El esquema y la tabla los resuelve el servidor a partir de la
capa, nunca el cliente, y cada columna, operador y operacion se valida contra ese catalogo. Lo que
se guarda en el navegador son definiciones, no numeros, asi que una estadistica propia se recalcula
con el municipio seleccionado igual que las oficiales.

Las tres cosas heredan la ficha de receta sin tocarla: una estadistica armada en el visor explica su
cadena de ingredientes igual que una configurada en el CMS.

## [1.141.0] - 2026-08-28

### Cambiado: encuadrar deja la pill y se integra a los controles de zoom

El boton de centrar vivia colgado de la pill de municipio y solo aparecia al pasar el mouse por
encima. Ahora es un boton fijo de la columna de zoom, debajo de ubicacion, y **su alcance depende del
contexto**: con un municipio activo encuadra ese municipio, y sin el encuadra Jalisco. El titulo y la
etiqueta de accesibilidad nombran el ambito, asi que se sabe que hace antes de tocarlo.

Con eso se retira el "centrar en Jalisco" que se revelaba al pasar por el boton de alejar —o tres
segundos despues de un zoom en pantallas tactiles—. Eran dos temporizadores, tres callbacks y un
`isTouchDevice` para sostener un boton que casi nadie encontraba.

El icono adopta la convencion de la columna: **gris `#7C8BAD` en normal y morado `#5C2472` en hover**,
como zoom y ubicacion. Venia en morado por haber nacido en la pill, donde no tenia con que contrastar.
El mismo cambio corrige la leyenda de capa, que ya tenia estados y iba de morado a morado oscuro.

En movil la pill de municipio baja debajo del panel de descargas y su desplegable se limita al
viewport visible, en vez de quedar tapada.

## [1.140.1] - 2026-08-27

### Corregido: las capas ya no se piden completas mientras carga la lista de municipios

Al abrir el visor con un municipio en la URL, la lista de `mapalab.municipios` todavia viaja por red.
Las capas que filtran por nombre no podian resolverlo y se pedian sin recorte —Jalisco entero— para
corregirse un instante despues. Ahora esperan: mientras la lista no llegue, la capa no se solicita.
Las que filtran por clave nunca dependieron de la lista y siguen igual de rapidas.

El aviso de consola que reportaba claves sin nombre se disparaba en esa misma ventana. Como solo
avisa una vez por capa, la falsa alarma del arranque quemaba el aviso y despues callaba los casos
reales. Ahora solo habla cuando la lista ya esta cargada.

## [1.140.0] - 2026-08-27

### Cambiado: la barra de herramientas se contrae solo en movil y tablet

Se contraia por debajo de **1280 px**, el umbral de `TABLET_BREAKPOINT`, que mide otra cosa: la del
sider. Una laptop de 1366x768 con el escalado de Windows al 125 % —lo mas comun— reporta un viewport
de 1093 px, cae del lado «tablet» y perdia las etiquetas sin que hubiera ningun problema de espacio.

El umbral propio de la barra es ahora **1024 px**, asi que movil y tablet en vertical siguen
contraidos y de ahi para arriba se expande. Y la flecha de contraer, que antes se ocultaba por debajo
de 1280 —dejando la barra contraida sin manera de expandirla—, aparece desde 768 px: en tablet el
contraido pasa a ser el estado inicial, no una condena.

La preferencia guardada en `localStorage` estrena un tercer estado. Antes solo distinguia compacto de
expandido, y la ausencia de valor se leia como expandido; ahora **no haber elegido** significa
«decide el ancho de pantalla», y en cuanto la persona toca la flecha su eleccion manda sobre el
breakpoint en las dos direcciones. En movil el contraido se impone de todos modos: ahi no cabe otra
cosa y la flecha no se muestra.

La decision vive en `resolveToolsCollapsed`, una funcion pura con sus pruebas, en vez de estar
repartida entre dos `useEffect` y un booleano. De paso, `useIsMobile` pasa a apoyarse en un
`useMediaQuery` generico, que es lo que el panel duplicaba a mano.

`TABLET_BREAKPOINT` y `TABLET_MEDIA_QUERY` se retiran: la barra era su unico consumidor y el chequeo
de codigo muerto los marcaba.

## [1.139.0] - 2026-08-27

### Agregado: el `/ontoy` declara a que nodo pertenece

huachicol 2.9.0 amplio el contrato para que el monitor agrupe por servidor y no solo por servicio.
`ONTOY_NODE` dice donde corre este repo —**S2**— y `ONTOY_NODE_REPORTER` decide quien habla del
host. Es el reportero de su nodo, asi que su `/ontoy` agrega carga, RAM, swap y uptime, leidos de `/proc` sin exporters ni puertos nuevos.

`ONTOY_PEER_CHECKS` queda disponible para las aristas entre nodos; vacia por omision.

**Las dos primeras son obligatorias**: el compose falla si faltan, asi que hay que agregarlas al
`.env` de cada entorno antes de desplegar.

De paso, `ontoy_server.py` se sincroniza con el de huachicol, que es la fuente y llevaba tiempo
divergiendo entre copias. Los checks de maquina quedan marcados como informativos y ya no tumban el
estado del servicio.

## [1.138.0] - 2026-08-27

### Agregado: el municipio seleccionado queda fijo al recorrer la lista

En el selector, la opcion activa se ancla al borde superior o inferior segun hacia donde se
desplace, asi que con 125 municipios siempre se ve cual esta aplicado.

Necesito fondo opaco: el `bg-orange/10` del seleccionado es semitransparente y al flotar sobre la
lista dejaba ver los renglones de abajo. Se usa su equivalente solido sobre blanco, `#FFF3E6`, mas
una sombra suave para que se lea como flotante y no como un renglon mas.

La lista deja de usar la mascara de degradado del `ScrollContainer`. Esa mascara desvanece el 10 %
superior e inferior, justo donde se ancla el elemento fijo: arriba lo volvia invisible y abajo se lo
comia a medias. Las flechas siguen indicando que hay mas contenido.

### Corregido: el selector tenia dos scrolls anidados

El panel estaba capado a `max-h-[32rem]` y la lista a `max-h-100` fija. Sumando encabezado, buscador
y pestanas el contenido superaba el tope del panel, asi que **scrolleaban los dos**. El efecto
visible: el elemento fijo del inicio de la lista quedaba fuera del area visible y la flecha de mas
contenido caia debajo del recorte.

El contenido pasa a ser una columna flex real: el encabezado no se comprime, la caja de la lista se
queda con el alto que sobra y solo ella desplaza. La lista deja de tener alto fijo y se ajusta al
espacio disponible. Se retira el `sticky` del encabezado, que existia para compensar el scroll de
mas, y el `HIDDEN_SCROLLBAR` que lo ocultaba.

Aplica igual al selector que abre desde la barra de herramientas, al compartir componente.

## [1.137.0] - 2026-08-27

### Agregado: la pill de municipio abre el selector

La pill del encabezado mostraba el municipio activo y al hacer clic centraba el mapa. Ahora abre el
mismo selector que el boton de la barra, reusando `MunicipioFilterPanel`, asi que no hay dos
selectores que mantener.

Centrar y salir del modo pasan a botones que **aparecen al pasar el mouse sobre la pill**: centrar a
la izquierda, salir a la derecha. Van en posicion absoluta para que al aparecer no empujen la pill,
que esta centrada en pantalla; el area de hover es continua —padding en vez de margen— porque con un
hueco de 8 px el boton se escondia antes de alcanzarlo; y llevan medio segundo de gracia para
desaparecer, con `visibility` en lugar de `pointer-events` para que sigan siendo clicables mientras
se desvanecen. Tambien se revelan con foco de teclado.

### Cambiado: el selector de municipio se organiza en pestanas

Municipios por defecto, mas Regiones y ZMG. Al abrir, la pestana se sincroniza con lo que este
activo y la lista hace scroll hasta el elemento seleccionado. El titulo cambia con la pestana.

El elemento seleccionado trae su propia **X para quitar el filtro**, y volver a hacerle clic tambien
lo quita. Se agrega una X para cerrar el panel, y titulo, buscador y pestanas quedan `sticky`. La
opcion de ZMG usa el alto que necesita, al ser una sola.

Se retira «Fuente: IIEG» y el boton «Salir del modo» del panel.

### Corregido: los paneles flotantes se posicionaban con el contenido sin medir

`useFloatingPosition` observaba solo el ancla, nunca el contenido. En la primera apertura el panel
aun no tenia ancho, el centrado calculaba con `offsetWidth` en cero y no se recalculaba nunca porque
el ancla no cambia de tamano. Se veia como un panel corrido media anchura y cortado por el viewport.

Estaba latente: ningun `placement` dependia del ancho del panel hasta que se agrego `bottom`
centrado, que hacia falta para anclar bajo un elemento centrado en pantalla.

### Agregado: la barra de herramientas se compacta sola en tablet

Por debajo de **1280 px** la barra pasa a modo compacto y se oculta su boton de colapso, que ahi no
haria nada. Reacciona con `matchMedia`, asi que al rotar la tablet se ajusta sin recargar.

**No pisa la preferencia manual**: «Compactar barra» se sigue guardando aparte, de modo que una
sesion en tablet no deja la barra compacta en escritorio.

### Cambiado: la mascara del modo municipio deja de tapar el estado

Era negro al **85 %**, que no atenuaba el contexto sino que lo borraba. Pasa a un velo del **18 %**
con el contorno del municipio en morado institucional.

El contorno no cuesta geometria nueva: la mascara ya es un poligono con los municipios como huecos,
asi que el `stroke` traza sus bordes; el borde exterior cae fuera de pantalla porque el extent va
expandido. Los tres valores quedan como constantes al inicio del archivo.

### Cambiado: el boton de desacoplar estadisticas

Baja del encabezado del modal, donde quedaba junto a la X de cerrar, al lado derecho del titulo de
la seccion. Estrena icono propio —un rectangulo vertical con una flecha hacia abajo— en vez de
reusar el de numeralia. El bloque de capa activa lo hereda, al compartir componente.

## [1.136.1] - 2026-08-26

### Corregido: la numeralia con filtro de municipio no hallaba el binding de cuatro workspaces

`_LAYER_BINDING_SQL` localizaba la capa por `workspace_alias || ':' || geoserver_layer`, pero el
`layer_key` que recibe ya viene canonico —`_resolve_layer_key` traduce el alias al workspace real
de GeoServer antes de consultar—. En `desarrollo`, `gobierno`, `recursos` y `seguridad` las dos
formas no coinciden, asi que la consulta devolvia cero filas y `@municipio` se quedaba sin campo
al que apuntar.

No mordia todavia: ninguna de esas capas tiene hoy `stats_config` y un `municipio_field` en su
cadena de padres al mismo tiempo. Se arregla ahora para que no aparezca al configurar la primera.

Mismo cambio en `load_layer_binding` de mariachi, que arrastraba la consulta identica.

## [1.136.0] - 2026-08-21

### Eliminado: el WKT union de `/municipios/geometries`, que ya no lee nadie

Cuando «Vista por municipio» filtraba todas las capas con un mismo
`INTERSECTS(geom, POLYGON(...))`, el backend calculaba el poligono union simplificado y lo mandaba
como `unionWkt`. El WKT median entre 3 y 8 KB y viajaba en la URL de cada capa activa, asi que
`get_union_wkt` traia una biseccion de tolerancia —50, 100, 250, 500, 1000, 2000, 5000 m, y un
`ST_Envelope` de ultimo recurso— para meterlo a la fuerza en 8 000 bytes.

Ese camino murio en la **1.50.0**, cuando `municipioCqlBuilder` paso a armar el CQL por capa. Desde
entonces el WKT se calculaba en PostGIS en cada cambio de seleccion, viajaba por la red y se
descartaba: `municipioService` lo guardaba en un objeto que ningun consumidor leia. Comprobado sobre
todo el repo y sobre mapalab-qgis antes de quitarlo.

Se van `MunicipiosRepository.get_union_wkt` con su biseccion, y los campos `unionWkt`, `unionSrid`,
`unionToleranceMeters` y `unionIsEnvelope` de la respuesta. **`unionBbox` se queda**: es lo que
alimenta el filtro de respaldo `BBOX` de las capas que todavia no declaran su campo de municipio.

La respuesta queda en `type`, `source`, `features` y `unionBbox`.

## [1.135.0] - 2026-08-21

### Cambiado: el boton para aislar una capa ahora se anuncia y dice cual capa aisla

Era un icono de 20 px con un aro morado de 1 px como unica senal de encendido: el mismo aro que
aparece al pasar el mouse, asi que estado y hover se veian igual. Su etiqueta existia en el codigo
pero nunca llegaba a la pantalla — `hideHeaderLabels` sale de `visibleHeaderButtons > 2` y el minimo
es 3, de modo que la condicion siempre fue verdadera. Las pruebas no lo detectaban porque
`getByText` encuentra el nodo aunque lleve la clase `hidden`, que en jsdom no hace nada.

El boton pasa a ser un chip con relleno azul permanente (`#EFF3FC`, el de las tarjetas de datos), lo
que le da presencia frente a sus vecinos, que siguen siendo iconos sueltos. La etiqueta ya no se
oculta nunca. Sus estados:

- **En reposo:** «Solo seleccionada», que dice para que sirve sin haberlo tocado.
- **Encendido:** el nombre de la capa aislada, truncado, con una × que ofrece la salida. Sin ella el
  texto no decia como volver a ver todo.
- **Sin seleccion:** deshabilitado, con la leyenda «Elige una capa». Antes se podia encender sin una
  capa seleccionada y no pasaba nada: el efecto de `ActiveLayersList` sale temprano y el boton
  quedaba encendido con el mapa intacto.

El nombre que muestra el chip sale de la lista del panel, no del objeto de seleccion: cambiar de
capa desde las alternativas del InfoBox guardaba `{ id, name }` **sin `label`**, y el chip se quedaba
sin texto. La resolucion ahora prueba en orden el nombre visible en el panel, el label del arbol y
por ultimo lo que traiga la seleccion, de modo que el chip diga siempre lo mismo que la fila de la
capa — alias incluidos.

El tooltip nombra la capa aislada, para los nombres que no caben. El texto se trunca a 110 px en
movil y 158 px de `md` en adelante, en lugar de desaparecer: ocultarlo devolveria el problema que
este cambio resuelve.

Las etiquetas de «Eliminar mis capas» y «Pausar animaciones» siguen ocultas por el mismo umbral, sin
tocar. Una prueba nueva fija que la del chip permanezca visible y la de eliminar no, para que el
patron no vuelva a colarse.

### Agregado: el visor pide la numeralia con el municipio seleccionado

El endpoint aceptaba contexto desde esta misma version, pero el visor no se lo mandaba: pedia
`/metadata/?workspace=&layer=` y nada mas, asi que la tarjeta de la capa seguia mostrando el total
estatal aunque el mapa estuviera filtrado por municipio.

Ahora `getLayerMetadata` acepta un contexto opcional y el modal de detalle le pasa las claves de
`municipioContext`, el mismo estado que ya alimenta el filtro CQL de las capas. Al cambiar la
seleccion, la metadata se vuelve a pedir: la clave de contexto entra en las dependencias del hook.
Sin municipios seleccionados la peticion es identica a la de antes.

Las claves se ordenan antes de armar la URL, asi que dos usuarios con la misma seleccion en distinto
orden comparten entrada de cache en el gateway.

**Falta el lado temporal.** El servicio ya acepta `fechaInicio` y `fechaFin` y los traduce a
parametros, pero el visor todavia no los manda: la fecha se elige por slot y en modo comparacion hay
dos vivas a la vez, con una sola numeralia en pantalla. Esa decision esta anotada en
`context-ame-esta/ecosistema/planes/numeralia-por-contexto.md`.

### Agregado: la numeralia responde al municipio y al rango de fechas

`GET /metadata/` acepta tres parametros nuevos y opcionales: `municipio` (claves INEGI de cinco
digitos separadas por coma), `fecha_inicio` y `fecha_fin` (`YYYY-MM-DD`). Con ellos la numeralia se
**calcula al vuelo** contra la tabla real de la capa en vez de servir el valor precalculado:

```
/metadata/?workspace=educacion&layer=centros_educativos                        → 15702 establecimientos
/metadata/?workspace=educacion&layer=centros_educativos&municipio=14039        →  1910
/metadata/?workspace=educacion&layer=centros_educativos&municipio=14039,14098,14120 → 4176
```

**Sin parametros no cambia nada**: se sirve `layer_stats.values`, el mismo camino de siempre. Eso
mantiene intacta la home, donde no hay municipio seleccionado, y deja el cron de dataengine como
unico escritor de la numeralia persistida.

Que una estadistica responda al contexto lo decide su configuracion, no el endpoint: solo se filtran
las que declaran filtros con placeholders (`{{municipio.nombres}}`, `{{fecha.inicio}}`). Una
estadistica sin ellos devuelve el mismo numero con o sin parametros, que es lo correcto para un dato
que no depende del municipio.

**Lo que se calcula al vuelo se cachea en memoria** por combinacion de capa, contexto y
configuracion, con el `ttl_minutes` de la propia capa. La clave normaliza el orden de las claves de
municipio, asi que `14039,14098` y `14098,14039` comparten entrada, e incluye una firma de la
`stats_config`: al reconfigurar una capa, las entradas viejas dejan de usarse sin esperar al TTL.
El cache es por proceso y esta acotado a 256 entradas.

**El motor es una tercera copia** de la logica que ya vive en `mariachi/api/app/services/
stats_templates.py` y `dataengine/jobs/run_refresh_layer_stats.py`, en
`backend/app/services/stats_engine.py`. Son tres repos separados sin paquete comun; la alternativa
—que el visor le pidiera el calculo a mariachi— pondria al CMS en el camino de cada peticion
publica. Deuda declarada: una operacion nueva se agrega en los tres.

Las claves de municipio se validan con `^\d{5}$` (maximo 125) y las fechas con `YYYY-MM-DD`; los
valores viajan siempre como bind params.

## [1.134.3] - 2026-08-21

### Corregido: un raster no volvia a dibujarse despues de ocultarlo y mostrarlo

Al ocultar una capa —lo que hace «Solo la seleccionada» con todas las demas— el gestor la **quita
del mapa** y la borra de `wmsLayersRef`; al volver a mostrarla la **crea de cero**. Los parametros
iniciales salian de `buildLayerCqlSegment`, que trataba el filtro `date` de la capa como CQL. En un
raster con dimension TIME ese filtro no es CQL: es el instante `2025-03-01`. La capa nacia entonces
con `CQL_FILTER=(2025-03-01)` y sin `TIME`, y GeoServer respondia `Could not parse CQL filter list`
en vez de la imagen.

Por eso fallaba solo al regresar y no en la primera activacion: la primera vez la capa se crea antes
de que se aplique la fecha por defecto, asi que nace limpia y `useWMSFilterUpdater` le pone el `TIME`
cuando cambian los filtros. Al re-mostrarla el filtro ya existe, el CQL invalido queda horneado en la
fuente, y ese effect no vuelve a correr porque depende de `filters` y los filtros no cambiaron.

`buildLayerCqlSegment` ya no convierte en CQL el filtro de una capa `timeEnabled`, y el gestor siembra
`TIME` —y el estilo resuelto por patron— al crear la capa, con el mismo criterio que ya usaba
`useWMSFilterUpdater`. Es el tercer sitio donde el instante TIME se confundia con una expresion CQL,
despues de la descarga y de la leyenda.

Verificado contra el GeoServer de sextante: el GetMap con `TIME=2025-03-01` devuelve el PNG; el mismo
GetMap con `CQL_FILTER=(2025-03-01)` devuelve la excepcion.

## [1.134.2] - 2026-08-21

### Corregido: la leyenda no aparecia en las capas raster con dimension TIME

`useWMSLegend` decidia mandar el filtro de fecha como `CQL_FILTER` mirando `timeStylePattern`. Pero
en una capa con `timeEnabled` el filtro guardado **no es CQL**: es el instante TIME (`2025-03-01`).
En las capas que ademas tienen patron de estilo la condicion lo tapaba por accidente; en las que no,
el valor viajaba tal cual y GeoServer respondia `Could not parse CQL filter list`. Como devuelve la
excepcion con HTTP 200 y cuerpo XML, el `<img>` fallaba al decodificar y `LegendImage` se ocultaba:
ninguna leyenda, ningun error visible.

Afectaba a **Temperatura media mensual** en el visor, tanto la leyenda del panel como el icono de
simbologia junto al nombre de la capa. Las anuales nunca tuvieron filtro de fecha y por eso si se
veian, lo que hacia parecer que el problema era de los raster en general.

La condicion ahora mira `timeEnabled`, que es lo que de verdad determina si el valor es un instante
TIME o una expresion CQL, el mismo criterio que ya usa `useWMSFilterUpdater` para elegir entre el
parametro `TIME` y `CQL_FILTER`. El Catalogo no estaba afectado: ahi el CQL ya se anulaba a mano
para raster.

Verificado contra el GeoServer de sextante: la peticion con `CQL_FILTER=2025-03-01` devuelve la
excepcion, y sin el filtro devuelve el PNG de la leyenda.

## [1.134.1] - 2026-08-21

### Corregido: el scrollbar del detalle de capa volvio a verse como el del navegador

`html` declara `scrollbar-color`, que es una propiedad **heredada**, asi que llegaba hasta el div del
modal. Desde Chrome 121 un elemento con `scrollbar-color` o `scrollbar-width` en efecto hace que el
navegador ignore por completo los `::-webkit-scrollbar`, y con ellos el `width: 4px` de
`.scrollbar-thin`. El codigo nunca cambio: la regla esta en el repo desde el commit inicial y el
modal conserva sus clases. Lo que cambio fue el navegador, cuando estreno soporte al estandar.

Medido en Chrome 151 sobre el CSS real, el contenedor pasaba de 4 px a 15 px de ancho de barra.

`.scrollbar-thin` y `.scrollbar-thumb-gray-*` ahora declaran tambien las propiedades estandar
(`scrollbar-width` y `scrollbar-color`), que es la via que Chrome y Firefox respetan por igual; las
reglas webkit se conservan para Safari. La barra queda en 10 px: el estandar solo acepta `auto`,
`thin` o `none`, de modo que no hay forma de pedir los 4 px originales sin volver a depender de una
API que Chrome ya esta dejando morir.

Alcanza a los tres contenedores con scroll propio: el detalle de capa, el `Modal` generico y el menu
de descarga, que ademas nunca tuvo las clases y salia con la barra del navegador en todos lados.

## [1.134.0] - 2026-08-19

### Corregido: la cuarta capa agregada se dibujaba en negro

El minificador de CSS comprime `#117733` a **`#173`**, su forma corta de tres dígitos, que es CSS
perfectamente válido. Pero la rampa leía el color con cortes fijos de dos caracteres, así que el
tercer canal salía `NaN` y OpenLayers, ante un color inválido, pinta negro; la leyenda usaba la
misma rampa rota y salía vacía.

Sólo le ocurría a los colores cuyos tres pares son repetidos, y en la paleta sólo el cuarto lo
cumple: de ahí que fuera siempre la cuarta capa y ninguna otra. Ahora el valor se normaliza al
leerlo del token y dentro de las funciones que lo descomponen.

### Agregado: el aislar, el relleno y el color de cada capa sobreviven al F5

Tres cosas que se perdían al recargar y ahora viajan en la sesión:

- **El modo «solo la capa seleccionada»**, a nivel de mapa, porque no es propiedad de ninguna capa
  sino de cómo se está mirando.
- **El relleno de los hexágonos**, por capa, y sólo cuando está apagado.
- **El tono asignado a cada capa agregada**, para que vuelva con su mismo color en vez de repartirse
  otra vez por orden de aparición.

El tono se guarda como índice y sólo si la capa está agregada. Se comprueba con `Number.isInteger`,
no con una condición ingenua: el primer tono es el **0** y la primera capa habría perdido su color.

La opacidad ya persistía desde antes; el fallo de ayer era que no se aplicaba a las capas agregadas.

### Cambiado: «solo la capa seleccionada» pasa de acción a modo

Antes calculaba la visibilidad una vez y se olvidaba: al cambiar de capa seleccionada, el mapa
seguía mostrando la anterior. Ahora es un estado que **sigue a la selección** mientras está
encendido. Y dejó de ser derivado: se deducía comparando la visibilidad de todas las capas, lo que
daba falsos positivos si por casualidad ocultabas las demás a mano.

El botón mantiene el borde morado mientras está activo, perdió el contador y estrena icono —tres
capas apiladas con la de arriba destacada—, porque el ojo genérico ya se usa para la visibilidad
individual de cada capa y tenerlo en dos sitios con significados distintos era parte del problema.

### Cambiado: el segmento sólo aparece en la capa seleccionada

En las demás se ve el icono del modo activo: hexágono si está agregada, punto si no. Además el riel
del control pasa a blanco con el botón activo en gris, porque en el fondo lila del item seleccionado
el riel gris se perdía.

## [1.133.0] - 2026-08-18

### Cambiado: el control de hexágonos vuelve al item de su capa

Estaba en la barra del panel, junto al switch IIEG/INEGI, y ahí parecía que aplicaba a todas las
capas. Vuelve al item de la capa que afecta, **ocupando el sitio del icono de tipo de geometría** en
la misma fila del nombre: así no añade un renglón al item. Sus dos opciones son iconos —un punto y
un hexágono— con el nombre en el tooltip, y en las capas que no admiten agregación el icono de tipo
se queda como estaba.

### Agregado: botón para quitar el relleno de los hexágonos

El relleno se apagaba solo en las capas que no estaban seleccionadas, y eso obligaba a cambiar de
capa para ver otra cosa. Ahora es un botón por capa que **ocupa el lugar del de opacidad mientras la
capa está en hexágonos**, en la barra de acciones del item: se queda como lo dejes.

### Cambiado: el botón de visibilidad aísla la capa seleccionada

Antes alternaba entre mostrar y ocultar **todas**, que con una sola capa activa no hacía nada útil.
Ahora deja visible sólo la capa seleccionada y sus hijas, y al pulsarlo de nuevo devuelve todas.
Perdió el contador —decía cuántas capas se ven, que no es lo que hace el botón—, ganó un tooltip que
explica el efecto antes de pulsarlo y estrena icono: tres capas apiladas con la de arriba destacada,
que dice lo que hace mejor que el ojo genérico.

### Cambiado: la etiqueta de estado de capa se reduce a su inicial

«Actualizada», «Nueva» y «Próximamente» ocupaban más que el nombre de la capa en un panel estrecho.
Queda un círculo con la inicial —**A**, **N**, **P**— junto al icono de tipo de geometría, y el
nombre completo, su descripción y la fecha de vigencia pasan al tooltip.

## [1.132.1] - 2026-08-18

### Corregido: el zoom no reagrupaba las capas que vienen precalculadas

Al cambiar de zoom sólo se reagrupaban las capas que descargan sus puntos. Las precalculadas no los
tienen —traen celdas ya contadas— así que se quedaban con la resolución de su primera carga: unas
capas cambiaban de tamaño de celda al alejar y otras no, en el mismo mapa. Ahora vuelven a pedir la
resolución que toca, y cada capa recuerda con cuál quedó para no repetir la petición.

### Corregido: el relleno no seguía a la capa seleccionada

El panel de capas activas muestra **grupos**, y la comprobación se hacía contra las hojas del grupo,
donde el id del grupo nunca aparece. Resultado: al seleccionar cualquier capa, ninguna se rellenaba.
Ahora se compara contra la hoja seleccionada y sus hijas.

### Corregido: las capas sin relleno se veían todas del mismo color

El contorno tomaba el color de **la clase de cada celda** —el de la rampa—, y en las celdas de
conteo bajo ese color es casi blanco: las capas de fondo quedaban pálidas e indistinguibles entre
sí. Ahora usa el tono base de su capa. De paso el borde pasa a **0.9 px con 45 % de opacidad**, para
que acompañe sin competir con la capa que sí lleva relleno.

### Corregido: el control de opacidad no afectaba a los hexágonos

Cuando las peticiones se agruparon por tabla, el registro de capas pasó a indexarse por grupo, pero
el efecto de opacidad seguía usando esa clave como si fuera un id de capa: no encontraba nada y
dejaba la opacidad en 1. Es el tercer sitio que quedó apuntando al id de capa después de ese cambio,
junto con el clic y el relleno.

### Cambiado: el tono de cada capa ya no depende de su posición en el panel

Se asignaba por orden de aparición, así que reordenar el panel repintaba las capas. Ahora el tono se
reserva cuando la capa entra en hexágonos y se conserva mientras siga agregada; al salir se libera
para que lo tome la siguiente. **Sigue reasignándose al recargar la página**: el registro vive en
memoria y no viaja en la sesión.

El reagrupado por zoom salió a su propio hook, `useHexbinZoomRefresh`, y la elección de tono libre a
`menorTonoLibre`, porque el manager se había pasado del máximo de 300 líneas.

## [1.132.0] - 2026-08-18

### Agregado: varias capas en hexágonos se distinguen entre sí

Con una sola rampa morada, dos capas agregadas a la vez se veían igual y no había forma de saber
cuál era cuál. Ahora cada capa toma un tono de una **paleta categórica de cinco** —`--color-viz-cat-*`—
y su escala va de claro a ese tono. A partir de la sexta los tonos se repiten, y está bien: con seis
superficies encimadas no se distingue nada por mucho color que se les ponga.

Los cinco tonos salen del morado institucional más cuatro de Okabe-Ito, la referencia para
daltonismo. Medido: el par más cercano bajo deuteranopia queda en 37 sobre 255, por debajo de los 40
que uno querría, y no hay combinación de cinco que lo supere. Se compensa por dos vías: los tonos
están separados en luminancia y, sobre todo, **sólo la capa seleccionada lleva relleno**.

Esa es la otra mitad del cambio: las capas agregadas que no están seleccionadas se dibujan **sólo
con el contorno** de su tono. Se sigue viendo dónde cae cada una, pero una sola compite por la
atención, que es la única forma de que un mapa de densidad se lea. Es la opción A del plan
`jerarquia-visual-capas.md`, aplicada aquí.

La leyenda de cada capa usa su propia rampa, tanto en el panel como en el mapa exportado.

## [1.131.1] - 2026-08-18

### Corregido: los hexagonos no aparecian en el zoom inicial

El visor pide la resolucion 5 al abrir el mapa y el precalculado no la tenia, asi que las capas
grandes caian al calculo en el navegador y el tope de 20 000 las rechazaba: en delitos no habia
forma de ver hexagonos. dataengine ya guarda de la 3 a la 8, y cuando el zoom pide una mas fina
—de la 9 en adelante— el visor usa la mas fina disponible en vez de rendirse.

La capa se movio al workspace `mapalab` de GeoServer, porque en `general` el reapuntado de
datastores de sextante la dejaba inservible.

## [1.131.0] - 2026-08-18

### Agregado: los hexágonos usan los conteos precalculados cuando existen

dataengine precalcula los conteos H3 de las capas de puntos (su 1.34.0) y sextante los publica como
`general:hexbin_agregado`. El visor los usa ahora en vez de descargar los puntos y contarlos.

La diferencia es de escala: la capa peor, `delitos_fiscalia_violencia_familiar`, pasa de traer
**110 215 puntos y 50 MB** a traer **2 169 hexágonos ya contados**. Y como el tope de 20 000
elementos existía para proteger esa descarga, deja de aplicar en este camino.

Se usa lo precalculado sólo cuando **coincide con lo que el servidor agregó**: sin filtros del
usuario, sin recorte por municipio y en una de las cuatro resoluciones que el job guarda —3, 4, 6
y 7—. En cualquier otro caso se cae al cálculo en el navegador, que respeta cualquier filtro. Si la
capa no está precalculada, la petición vuelve vacía y el visor sigue por el camino de siempre, sin
error visible.

La leyenda, el clic sobre la celda y el resaltado no cambian: las celdas precalculadas llegan con el
mismo índice H3 y el mismo conteo que las calculadas en el cliente, porque **Python y JavaScript
devuelven la misma celda para el mismo punto**.

## [1.130.0] - 2026-08-18

### Agregado: paleta secuencial propia para la agregación de datos

`identidad-visual.md` exige una paleta **secuencial** para datos ordenados, y mapalab no tenía
ninguna: sólo los tokens de marca. Se declaran `--color-viz-seq-1` … `-5` y la rampa del hexbin los
lee en runtime, con los hex como respaldo, así que cambiar el token cambia el mapa sin recompilar.

Al validarla salió una mejora: la rampa anterior arrancaba en `#EDE0F3`, con **1.27 de contraste
contra blanco**, y la celda de menos elementos era casi invisible sobre el mapa. La nueva arranca en
`#E6D3EF` y gana en las dos dimensiones que importan: **1.41 contra blanco** y **1.51 de salto
mínimo entre clases**, antes 1.41. Sigue siendo monocroma derivada del morado institucional, así
que es segura para daltonismo por construcción.

Los tokens van en `:root`, no en `@theme`: **Tailwind 4 hace tree-shaking de los tokens de `@theme`
que ninguna clase utilitaria usa**, y éstos los consume JavaScript. Puestos ahí, no llegaban al CSS.

### Corregido: la resolución de los hexágonos estaba mal en los extremos del zoom

La tabla que traduce zoom a resolución H3 daba **97 celdas a lo ancho en el zoom 5** —una maraña— y
sólo **8 en el 17**. Recalculada contra el tamaño real de las celdas en Jalisco y un viewport de
1 200 px, todo el rango 5–18 queda ahora entre **11 y 48 celdas**. Para cubrir la vista más alejada
hubo que admitir la resolución 3, de celdas de 75 km.

Un test recorre los catorce niveles de zoom y falla si alguno sale de ese rango, para que la tabla
no se vuelva a ajustar a ojo.

### Corregido: el mapa exportado llevaba la leyenda equivocada

Al exportar una capa en modo hexágonos se incrustaba la leyenda **del servidor**, que describe la
simbología de los puntos y no la escala de la agregación. El PDF dibuja ahora los recuadros de
color del hexbin con sus rangos.

### Cambiado: la leyenda del hexbin en el panel de capas

Sin el encabezado «Elementos por celda» y con más aire respecto al contenedor.

### Eliminado: el desglose por atributo que ya nadie leía

Cuando el clic sobre un hexágono pasó al Resumen de Selección, el desglose por atributo se quedó
huérfano: se calculaba en cada agregación —un `Map` por celda, 4 802 de ellas en la resolución 8, más
un barrido de 500 elementos para elegir el campo— y ningún componente leía el resultado. El Resumen
ya da ese desglose por capa. Se retiró también la lista de elementos que cada celda guardaba, que
retenía referencias a todas las geometrías.

## [1.129.0] - 2026-08-17

### Agregado: las capas de puntos se pueden ver agrupadas en hexágonos

El control del panel de capas activas pasa de decir el protocolo a decir el resultado:
**`Puntos | Hexágonos`**. En Hexágonos los puntos se agrupan en celdas y cada una se colorea según
cuántos caen dentro, con la escala en cinco clases por cuantiles. Sólo aparece en capas de puntos
—35 tablas del catálogo—, sólo en `beta` y `dev`, y con badge BETA.

Las celdas son **H3**, el índice hexagonal jerárquico, no una rejilla dibujada al vuelo. La
diferencia importa: cada celda tiene un identificador estable y resoluciones anidadas, así que dos
capas distintas caen en las mismas celdas y se pueden comparar, y lo que mañana se calcule en la
base de datos coincidirá con lo que hoy se calcula en el navegador.

La resolución sale del zoom con una tabla explícita en `constants/hexbin.js`, medida contra el
tamaño real de las celdas en Jalisco: la 5 ronda los 10 km de lado y la 9 los 219 m. Al cambiar de
zoom se reagrupa con los puntos que ya están en memoria, sin volver a pedir nada al servidor.

Medido con `educacion:centros_educativos`, que con 15 702 puntos es el caso más pesado que el tope
admite: **37 ms** para agrupar en la resolución más gruesa, 1 342 celdas y hasta 656 puntos en la
más densa.

El clic sobre un hexágono **abre el Resumen de Selección**, el mismo panel de la herramienta de
selección por polígono: usa la celda como polígono, así que hereda su conteo, su paginación, su
descarga a CSV y su vista expandida sin panel nuevo. La celda elegida se marca con borde naranja
sobre el relleno morado.

La leyenda es propia —la del servidor describe otra cosa— y cumple lo que pide
`ecosistema/identidad-visual.md`: paleta secuencial y leyenda obligatoria en mapas.

En el panel, el badge de geometría cambia al icono de hexágono cuando la capa está agrupada. Los
iconos de tipo de capa perdieron el círculo que los envolvía y pasaron a naranja; el de polígono
es ahora un triángulo, porque el pentágono anterior se confundía con el del hexbin.

**El modo «Datos» desaparece de la interfaz.** Nadie debería elegir un protocolo: lo que hacía
—traer las geometrías al navegador— es ahora el motor de Hexágonos.

### Cambiado: el Resumen de Selección muestra el símbolo de cada capa

Cada renglón del resumen lleva el símbolo de su capa, con el mismo mecanismo que ya usaban las
alternativas de capa: `GetLegendGraphic` en JSON, con cache por capa, así que cada símbolo se pide
una vez por sesión.

Y se corrigió de paso **qué símbolo se pide**. Se tomaba siempre la primera regla del SLD, pero las
capas traen varias —`unidades_salud` tiene 4 y `centros_educativos` **16**—, cada una con su nombre
y su filtro. Ahora la regla se casa con el nodo por nombre, y si no coincide, por su `cqlFilter`.
En `centros_educativos` el símbolo estaba mal en 15 de 16 nodos; el fallo venía de las alternativas
de capa, no del resumen.

También se le quitó la **X** al encabezado del Resumen de Selección: el cierre ya lo da la barra de
acciones, y la X de cada tarjeta sigue sirviendo para descartar un elemento suelto.

## [1.128.1] - 2026-08-17

### Corregido: el tope de elementos del modo Datos nunca se aplicaba

El guardarraíl que debía impedir traer una capa enorme al navegador estaba muerto desde que se
publicó. Pedía el conteo con `resultType=hits` y `outputFormat=application/json`, pero **GeoServer
ignora el `outputFormat` en un `hits` y responde XML**; el parser del visor devuelve `null` ante
XML, así que el conteo siempre era `null` y la comparación contra el máximo nunca se cumplía.

Ahora el total se lee del atributo `numberMatched` del XML, con el JSON como respaldo, y un error
HTTP se propaga en vez de pasar por «no sé cuántos son» —que era la otra forma de colarse—.

Lo que dejaba pasar, medido contra el servidor: `delitos_fiscalia_violencia_familiar` tiene
**110 215 puntos**, unos 75 MB de GeoJSON. También quedó medido el peso por elemento, que era el
número que faltaba para justificar el tope: **≈700 bytes**, así que 20 000 elementos son ~14 MB.

### Agregado: el segmento de servicio lleva badge BETA

El mismo distintivo que ya usan el catálogo y el filtro de municipio, con el que se anuncia que la
función está en prueba. Sigue apareciendo sólo en `beta` y `dev`.

## [1.128.1] - 2026-08-17

### Corregido: las etiquetas anidadas no desplegaban sus capas

«Establecimientos de salud» reparte sus 33 capas en cuatro etiquetas —«Primer nivel», «Segundo
nivel», «Tercer nivel», «Otros»— y ninguna se abría, así que el grupo se veía vacío por dentro. La
expansión se pedía mientras se construía el ítem, antes de que existiera en el árbol, y Qt la
ignora: ahora se recorre el árbol ya montado, después de poblarlo. Con eso las cuatro etiquetas
abren sus 13, 9, 5 y 6 capas, y las categorías también arrancan abiertas como en el visor.

### Corregido: la aspa quitaba la capa de la leyenda pero no del lienzo

Faltaba refrescar el lienzo tras retirarla del proyecto, así que el dibujo anterior se quedaba en
pantalla hasta el siguiente movimiento del mapa.

### Cambiado: la aspa va a la izquierda de la etiqueta

Estaba a la derecha, donde compite con el badge y el glifo de geometría. Ahora abre la fila y el
texto se recorre para dejarle su lugar.

## [1.128.0] - 2026-08-17

### Agregado: quitar una capa desde el propio catálogo

Las filas cuya capa ya está en el mapa muestran una **aspa** a la derecha que la retira del
proyecto. Sirve además como señal de estado: si la fila tiene aspa, esa capa está cargada.

Sale solo en las capas, no en los grupos —esos se retiran desmarcando su casilla— y desaparece en
cuanto la capa deja el proyecto, la quites desde aquí o desde el panel de capas de QGIS.

## [1.127.2] - 2026-08-17

### Cambiado: la píldora del badge y el realce de las categorías

El badge del árbol —«Actualizada», «Nueva»— llevaba un radio fijo de 7 px, que con la altura real
de la fila dejaba las esquinas a medio redondear en vez de la píldora del visor. Ahora el radio se
calcula como la mitad del alto, así que es píldora siempre.

Las categorías dejan de pintar fondo al pasar por encima o al seleccionarlas: se realzan
poniéndose en negrita. Son filas de organización, y el fondo las hacía parecer seleccionables como
una capa.

## [1.127.1] - 2026-08-17

### Corregido: las etiquetas y el badge salían diminutos

El `theme.qss` declara la fuente en **píxeles**, así que `pointSizeF()` devuelve -1 y la resta que
achicaba etiquetas, categorías y badge caía siempre en el mínimo de 6 puntos: se veían la mitad de
lo que debían y el árbol quedaba disparejo. Ahora se encoge por `pixelSize` cuando la fuente está
en píxeles, un píxel para las etiquetas y dos para el badge, con piso en 10.

## [1.127.0] - 2026-08-17

### Cambiado: el árbol del plugin usa los tipos que declara el catálogo

El árbol ya traía `nodeType` en cada nodo y el plugin lo ignoraba, así que estaba adivinando por
la forma del subárbol: contaba hojas y tablas para decidir qué era un grupo. Ahora usa lo que dice
el catálogo, que es lo mismo que usa el visor:

| Tipo | Cómo se ve | Qué hace |
|---|---|---|
| `tema` | negrita, ícono, barra de acento | se abre y cierra |
| `category` | gris tenue, un punto menor | se abre y cierra, arranca abierta |
| `label` | negrita en el morado de la marca | **no colapsa**: es un encabezado |
| `group` | texto normal con **casilla** | trae o retira el grupo completo |
| `leaf` | texto normal con glifo de geometría | es una capa |

La casilla pasa a los **19 nodos que el catálogo declara `group`** —Establecimientos de salud,
Clasificador de cultivos IIEG, Centros educativos, Aeropuertos, los robos— en vez de los 29 que
salían de la heurística, que incluía etiquetas como «Primer nivel» y categorías como «Acceso a
servicios de salud».

Las filas que sí se pueden plegar llevan ahora un **chevron** a la derecha, que apunta abajo
cuando están abiertas: antes no había ninguna señal de que se pudieran plegar, porque el `theme.qss`
apaga el indicador de rama de Qt. Las etiquetas no lo llevan, porque no se pliegan.

Los glifos de geometría salen de `delegate.py` a `gui/glifos.py`; el delegate se estaba acercando
al máximo de líneas del repo.

## [1.126.0] - 2026-08-17

### Cambiado: las filas de organización se ven como lo que son

En el árbol conviven tres cosas distintas que se veían igual: los temas, las capas y los nodos que
solo agrupan. Estos últimos —«Acceso a servicios de salud», «Medio Físico»— van ahora un punto más
chicos y en el gris tenue del `theme.qss`, sin casilla ni glifo, que es lo que les corresponde: no
se agregan, solo ordenan.

Los grupos de propiedades quedan con su texto normal y su casilla, y las capas con su glifo de
geometría, así que las tres filas se distinguen de un vistazo.

## [1.125.1] - 2026-08-17

### Corregido: la casilla salía en temas donde no significa nada

Aparecía en cualquier nodo con más de una capa debajo, así que «General» o «Pobreza y
vulnerabilidades» —dieciséis tablas distintas— ofrecían marcarse enteros, que no es lo que la
casilla resuelve. Ahora sale solo donde los hijos son **propiedades de la misma tabla**:
Establecimientos de salud, Clasificador de cultivos IIEG, Usos de suelo serie VII y los demás del
mismo corte, **29 de los 48 grupos** del catálogo.

Los grupos de varias tablas se siguen pudiendo agregar enteros desde el botón, que para eso
cambia su texto al seleccionarlos.

## [1.125.0] - 2026-08-17

### Cambiado: el grupo se marca desde su propia fila

La casilla vive ahora en la fila del tema, en el árbol, en vez de obligar a seleccionarlo y bajar
al botón. Marcarla trae el grupo completo con las mismas reglas de siempre —junto por tabla, con
los filtros combinados— y desmarcarla retira esas capas del proyecto, incluido el grupo de QGIS
que hubieran creado si quedó vacío.

Para poder retirarlas, cada capa que entra por esta vía queda marcada con `mapalab/grupoId`, y de
ahí sale también el estado de la casilla: si borras las capas a mano en el panel de QGIS, la
casilla se desmarca sola. Las hojas no llevan casilla; se siguen agregando con el botón, que
mantiene su texto contextual.

## [1.124.0] - 2026-08-17

### Agregado: la casilla «Traer la tabla completa»

Desde que el nodo aplica su filtro y el grupo combina los suyos, no quedaba forma de pedir la
tabla tal como está publicada en GeoServer, que es lo que el plugin hacía siempre hasta 1.121.0.
La casilla, debajo de los botones del panel, ignora el filtro del catálogo tanto al agregar como
al descargar: «Maíz» con ella marcada trae los veinte cultivos, y el grupo entero también.

Sigue apagada por omisión, que es el comportamiento que se pidió: lo que eliges en el árbol es lo
que ves.

## [1.123.0] - 2026-08-12

### Agregado: un grupo del catálogo se agrega completo

Consecuencia de que cada nodo traiga ya su filtro: para ver los ocho cultivos había que agregarlos
de uno en uno. Ahora, al seleccionar un grupo en el árbol, «Agregar al mapa» pasa a decir «Agregar
grupo completo» y lo trae entero.

No es una capa por nodo, que serían 33 peticiones para Establecimientos de salud. El grupo se
junta **por tabla de GeoServer**: los nodos que comparten tabla entran como una sola capa con sus
filtros combinados en un `OR`, y si el grupo toca varias tablas, cada una es una capa dentro de un
grupo de QGIS con el nombre del tema. Los 33 nodos de salud y los 8 de cultivos quedan en una capa
cada uno; «Pobreza y vulnerabilidades», que son 16 tablas distintas, en 16 capas agrupadas.

El `OR` se usa mientras quepa en 4000 caracteres, y si no, la capa va sin filtro. El caso más
largo del catálogo es justo el de salud: 3321 caracteres, que el servidor responde sin problema
—medido— y que importa mantener, porque sin filtro se dibujan registros de la tabla que no están
en el grupo.

## [1.122.0] - 2026-08-12

### Cambiado: el nodo del catálogo trae lo suyo, no la tabla entera

El plugin ignoraba el `cqlFilter` del nodo, así que elegir «Maíz» dibujaba los veinte cultivos, y
la descarga escribía siempre el mismo `cultivos.gpkg` con todo dentro. Era una decisión del plan
—traer la tabla completa y dejar el filtro como casilla opcional—, y en uso real desconcierta.

Ahora agregar y descargar aplican el filtro del nodo, y el GeoPackage filtrado se nombra
`{tabla}_{nodo}.gpkg` para no pisar al de al lado. Medido sobre `economia:cultivos`: el render pasa
de 275 KB a 155 KB y el WFS de 346 836 a 135 544 entidades. La consulta por clic ya mandaba ese
filtro, así que las tres rutas coinciden. El árbol no cambia: los nodos se siguen viendo como en
el visor.

### Corregido: los glifos de geometría del árbol no se distinguían

Estaban dibujados a 11 px con formas planas —una elipse, una diagonal, una barra rellena—, y a ese
tamaño el de polígono se leía como una raya igual que el de línea. Ahora son los mismos cuatro
íconos del visor, a 16 px: tres vértices sueltos para punto, la polilínea quebrada con sus dos
vértices para línea, el pentágono con relleno al 18 % para polígono y la malla de dos por dos para
ráster.

### Corregido: el resalte de la selección seguía saliendo amarillo

Fijar `selectionColor` en la capa no basta: el lienzo lo ignora en silencio si antes no se declara
`setSelectionRenderingMode(CustomColor)`. Con las dos cosas, el elemento consultado se resalta en
el morado de la marca.

### Cambiado: la ficha del elemento se ajusta a lo que trae

Abría siempre con el tamaño que QGIS recordara, así que una capa de tres campos dejaba medio
diálogo vacío y una de treinta obligaba a hacer scroll desde la primera fila. Ahora la ficha la
abre el plugin y se dimensiona al contenido, con mínimo de 320×180 y tope de 720×640, acotado
además al 75 % de la pantalla disponible.

## [1.121.0] - 2026-08-12

### Agregado: cada capa se puede traer como mapa o como datos

El item de capa activa estrena un segmento «Mapa | Datos». En **Mapa** todo sigue igual: el
servidor dibuja la imagen y manda la simbología oficial. En **Datos** la capa se pide por WFS como
GeoJSON, las geometrías viven en el navegador y el clic se resuelve sin ir a la red, con
`forEachFeatureAtPixel` en vez de un `GetFeatureInfo` por cada punto.

No hizo falta tocar el backend ni el catálogo: `wfsAvailable` y `geometryType` ya viajaban en el
árbol de capas. El segmento solo aparece donde tiene sentido — capas con WFS publicado, con tipo
de geometría y que no sean ráster ni grupos—, así que `curvas_de_nivel` y las capas de lluvia y
temperatura no lo muestran.

Se pide `resultType=hits` antes de cambiar de modo: por arriba de 20 000 elementos la capa se
queda en modo mapa y el item explica por qué, en vez de colgar el navegador con una descarga que
no iba a terminar bien. La simbología en modo datos es genérica, derivada del tipo de geometría,
y por eso la leyenda del servidor se oculta: describe un SLD que ya no es el que se está viendo.

El modo viaja en los mapas compartidos y en la sesión, pero solo se escribe cuando difiere del
default, así que los shares que ya existen no cambian de tamaño ni de forma. Por ahora el control
solo se muestra en `beta` y `dev`; producción queda exactamente como estaba.

### Cambiado: el filtro CQL y el z-index de las capas salieron a helpers propios

`useWMSLayerManager` calculaba el segmento CQL de cada capa —filtro base, filtro dinámico, recorte
por municipio y el `1=0` de las capas con `defaultDate`— y su z-index dentro del propio hook. Los
dos se movieron a `helpers/layerCqlSegment.js` y `helpers/layerZIndex.js` para que el modo
vectorial use exactamente el mismo cálculo en vez de una copia condenada a desincronizarse. El
comportamiento del WMS no cambia: lo cubren los mismos tests de antes.

## [1.120.0] - 2026-08-12

### Agregado: el switch del plugin cambia la geometría con la que se dibuja

El switch movía las capas de límites, pero las temáticas seguían dibujándose con la geometría del
IIEG aunque estuviera en INEGI. Le faltaba lo que el visor sí manda desde `useWMSLayerManager`: el
parámetro `ENV` del WMS, `geom:geom_iieg` o `geom:geom_inegi`, con el que GeoServer elige la
columna geométrica. Comprobado contra el servidor: el mismo tile de `poblacion_mujeres` pesa 63 KB
con una y 70 KB con la otra.

Las capas nuevas nacen con el `ENV` del modo vigente, y al cambiar el switch se reescribe el de
todas las capas del plugin ya cargadas, sin quitarlas ni volver a agregarlas. La consulta por clic
manda el mismo `ENV`, así que en modo INEGI devuelve la geometría del INEGI.

### Corregido: la selección se perdía en las capas con dos geometrías

`Could not store attribute "geom_inegi"`, y con eso se caía la copia entera del elemento. Las
capas del ecosistema traen dos columnas geométricas, `geom_iieg` y `geom_inegi`, y el proveedor
WMS de QGIS declara **todos** los campos del `GetFeatureInfo` como texto, incluida esa: el filtro
por tipo del release anterior no la veía llegar, porque su tipo declarado era legítimo y lo que no
encajaba era el valor, un objeto entero.

Ahora la decisión se toma por el valor y no por el tipo declarado, así que las columnas
geométricas quedan fuera de la ficha por las dos rutas de consulta —el `GetFeatureInfo` directo ya
las excluía por tipo— y lo que sí es dato se convierte a texto cuando hace falta en vez de tumbar
el guardado.

### Cambiado: el clic consulta la capa que tengas seleccionada

El orden es explícito: si hay una capa seleccionada en el árbol del catálogo manda esa —cargada o
no—; si no, la capa activa del panel de capas de QGIS, siempre que sea del plugin; y solo si no
hay ninguna de las dos, la primera que responda de arriba abajo, que era el único criterio hasta
ahora.

Para que ese orden se sostenga, la ficha ya no cambia la capa activa: antes dejaba activa la capa
de selección, y con eso el segundo clic habría dejado de consultar la capa que el usuario tenía
elegida.

### Cambiado: la capa de selección va en el morado de la marca

Era el color aleatorio de QGIS al 50 % de opacidad. Ahora toma el primario del `theme.qss` de
mariachi: relleno del mismo morado con alfa 60 —el «morado bajito»— y borde sólido, para que se
lea encima de cualquier capa sin taparla.

## [1.119.0] - 2026-08-12

### Agregado: el switch IIEG | INEGI en el plugin de QGIS

El mismo control que el visor tiene sobre las capas activas, ahora en la barra del panel: IIEG
pone `limite_iieg`, `limite_municipal` y `regiones`; INEGI pone `limite_inegi` y
`limite_municipal_inegi`, y cada lado retira el del otro. Las capas se insertan al tope del árbol
de QGIS, que es el equivalente del pinning always-on-top del visor.

Como en el visor, el modo no es un estado que el plugin guarde: se deduce de lo que hay en el
proyecto. Cada capa que agrega el plugin queda marcada con la propiedad `mapalab/nodeId`, y el
switch lee esa marca de las capas del proyecto cada vez que QGIS agrega o quita una, así que
también se entera de lo que el usuario haga a mano en el panel de capas. Reconoce además las
capas por el `layers` de su URI WMS, para no ignorar las que se agregaron antes de que existiera
la marca. Sin ninguna de las cinco,
el switch se muestra neutro y el primer clic simplemente agrega el conjunto elegido.

El botón de recargar el catálogo cede su lugar al switch y se muda junto al buscador, provisional
mientras se le encuentra un sitio definitivo. El árbol del panel sale de `dock.py` a `gui/arbol.py`
y el estilo del switch toma sus colores del `theme.qss` que emite mariachi, sin hardcodear
ninguno. El lado activo lleva la misma sombra que el botón primario del panel: el helper
`sombra_en_hover` se partió en dos para poder encenderla y apagarla, en vez de atarla al hover.

### Agregado: consultar un elemento con clic, con su geometría

Con el panel de MapaLab abierto, el clic en el lienzo consulta: no hay que activar nada. El
elemento que devuelve el servidor —**con geometría**, no solo atributos— se copia a una capa
vectorial en memoria, `Selección — <capa>`, donde queda seleccionado y con su ficha de atributos
abierta. De ahí en adelante es una capa como cualquier otra: zoom a la selección, copiar, exportar
a GeoPackage. Al cerrar u ocultar el panel, el lienzo recupera la herramienta que tuviera.

**No hace falta cargar la capa.** Si hay una capa seleccionada en el árbol del catálogo, el clic
consulta esa, esté o no en el mapa: el plugin arma el `GetFeatureInfo` con el extent y el tamaño
del lienzo, y reproyecta lo que llega al CRS de los datos. Sin selección en el árbol, identifica
sobre las capas del plugin que sí estén cargadas, de arriba abajo, y se queda con la primera que
responde.

Entran todos los elementos del punto, no solo el primero —en una capa con serie temporal, un clic
puede traer diez—, y todos quedan seleccionados. Los clics se acumulan en la capa de selección,
una por capa consultada, y volver a clicar un elemento ya consultado no lo duplica: lo vuelve a
seleccionar. La capa va al 50 % de opacidad para no tapar lo que hay debajo.

De la ficha se excluyen las columnas que no son datos: una segunda columna geométrica como el
`geom_inegi` de Feminicidios llegaba como un GeoJSON entero volcado en texto y rompía la copia con
`Could not convert value "" to target type "string"`.

Esto es lo que las capas WMS no podían dar por sí solas —son ráster, no se seleccionan—, y lo que
lo hace posible es que sextante publica sus capas como `queryable` y responde `GetFeatureInfo` con
la geometría incluida. Las capas del plugin se agregan ya con `identify/format=Feature`, así que
la herramienta nativa de identificación de QGIS también devuelve entidades completas.

### Corregido: el plugin se saltaba el gateway en cada petición

`GetMap` y `GetFeatureInfo` no salían por el gateway sino a `http://<geoserver>:8080/…/ows`: QGIS
usa el `OnlineResource` que anuncian las capabilities, y GeoServer las publica con su URL interna.
Solo se notaba dentro de la red, donde ese puerto responde; para cualquiera fuera, el plugin no
habría dibujado nada. De paso, todo ese tráfico se saltaba la cache, el rate limit y la protección
de bots, que es justo lo que el modelo de acceso del plan daba por puesto.

El URI del proveedor lleva ahora `IgnoreGetMapUrl` e `IgnoreGetFeatureInfoUrl`, con lo que las dos
peticiones vuelven a `https://<gateway>/sextante/{ws}/wms`. Con eso, identificar un elemento con
clic funciona contra el servidor público: la herramienta Identificar de QGIS devuelve los
atributos de la capa —`nombre`, `clave_geo`, `region`, las áreas—, y el URI declara
`featureCount=10` para que el clic no se quede en un solo elemento. La capa recién agregada queda
además como capa activa, que es sobre la que Identificar trabaja.

## [1.118.1] - 2026-08-10

### Corregido: los íconos de punto y ráster no eran de la misma familia

Los cuatro íconos del badge de geometría hablan ahora el idioma de las herramientas de medición:
trazo de 1.8 y los vértices como círculos llenos. Punto son esos mismos vértices sueltos —eran
tres discos macizos de radio 2.4, más pesados que todo lo demás y sin alinear con nada— y ráster
es una malla de dos por dos con el relleno al 18 % del polígono, en lugar de la rejilla de tres
por tres que a 16 px, el tamaño real en el panel, se veía como una mancha. Ráster es el único sin
vértices, a propósito: no es una geometría vectorial.

Línea y polígono no cambian.

## [1.118.0] - 2026-08-10

### Agregado: el tipo de geometría viaja en el árbol

`GET /layers/tree` publica `geometryType` por nodo, con el valor que guarda
`mapalab.layers.geometry_type` (dataengine 1.33.0): `point`, `line`, `polygon` o `raster`.

En el visor, `GeometryTypeBadge` estaba construido desde hace tiempo y no se veía nunca: el hook
que lo alimentaba resolvía el tipo pidiendo un `DescribeFeatureType` por capa al abrir el panel, y
cuando esa consulta no llegaba a tiempo o fallaba el componente recibía `null` y devolvía `null`.
Ahora el dato llega con el árbol, ya resuelto, y `useActiveLayersLogic` lo pone en la capa activa
—los grupos heredan el tipo del primer descendiente con WMS, como ya hacía el hook—. El hook
`useLayerGeometryType` se elimina; `fetchGeometryType` sigue en pie para sus otros tres usos.

En el plugin de QGIS, `LayerItemDelegate` pinta el glifo junto al badge del catálogo: círculo para
punto, diagonal para línea, rectángulo para polígono y tablero para ráster, con el color de cada
tipo. Los adornos se miden de derecha a izquierda antes de dibujar y el rectángulo del texto se
recorta hasta donde empiezan, así que la etiqueta nunca queda debajo. Se elimina
`plugin/model/geometria.py`, que resolvía el tipo bajo demanda y era el plan provisional.

Una capa se queda sin glifo, `curvas_de_nivel`: se publica solo por WMS y no hay WFS del cual
deducir su geometría. Se le puede asignar a mano desde el editor de capas de mariachi.

## [1.117.0] - 2026-08-10

### Agregado: el plugin usa la identidad del IIEG

`theme.qss` lo genera mariachi desde el módulo Identidad (artefacto `tokens.qss`, mariachi 1.123.0)
y el plugin lo aplica **al panel, no a la aplicación**: `setStyleSheet` sobre el widget raíz solo
alcanza a sus descendientes, así que no contamina el resto de QGIS.

La regla que decide qué se pinta y qué no: **marca sí, chrome no.** Se pintan botón primario,
selección del árbol, foco de los campos, encabezados y badges. Fondos, bordes y texto base quedan
en `palette(...)`, del tema del anfitrión, porque QGIS tiene tema claro y oscuro a elección del
usuario y un panel que impone su paleta se vuelve ilegible en la mitad de los casos.

`LayerItemDelegate` dibuja los badges «Nueva/Actualizada» del catálogo directo en el árbol, con el
color y la etiqueta que trae cada nodo, recortando el rectángulo del texto para que no se
encimen. Hoy hay 2 capas con badge vigente.

La barra de título del panel deja de ser el texto plano de Qt: `TitleBar` la reemplaza vía
`setTitleBarWidget` y muestra el **logo del IIEG**, eligiendo la variante clara u oscura según la
luminancia de la paleta del anfitrión. El archivo **no viaja en el repo** —la norma de identidad
manda que los logos vivan en el Acervo—, así que se descarga de la URL que declara el catálogo y se
cachea.

**Hoy esa descarga falla con 404**: `logo.largo.claro` apunta a `/acervo/iieg/logos/iieg_large.svg`
y esa ruta no existe en el Acervo, aunque `/acervo/iieg/iconos/` sí. Mientras no se suban los
archivos, la barra cae al título en texto con el color primario. Cuando se suban, el logo aparece
solo, sin tocar el plugin.

Los tres botones expresan jerarquía en vez de verse iguales: «Agregar al mapa» es `primary`,
«Descargar vectorial» es `secondary` (contorno que se rellena al pasar el cursor) y «Recargar
catálogo» es `quiet`, sin recuadro.

El QSS no se edita a mano: se regenera desde mariachi cuando cambian los tokens. Los colores no
viven en el plugin. `identidad.json` guarda las URLs de logo por la misma razón.

### Agregado: plugin de QGIS con el catálogo del visor

`plugin/` trae un plugin de QGIS 3.40 que monta el árbol de temas de MapaLab dentro del panel
lateral y agrega cualquier capa al lienzo sin teclear una URL de WMS. Es **solo lectura**: el WFS
de sextante corre con `serviceLevel BASIC`, así que la escritura ya está cerrada del lado del
servidor y el plugin no la contempla.

Dos decisiones que definen su comportamiento:

- **La capa llega completa.** De los 209 nodos del árbol, 108 traen `cqlFilter` y **ninguno es
  temporal**: son filtros de identidad (`nivel_atencion`, `modalidad`, `tipo`) que salen de solo 20
  tablas. Aplicarlos en QGIS partiría una tabla en hasta 33 entradas —el caso de
  `salud:unidades_salud`— cuando ahí conviene una capa y un filtro por atributo. El árbol se
  muestra igual, pero al agregar la capa el filtro es una casilla opcional. Se verificó que todos
  los nodos de una misma tabla comparten `styles`, así que la simbología no cambia. El catálogo
  queda en 119 capas distintas.
- **WMS troceado a 256 px.** La cache del gateway usa `$request_uri` como clave y el proveedor WMS
  de QGIS pide por defecto una imagen del viewport completo, que nunca repite URL: cada paneo sería
  un MISS y llenaría la cache de entradas de un solo uso, desplazando por LRU los tiles que el
  visor sí reutiliza. Con `maxWidth`/`maxHeight` la petición se trocea y vuelve a caer en el
  patrón que la cache aprovecha.

El `defaultDate` de los 60 nodos que lo declaran se ignora a propósito: es el «último año» que
aplica el visor en runtime, y en QGIS estorba.

Para analizar, la capa se descarga completa a un GeoPackage local en una sola petición, en lugar de
un WFS vivo con bbox que pediría features en cada movimiento del mapa. Las capas pesan entre 1 y 16
MB y bajan en menos de un segundo. La metadata de `/metadata` se vuelca a `QgsLayerMetadata`, así
que la capa llega con fuente, metodología y vigencia.

El cliente HTTP usa `QgsBlockingNetworkRequest` y no `requests`: el gateway responde **403** a los
User-Agent de cliente programático, y el de QGIS es de los que pasan. El árbol se cachea en el
perfil de QGIS y se revalida con `If-None-Match`.

**El nombre de capa va sin prefijo en WMS y calificado en WFS, y no es un descuido.** En el
endpoint de un workspace (`/sextante/general/wms`) GeoServer anuncia sus capas como
`cuerpos_de_agua_50k`, no `general:cuerpos_de_agua_50k`. Las dos formas funcionan en un GetMap
—por eso el visor, que manda la calificada, nunca lo notó—, pero QGIS valida el nombre contra las
capabilities antes de dibujar: con el prefijo no lo encuentra y falla con `cannot calculate
extent`. El WFS sí exige la forma calificada. Homologar las dos rompe una de las dos vías.

Como el nombre difiere del que manda el visor, las peticiones del plugin **no comparten entradas
de cache con él**. Se pierde poco: el troceado de QGIS tampoco caía en la malla de OpenLayers, así
que esas URLs nunca coincidieron. Lo que sí se conserva es que los tiles del plugin se repitan
entre sí, que era el grueso del beneficio.

La dirección del servidor se configura en el panel; no viaja en el código.
## [1.116.21] - 2026-09-24

### Corregido: el widget viejo se quedaba un año en los celulares

`/widget/v1/mapalab.js` se servía con `max-age=31536000, immutable` en una URL sin hash. Un navegador
que lo bajó antes de agosto siguió usando el widget 1.1: pintaba el pie «Fuente: IIEG» y no le pasaba
`marker-card` al iframe, así que la tarjeta del portal no salía. Ahora va con `no-cache`: se
revalida contra el `ETag` y cada deploy del widget llega a todos.

## [1.116.20] - 2026-09-17

### Corregido: el purgado del cache del gateway nunca purgó nada

`purge_gateway_cache` borraba `/var/cache/nginx/mapalab_assets/`, y desde gateway-hub 1.46.0 ese
cache vive en `/var/cache/nginx-data/`. Encima corre en el nodo de mapalab, y en producción el
gateway está en otra VM: el `|| true` se tragaba el fallo y el deploy imprimía «cache purgado» sin
haber purgado. Ahora borra las dos rutas, solo pinta verde si el reload respondió, y si el
contenedor del gateway no vive en ese nodo lo dice en amarillo en vez de mentir. Se descubrió al
desplegar a producción el 2026-09-14.

## [1.116.19] - 2026-09-11

### Cambiado: la tarjeta del embed espera al clic

`marker-card` abría la tarjeta al cargar salvo que el sitio mandara `open: false`. Ahora es al
revés: sin `open: true` la tarjeta aparece hasta que se toca el pin. En un teléfono la tarjeta
(567 px) tapaba el pin en un mapa de 336.

### Cambiado: pin grande y logo corto en pantallas chicas y táctiles

El pin de IIEG mide 128 px en cualquier pantalla; el de 64 solo salía en iframes angostos. El logo
pasa a la versión corta de la identidad («M» + «LAB») en cuanto Contribuciones se contrae (iframe
de menos de 768 px) o en táctil, centrado con el botón ©. El largo queda para pantallas anchas que
no son táctiles: se usa `not-pointer-coarse` y no `pointer-fine`, porque un navegador sin puntero
no reporta ni uno ni otro.

### Agregado: chip naranja y cifras en una o dos columnas

Los chips de `marker-card` aceptan `style: 'accent'`, naranja institucional con texto oscuro:
7.18:1 de contraste, contra 2.47:1 con texto blanco, que no pasa AA. `tilesColumns` acomoda las
cifras en 1 columna (por omisión) o en 2.

### Cambiado: separador de miles con coma

`formatNumber` y la barra de escala del export usan coma para los miles y punto para el decimal,
como pide la identidad. Antes era espacio duro.

### Corregido

- Al soltar la tarjeta del embed regresaba al borde izquierdo: el panel medía el ancho del mapa y
  no el de la tarjeta. Además el × y los enlaces no recibían el clic.
- Una cifra de texto («2013») se pintaba «2 013»: los mosaicos de texto van tal cual.
- El enlace al visor de la tarjeta (`icon: 'mapas'`) salía sin icono.

## [1.116.18] - 2026-09-11

### Corregido: el editor ciudadano conserva el formato de año

El borrador de la tarjetita del catálogo se armaba solo con `field` y `label`: una propuesta sobre
una capa con `formato: 'anio'` lo perdía al aprobarse. Ahora los renglones de lista lo conservan.
Requiere mariachi ≥ 1.126.0, que se despliega antes: su schema rechaza llaves desconocidas.

## [1.116.17] - 2026-09-11

### Agregado: formato de año por campo en la tarjetita

Un campo de la tarjetita acepta `formato: 'anio'` y entonces `2024-01-01` se pinta como `2024`.
Vale en etiquetas, renglones de lista, íconos con texto y párrafos. Es **explícito a propósito**:
no hay detección automática, así que ninguna capa cambia por sorpresa.

Antes el año solo aparecía en renglones cuya etiqueta decía exactamente «Año de la información»,
y en las etiquetas de un grupo nunca: un badge no tiene texto de etiqueta que revisar. «Año del
cálculo», por ejemplo, salía con la fecha completa.

La migración `0035a` de dataengine pone el formato en **77 capas**: los 43 renglones sobre `fecha`
cuya etiqueta empieza con «Año» y las 34 etiquetas sobre `fecha` en capas anuales. Las mensuales se
quedan con la fecha completa: ahí el año solo sería incorrecto.

El año sale del texto ISO y no de `new Date(...).getFullYear()`: un `2024-01-01` se interpreta como
medianoche UTC y en la zona de México cae en 2023. La regla vieja por etiqueta tiene ese problema y
se queda una versión más como respaldo. Un renglón con formato tampoco pasa por el formato de
números, que habría convertido `2026` en `2 026`.

## [1.116.16] - 2026-09-11

### Agregado: la tarjeta del marcador embebido la define el sitio que embebe (widget 1.5.0)

- `<iieg-mapalab>` gana `marker-card`: un JSON con chips, filas, contacto y cifras que el visor
  pinta con los bloques del InfoBox (`labelGroups`, `list`, `iconText`, `cards`). El sitio es
  dueño del contenido y lo cambia sin desplegar MapaLab; el visor no consulta ningún dato propio
  para armarla. Saneado por campo: topes por bloque, textos recortados, iconos de una lista,
  `href` solo `https:`, `http:`, `tel:` y `mailto:`, y `"@visor"` como único valor especial (el
  enlace al visor completo, que ya armaba la marca del embed). Más de 4 KB o JSON ilegible se
  ignora y el pin conserva la tarjeta de título y descripción. `order` fija el orden de los
  bloques y `open` abre la tarjeta al cargar.
- Las filas del InfoBox admiten `**negritas**`; ningún otro markdown.

### Cambiado: el InfoBox embebido se arrastra desde la tarjeta y pierde «centrar selección»

- En `/embed` la tarjeta se toma de cualquier parte para moverla (umbral de 4 px, así que los
  enlaces siguen respondiendo al clic) y desaparece el botón de centrar, que en un mapa de una sola
  sede no aporta. El visor completo no cambia.

## [1.116.15] - 2026-09-11

### Eliminado: el modal de «entorno de pruebas»

- `TestEnvModal` avisaba a quien entraba con `VITE_APP_ENV=beta` que estaba en un entorno de
  pruebas y lo mandaba a producción. Existía para la VM pública de GCP, retirada el 2026-08-28: sin
  entorno público de pruebas no queda a quién avisar, y en el espejo interno solo estorba. `beta`
  sigue existiendo —badge «test» y herramientas no-prod—; solo desaparece el modal y su bandera
  `test-env-modal-dismissed` de `localStorage`.
- Los dos `Dockerfile` (`frontend/`, `nginx/`) declaraban `ARG VITE_APP_ENV=beta`: un `docker build`
  a mano sin el arg compilaba en `beta` sin avisar. El `ARG` queda sin default y un `RUN` aborta el
  build si llega vacío. Por compose no cambia nada: ya lo pasaba con `${VITE_APP_ENV:?}`.

## [1.116.14] - 2026-09-11

### Eliminado: la geolocalización del iframe del widget (1.4.1)

- `<iieg-mapalab>` monta el iframe con `allow="fullscreen"`. Pedía también `geolocation` para «Mi
  ubicación», que el embebido ya no tiene desde 1.116.13: el sitio que lo inserta deja de delegar
  ese permiso. El `package-lock.json` del widget, que seguía en 1.1.0, queda en 1.4.1.

## [1.116.13] - 2026-09-10

### Cambiado: logo y pin del embebido

- El logo de MapaLab baja a la esquina inferior derecha, 8 px sobre «Contribuciones» y con su mismo
  margen. Pierde el fondo blanco y queda sobre un difuminado del mapa: en escritorio mide lo mismo de
  ancho que «Contribuciones» cerrada y en móvil, la mitad que antes. Sigue abriendo el visor.
- El marcador por defecto es el pin de IIEG, `/acervo/iieg/logos/ico_iieg_mapa.svg` con ruta
  relativa, anclado en la punta: 128 px de ancho en escritorio y 64 en móvil, y se redibuja si el
  marco cruza el breakpoint. `markerColor` solo pinta el círculo detrás de un `markerIcon` propio.
- El pin se dibuja encima de las etiquetas y calles del mapa base (9000), la máscara de municipio
  (9500) y el relieve (10000). Antes quedaba abajo, en 999; `showMarker` acepta `zIndex` y el
  visor conserva el de siempre.

### Eliminado

- «Mi ubicación» en los controles del embebido (`MapControls hideLocate`). El visor y el catálogo lo
  conservan.

## [1.116.12] - 2026-09-10

### Agregado

- `evento_fun_volver` al presionar «Volver» en el dato curioso pineado. Requiere mariachi 1.125.1:
  con una versión anterior, el lote de telemetría que lo lleve se rechaza con 422.
- `evento_fun_fact` suma `animacion` y `con_destino`.

### Corregido

- Los datos curiosos del botón del borde del sider se atribuían al id `sider-global-facts` en vez de
  al evento de origen: los de eventos lite no quedaban a nombre de ningún evento.

## [1.116.11] - 2026-09-10

### Agregado: simulador de pantallas en la etiqueta `dev`

El popover de la etiqueta `dev` suma «Simular pantalla», un segmented con Real, 390, 768, 1280 y
1920: móvil, tablet, laptop y escritorio, uno dentro de cada rango de breakpoints del visor. Al
elegir uno, la app se abre en un marco de ese ancho sobre un fondo gris, con el mismo segmented y
una X arriba; Escape también sale.

Es un marco y no una vista achicada a propósito: dentro del iframe, `window.innerWidth` y
`matchMedia` miden el marco, así que cambian igual las clases `md:`/`lg:` de Tailwind que
`MOBILE_BREAKPOINT` y `TOOLS_COMPACT_BREAKPOINT`. Si la pantalla no cabe, se reduce con `scale` y la
barra dice a qué porcentaje; el ancho que ven las media queries no cambia. Cambiar de ancho no
recarga el marco.

La elección vive en `devToolsStore`, en `sessionStorage`, y sobrevive a recargar. Dentro del marco
no se ofrece el simulador, para que no se anide. «Ver como producción» y «Panel de analítica» se
sincronizan ahora entre ventanas del mismo origen con el evento `storage`, así que el switch del
visor de afuera llega al de adentro.

El CSP de `index.html` no admitía iframes del mismo origen. `frame-src` recibe `'self'` solo cuando
`VITE_APP_ENV=dev`, a través del mismo plugin que ya reemplaza `__ACERVO_ORIGIN__`; beta y
producción se construyen con el CSP de siempre.

Viene de tamal-rojo 1.170.0 y trae consigo `components/Segmented.jsx`, que en verde no existía.

## [1.116.10] - 2026-09-10

### Agregado: eventos lite

Un evento de mariachi con `modo: lite` no trae capas: no entra al sider ni a `?evento=` y solo
enciende el botón de dato curioso en el borde del sider. Con dos eventos vigentes, el botón toma
ícono, animación, estilo y aviso del primero por `orden`. Requiere mariachi 1.125.0.

Parte del código entró con 1.116.9 —`EventoBotonGlyph`, `EventoFunAguila`, `EventoFunPopover`,
`eventoDiversion` y los íconos naranjas de modo y catálogo en el borde—; esta entrada documenta la
función completa.

### Agregado: animaciones y botón personalizables

- Cada dato curioso usa su animación, la del evento o la pelota. Se suman las águilas: una parvada
  de cuatro que cruza la pantalla con el símbolo del dato.
- El ícono del botón es dinámico por defecto —el símbolo del próximo dato— o fijo.
- Fondo de la paleta y borde por tramos, según el `botonEstilo` del evento.
- Aviso inicial en el tooltip normal, una vez por visitante; acompaña al sider mientras se anima.

### Agregado: las águilas te llevan a un lugar

Un dato con `destino` mueve el mapa mientras vuelan las águilas y las posa en el punto, centrado en
la zona visible y no bajo el sider. El dato queda pineado ahí y se mueve con el mapa; «Volver»
regresa a la vista de antes del primer viaje y la ✕ lo cierra. Con movimiento reducido, el mapa
salta sin animación.

### Cambiado

- Los botones del borde del sider van en un solo contenedor, con más separación vertical; pasar el
  mouse por el del evento ya no abre el sider.
- En mobile, el botón de dato curioso ocupa la esquina del estado del sider; antes desaparecía.

## [1.116.9] - 2026-09-10

### Cambiado: la pill del enlace compartido avisa cuando la vista ya no coincide

Al abrir un `/mapa?s=ID`, la pill verde «Compartido:» pasa a gris «Regresar a:» en cuanto el mapa se
aparta del enlace: capas, filtros, opacidades, mapa base, capa seleccionada y ahora tambien zoom y
ubicacion. Un clic la restaura sin recargar la pagina —vuelve a pedir el share y lo aplica— y regresa
a verde. Antes eran dos pills separadas y restaurar recargaba todo.

La X para quitar el enlace es la misma `PillCloseButton` de las demas pills: aparece con hover en
escritorio y queda fija en movil, donde la pill antes ni se mostraba.

El movimiento que hace el propio enlace al aplicarse no cuenta como cambio: `useShareDeserializer`
marca el momento en que aplica y `useShareDirtiness` da su gracia desde ahi, no desde el montaje.
Con eso un share que tarda en llegar ya no nace marcado como modificado.

### Cambiado

- El texto que acompana al enlace en redes es «Mapa personalizado de Jalisco en MapaLab, del IIEG».

### Corregido

- El telefono del icono provisional de WhatsApp queda centrado en su globo, no en el boton.

## [1.116.8] - 2026-09-10

### Agregado: el panel de compartir del visor trae QR descargable y redes sociales

El QR con la marca que ya tenia el catalogo llega al visor: 200 px, centrado como pieza principal del
panel, y al pasar el mouse —o tocarlo, en pantallas tactiles— muestra la descarga en PNG a 800 px.
Salio de `CatalogoShare` a un componente comun, `BrandedQr`, que ahora usan los dos.

Debajo van cinco redes que aceptan un enlace para compartir: WhatsApp, Facebook, X, LinkedIn y
Telegram, con los iconos oficiales del Acervo (`iieg/iconos/redes sociales/`). WhatsApp y Telegram
apuntan ya a `ico_wa.svg` e `ico_tg.svg`, y mientras no existan caen a un icono provisional del mismo
estilo; al subirlos con esos nombres aparecen sin tocar codigo. Instagram y YouTube se descartaron:
ninguna de las dos acepta un enlace compartido desde la web.

«Insertar en otra pagina» sigue siendo beta y solo aparece en dev y beta. Su codigo se muestra a su
altura completa, y «¿No tienes llave? Solicitala» abre Colibri acotado al tipo `solicitud`, con el
correo obligatorio para poder responder con la llave y el `share_id` como contexto. Si el widget no
cargo, el boton lo dice en pantalla en vez de fallar callado. `useColibriOpen` acepta ahora las
opciones del panel y devuelve si pudo abrirlo.

### Cambiado: compartir se abre con el mouse y el clic copia al instante

El panel ya no depende de mantener presionado 450 ms, un gesto que nadie descubria. Dejar el mouse
400 ms sobre el boton lo abre y genera el enlace en ese momento; un paso rapido por la barra no abre
nada. El clic copia el enlace y deja el panel abierto; un segundo clic lo cierra. En tactil el toque
hace lo del clic.

El enlace se reutiliza mientras el mapa no cambie, asi que abrir el panel varias veces sobre el mismo
estado crea uno solo. El logo animado de carga solo aparece si generar tarda mas de 300 ms, en un
hueco ya reservado para que nada brinque.

El input muestra solo el id del enlace y el completo en tooltip; al enfocarlo cambia al enlace
completo y lo selecciona. El panel se limita al alto de la ventana con scroll interno: con el codigo
de insertar desplegado llega a unos 800 px y antes solo se acotaba en movil.

En movil, tocar compartir mientras se ve un mapa compartido ya no desliga el enlace: ahora copia y
abre el panel. Desligar sigue en el boton «Quitar enlace compartido» de la barra.

## [1.116.7] - 2026-09-10

### Agregado: selector de modo del sider con los cuatro estados a la vista

Al pasar el mouse sobre el botón de modo del borde se despliega un segmento con Automático,
Expandido, Colapsado y Mobile, en vez de tener que ciclar a ciegas. El seleccionado va en naranja
institucional y el clic directo en el botón sigue ciclando como antes.

En automático la flecha del botón sigue el estado vivo del sider: apunta a la derecha cerrado y a
la izquierda cuando se abre por hover. Mientras el segmento está abierto el sider no se expande, y
el mismo candado aplica al menú de la etiqueta `dev`.

### Agregado: vista de producción desde la etiqueta `dev`

En builds `dev`, al pasar el mouse sobre la etiqueta junto al logo aparecen dos switches:

- **Ver como producción** — oculta en vivo todo lo que no sale a producción, sin reconstruir. La
  etiqueta cambia a `prod` mientras está activa.
- **Panel de analítica** — muestra el panel de depuración de eventos, que antes se pintaba solo.

### Cambiado: el identificador de tipo de capa ya no sale en producción

El badge de punto, línea, polígono o ráster de las capas activas queda solo fuera de producción.
Cuando no se va a mostrar, tampoco se consulta el tipo de geometría al GeoServer.

### Cambiado: los botones del borde van en fila con el sider mobile cerrado

En modo mobile en escritorio, con el sider cerrado, los botones de modo, evento y catálogo van en
fila sobre el borde inferior en lugar de en columna, para no salirse del sider.

### Corregido: el panel de analítica no recibía eventos

La emisión al panel dependía de `VITE_NODE_ENV`, una variable distinta de la `VITE_APP_ENV` que
decide el entorno. En un build con `VITE_NODE_ENV=production` el panel quedaba vacío aunque el
entorno fuera `dev`. Ahora ambas decisiones usan la misma.

## [1.116.6] - 2026-09-01

### Corregido: ante un 429 el recuperador de chunks amplificaba la saturacion

`error-recovery.js` respondia a cualquier fallo de chunk con `window.location.reload()`, hasta dos
veces. Una recarga completa vuelve a pedir el HTML y los ~25 assets, asi que **cada visitante
afectado sumaba ~50 peticiones** contra el mismo cubo de rate limit que ya estaba saturado, mas un
beacon a `/mapalab/api/log/client-error` por intento. El 2026-08-31, con el gateway rechazando los
bundles por 429, el propio frontend multiplicaba la inundacion que le impedia cargar.

Ahora sondea con `HEAD` la URL que fallo antes de decidir:

- **429** — no recarga nada. Espera con backoff exponencial y jitter (4 s de base, tope 60 s, seis
  rondas), reintentando solo el sondeo, y recarga una vez cuando el gateway vuelve a responder
  2xx/3xx. El beacon se manda **una sola vez** por sesion.
- **Cualquier otro fallo** — el comportamiento de siempre, correcto para el caso para el que se
  escribio: hashes viejos en cache tras un deploy.

Tambien se separo el mensaje. Ante un 429 decia «Tu navegador guardo una version anterior de la
aplicacion», diagnostico equivocado que manda al usuario a hacer Ctrl+F5 —o sea, a inundar mas—.
Ahora hay uno propio, «MapaLab esta saturado», sin boton mientras reintenta solo.

Va tambien en `tamal-rojo` como 1.157.0.


## [1.116.5] - 2026-08-26

### Corregido: los assets salian con dos cabeceras `Cache-Control`

El bloque de estaticos combinaba `expires 1y` con `add_header Cache-Control "public, immutable"`.
La directiva `expires` **ya emite su propia** `Cache-Control: max-age=31536000`, y nginx no las
fusiona: cada archivo con hash se servia con **dos** cabeceras distintas.

De ahi que el gateway tuviera que hacer `proxy_hide_header Cache-Control` y rehacerla — no faltaba
la cabecera, venia duplicada. Ahora se emite una sola, completa, con el mismo estilo que ya usaba
`/widget/` en este mismo archivo:

```nginx
add_header Cache-Control "public, max-age=31536000, immutable";
```

Sin `always` a proposito: el conjunto de codigos por defecto de `add_header` incluye el `304` y
**excluye el `404`**, que es justo lo que se quiere. Con `always`, un 404 le diria al cliente que lo
cachee un anio.

Se pierde la cabecera `Expires` de compatibilidad con HTTP/1.0; ningun cliente relevante la necesita
teniendo `Cache-Control`.

## [1.116.4] - 2026-08-26

### Corregido: el mapa base salía cubierto por el watermark «API key required» de CARTO

CARTO empezó a exigir API key en sus basemaps raster y a marcar los tiles que se piden sin ella. Los
tiles siguen respondiendo 200, así que no había error en consola ni en los logs del gateway: el
fondo simplemente aparecía cubierto por un mosaico repetido con el texto. Afectaba a los dos mapas
base del visor y a su overlay de etiquetas, y por herencia al embed, al widget `<iieg-mapalab>` y al
mapa de contacto del portal.

`cartoSource` arma ahora la URL con `?key=` cuando `VITE_CARTO_API_KEY` trae valor, y la deja
idéntica a la anterior cuando está vacía. La variable viaja como build arg en los dos Dockerfiles y
en el ancla `x-vite-args` de `compose.prod.yaml`, declarada con `?` y no con `:?` para que un
entorno que todavía no tenga llave pueda desplegar.

**Es build-time:** cambiar la llave obliga a reconstruir el bundle, un `make up` no la aplica.

El relieve no estaba afectado —sale de GeoServer propio por WMTS— ni «Sin Mapa Base», que no pide
tiles. El CSP tampoco cambia: `?key=` no altera el origen.

## [1.116.3] - 2026-08-21

### Corregido: las descargas se nombraban con la fecha del día, no con la del dato

`buildFilename` sellaba el nombre con `new Date()`, así que bajar temperatura de enero y de febrero
producía dos veces `Temperatura_media_2026-08-21.tiff`: el segundo archivo pisaba al primero o
quedaba como copia numerada, sin manera de saber qué mes traía cada uno. Afectaba por igual al
visor, al ZIP con metadatos y al catálogo.

Ahora el nombre lleva el periodo que realmente se descargó, resuelto con `describeDateFilter`, que
es el mismo helper que rotula las píldoras de fecha del panel de capas. Un mes sale como
`Temperatura_media_2026-01.tiff`, un año como `_2026`, y varios meses como `_2026-01_a_2026-03`. En
raster el periodo se traduce con la `rasterPeriodicity` de la capa; en vectoriales se deduce del CQL
del filtro activo. Sin filtro de fecha se conserva la fecha de descarga, que es la que aplica cuando
el archivo trae la serie completa.

La descarga rápida de capas vectoriales sigue bajando todas las fechas y por eso conserva la fecha
de descarga: el nombre describe el contenido del archivo, no lo que esté filtrado en pantalla.

## [1.116.2] - 2026-08-10

### Corregido: el beacon de errores de carga no decía qué se había roto

`report()` mandaba en `message` el texto `'reintento N'`, que ya se deduce del `type`, mientras las
tres vías de detección traían el detalle real y se descartaba. En `unhandledrejection` era peor: el
mensaje se pasaba como `failedUrl` y terminaba **en el campo `url`**. Como el backend loguea ese
campo como `detalle=`, cada alerta de `client_errors` avisaba sin decir qué archivo falló, que es lo
único que permite cerrar el incidente. Es la telemetría que sustituyó a Sentry.

Ahora cada vía aporta lo que sabe: `describeError` para el `Error` de `vite:preloadError` y para el
`reason` del rechazo, `describeTarget` para el tagName y el `rel` del elemento, y `extractUrl`
recupera la URL del texto del mensaje cuando no viene por separado.

### Corregido: «Recargar ahora» no reemplazaba el asset en caché

El botón de la pantalla fatal hacía `window.location.reload()`, que respeta el `immutable` de los
assets: si la copia local era la rota, se volvía a ejecutar igual y la única salida real era el
Ctrl+F5 que sugiere el texto. Ahora `revalidateAndReload` pasa por `fetch(url, { cache: 'reload' })`
sobre el documento y el asset fallido antes de recargar, con salida a los 3 s si la red no responde.

### Corregido: los reintentos se agotaban sin haber recargado nunca

`attempts` contaba elementos fallidos, no cargas. El listener de `error` en fase de captura se
dispara una vez por cada `<script>`/`<link>` roto de la misma página, así que tres elementos
agotaban los dos reintentos de una sola vez, mostraban la pantalla fatal sin recargar y triplicaban
la cuenta del check `client_errors` por usuario. La ráfaga se agrupa con una ventana de 2 s, que no
ciega un fallo posterior de un chunk lazy.

**Al desplegar:** `CLIENT_ERROR_WARN_COUNT` se calibró con la cuenta inflada, así que conviene
bajarlo.

## [1.116.1] - 2026-08-05

### Cambiado: el aviso de privacidad se enlaza desde acervo

`footerConfig.linkPrivacyPolicy` y el enlace de soporte de la home pasan a
`https://iieg.jalisco.gob.mx/aviso-de-privacidad`, ruta reservada del dominio que el gateway sirve
desde acervo. La URL no lleva fecha ni ruta del objeto: publicar una versión nueva es reemplazar el
archivo en el bucket, sin tocar este repo. Antes cada frontend guardaba la URL con la fecha del PDF
y quedaban desincronizados — sieej se quedó apuntando a la versión de enero de 2025 y llevaba meses
respondiendo 404.

**El valor del config es solo el respaldo.** La home lee `apiFooter.privacyPolicyHref` del CMS de
mariachi y solo cae al config si viene vacío, así que en cada entorno hay que actualizar también el
campo *URL del aviso de privacidad* de la sección footer.

## [1.116.0] - 2026-08-03

### Corregido: la tarjeta del embed abría como bottom sheet en escritorio

`InfoBox` decidía su variante con el `isMobile` de `SiderContext`, que mide **el ancho del iframe,
no el de la ventana**. Un embed de 640px dentro de un monitor de 1920 se daba por teléfono y abría
el bottom sheet a pantalla completa, tapando el mapa que el visitante quería ver.

La prop nueva `forceDesktop` corta esa decisión en el único punto donde se toma; el embed la pasa y
el visor completo queda igual. Al probarlo salió lo que no se veía con la tarjeta cerrada: el logo
la tapaba, porque estaba en `z-10` y el panel va en `z-5`. El logo bajó a `z-[4]`.

### Cambiado: el logo del embed toma la métrica de la barra de zoom

40px de alto —el ancho exacto de ese contenedor—, su misma sombra y un SVG de 24px, la altura de
sus iconos. El radio se queda en los 8px de `--mapalab-radius`, el del contenedor del widget: la
píldora de la barra de zoom no le sienta a una marca. Se retiró el escalón `md:`, porque la barra
de zoom tampoco lo tiene y el logo se encogía sólo él dentro de iframes angostos.

## [1.115.0] - 2026-08-03

### Agregado: barra de escala y tarjeta del marcador en el embed

`ScaleLineControl` se monta igual que los otros dos controles —mismo `SiderContext`, mismo anclaje
a la izquierda— y queda justo debajo de los botones de zoom. Un mapa sin escala obliga a adivinar
distancias, y el embed no tiene el panel de capas ni las herramientas de medición con que
compensarlo.

El marcador ya puede abrir una tarjeta. `marker-title` y `marker-description` la llenan y el
`InfoBox` del visor la pinta; sin `marker-title` el pin sigue siendo decorativo y el clic no hace
nada. Se decidió que fueran configurables en vez de heredar la ficha institucional del IIEG, que es
lo que muestra el marcador `iieg_hq` del visor: quien embebe marca su propia sede, no la nuestra.

Los dos son texto plano, con espacios colapsados y recortados a 120 y 400 caracteres. React los
escapa al renderizarlos y `raw` en `List` sólo evita el formateo numérico, así que no hay camino de
HTML desde la URL a la tarjeta.

### Corregido: la configuración de vitest no reflejaba la del build

`vitest.config.js` no declaraba los alias `@logos`, `@icons` ni `@png`, ni los `define` de
`__APP_VERSION__` y `__APP_LOC__`. Cualquier test que tocara un módulo con un logo importado
—`markerDefinitions`, por ejemplo— fallaba al resolver el import, no por el test sino por la
config. Los tests nuevos del marcador del embed son los primeros que pasan por ahí.

## [1.114.0] - 2026-08-03

### Agregado: el embed estrena controles, logo y atribución del visor

El visor embebido era un mapa mudo: se podía arrastrar y hacer rueda, pero no había botones de
zoom, nada identificaba de dónde venía el mapa y la única marca era un `Fuente: IIEG` de diez
píxeles que pintaba el widget por fuera del iframe.

Ahora monta tres piezas que ya existían en el visor completo, sin componentes nuevos salvo el del
logo: `MapControls` abajo a la izquierda (acercar, mi ubicación, alejar y el "centrar en Jalisco"
que asoma al alejar) y `MapAttribution` abajo a la derecha, con `hideActions` para dejar fuera el
botón de reportar y la entrada al catálogo, que no aplican a un embed. La atribución arranca
contraída —pastilla "Contribuciones ©" en pantallas anchas, botón `©` en angostas— y se despliega
sola al pasar el cursor.

Los dos cuelgan de `SiderContext`, así que el embed se envuelve en `SiderProvider`. Sin sider que
esquivar, `useSiderAdaptivePosition` los ancla a 16px del borde y no hay nada más que ajustar.

Arriba a la izquierda va el logo grande de MapaLab, que es un enlace al visor completo con el
estado actual (`share`, o `layers` + `center`/`marker` + `zoom`). Reemplaza al `Fuente: IIEG` con
algo que además sirve para navegar.

### Eliminado: el footer `Fuente: IIEG` del widget (1.3.0)

Vivía en el shadow DOM del web component, superpuesto al iframe. La atribución real ahora la pinta
el visor, que es donde están los datos que hay que atribuir —OpenStreetMap, CARTO, OpenLayers,
GeoServer, PostGIS y la licencia del IIEG— y no sólo el nombre del instituto. El bundle baja de
24 KB a 23.3 KB.

`controls` queda documentado como **sin efecto**: viaja a la URL del embed y nadie lo lee. Se
conserva el atributo para no romper a quien ya lo pasa.

## [1.113.0] - 2026-08-03

### Agregado: marcador de punto en el embed y en el widget

El embed sabe pintar un marcador. Se pide con `marker=lat,lng` en la URL o con el atributo
`marker` del widget, y no necesita ninguna capa activa: alcanza para los casos de "aquí estamos"
—una página de contacto, la sede de una dependencia— que hasta ahora obligaban a embeber Google
Maps porque MapaLab no tenía forma de señalar un punto.

El pin default es el cuadro de MapaLab sobre un círculo `#5c2472`, el mismo del marcador de la
sede que ya vivía en `markerDefinitions`. Quien embeba puede sustituirlo con `marker-icon` y
`marker-color`: el icono se acepta por `https:`, `http:` o `data:image/`, el color solo en
hexadecimal, y lo que no valide se ignora en silencio y cae al default en vez de romper el mapa.
Con icono propio y sin color, el pin se dibuja sin círculo y anclado a su base.

El render reusa `showMarker` de `useMapMarker`, que ya estaba en `MapsProvider` y del que el embed
ya colgaba sin usarlo. El hook nuevo, `useEmbedMarker`, solo espera a que exista la instancia del
mapa y lo llama una vez.

### Corregido: `center` y `zoom` del embed no hacían nada

`parseEmbedParams` los leía desde 1.90.0 y nadie los consumía: `useMapInitialization` buscaba `lat`
y `lon` —otros nombres— y encima solo los aplicaba cuando la URL traía `layers`. El resultado es
que todo embed sin capas abría en la vista default de Jalisco, y el atributo `center` documentado
en el widget nunca funcionó.

Ahora `center` se resuelve con `parseLatLng` y se aplica sin exigir capas; si no viene `center`
pero sí `marker`, el mapa se centra en el marcador. Los parámetros `lat`/`lon` del visor full
siguen intactos.

## [1.112.0] - 2026-07-31

### Agregado: el tipo de geometría de cada capa en el panel de capas activas

Cada capa del panel muestra ahora, a la derecha de su nombre, un distintivo de qué es: puntos,
líneas, polígonos o ráster. Antes había que abrirla o mirar la leyenda para saberlo, y con varias
capas encimadas el usuario no tenía forma de anticipar cuál iba a responder al clic sobre el mapa
ni qué formatos de descarga le tocaban.

El tipo lo resuelve `useLayerGeometryType`, que no consulta nada nuevo al GeoServer: para ráster
se apoya en `RASTER_WORKSPACES` —el mismo criterio de `isRasterLayer` en las descargas— y para
las vectoriales reusa `fetchGeometryType` de `featureInfoUtils`, que ya parsea el
`DescribeFeatureType` del WFS para saber qué columna es la geometría. Esas peticiones ya venían
agrupadas por `queueMicrotask` y cacheadas por `baseUrl:typeName`, así que abrir varias capas no
suma llamadas; encima se cachea por `layerId` para que el distintivo aparezca de inmediato al
reabrir el panel. En los grupos se toma el primer descendiente con `wmsConfig`, igual que
`useLayerSymbolIcon`.

Cuando el tipo no se puede determinar —capa sin WMS, WFS que no responde, geometría desconocida—
no se dibuja nada y el encabezado queda como estaba.

Los cuatro iconos (`geom_point`, `geom_line`, `geom_polygon`, `geom_raster`) se agregaron al
registro de `Icon`, de modo que el catálogo o el modal de detalle pueden usarlos sin duplicarlos.

## [1.111.0] - 2026-07-31

### Eliminado: el servicio `frontend-build` y el `dist` que no consumía nadie

`make deploy` compilaba el frontend dos veces. Primero en los guardas, con `build_frontend` →
`docker compose --profile build run frontend-build`, que corría `frontend/Dockerfile` y volcaba el
resultado en `./frontend/dist`. Después otra vez en el `up --build`, porque `nginx/Dockerfile`
repite el `npm ci` y el `npm run build` del mismo código para servirlo desde su propia imagen. Al
ser contextos de build distintos (`./frontend` contra `.`) no comparten capas ni caché: era el
build completo dos veces, en serie, en cada deploy.

De las dos, la que sirve es la del nginx. `./frontend/dist` no lo monta nadie: el gateway sólo
monta el dist de **sieej** (`SIEEJ_DIST_PATH`), y en desarrollo se usa el servicio `frontend` con
Vite. Era un artefacto huérfano heredado de cuando el nginx sí lo montaba.

Se van con él `build_frontend`, `reset_dist_perms` —existía sólo para que el dist lo escribiera el
usuario y no root—, el servicio `frontend-build` de `compose.prod.yaml` y las variables `UID` y
`GID`, que no usaba nadie más. Los guardas de deploy quedan en `ensure_network`.

En los `.env.production` de cada nodo, `UID` y `GID` quedan sobrantes; se pueden borrar en la
siguiente ventana. Ya no están en el `.env.example`.

### Cambiado: `clean` deja de necesitar Docker para borrar el `dist`

`clean_artifacts` levantaba un contenedor alpine para borrar `frontend/dist`, porque el dist podía
ser de root. Sin `frontend-build` no hay dist que borrar y `rm -rf frontend/node_modules` basta.

## [1.110.0] - 2026-07-31

### Agregado: seleccion por poligono en el catalogo

Dibujar un poligono sobre el mapa del catalogo consulta por WFS la capa que se esta viendo y abre
el InfoBox con las tarjetas de lo que cae dentro del area, con el mismo scroll infinito del visor.
La consulta respeta el filtro de tiempo activo de la capa.

La logica de consulta salio de `useFeatureInfo` a `usePolygonSelection`, un hook sin contexto que
recibe capas, mapa y geometria por parametro: el visor le pasa sus capas activas y el catalogo su
capa unica. El catalogo no necesita `LayersProvider` ni `MapsProvider` para usarlo, asi que no
carga el arbol de 209 capas para consultar una.

### Cambiado: la seleccion por poligono muestra cuantos elementos hay, no cuantos cargo

El contador de las tarjetas decia `1/200` aunque en el area cayeran 89 169 elementos, porque
contaba lo cargado. Ahora usa el `numberMatched` que GeoServer ya devuelve en la primera respuesta
—sin traer un solo feature de mas— y el resumen de seleccion aclara "Se muestran los primeros
200" cuando no estan todos. La descarga sigue anunciando lo que realmente baja.

### Corregido: la seleccion por poligono no devolvia nada en 73 de las 118 capas WFS

Desde que se pagino la consulta, cada peticion incluia `STARTINDEX`. GeoServer lo rechaza con un
400 (`Cannot do natural order without a primary key`) en las capas publicadas sobre vistas sin
clave primaria — 73 de 118, entre ellas todas las de delitos y las de pobreza. El resultado era
que el usuario dibujaba un poligono y no pasaba nada.

`STARTINDEX` ahora solo viaja a partir de la segunda pagina, asi que la primera funciona en todas
las capas. Cuando el servidor rechaza la siguiente pagina, la seleccion deja de ofrecer mas
resultados en vez de reintentar. La solucion de fondo — dar clave primaria a esas vistas — es
trabajo de dataengine.

### Corregido: el scroll infinito del poligono seguia sin cargar la segunda pagina

Dos causas, ambas invisibles para los tests:

- El sentinel del InfoBox se monta al pulsar "Ver detalles", pero para entonces el efecto que crea
  el `IntersectionObserver` ya se habia ejecutado (con el sentinel aun sin montar) y ninguna de sus
  dependencias volvia a cambiar. `useInfoBoxLazyLoad` usa ahora un callback ref, de modo que el
  montaje del nodo vuelve a disparar el efecto.
- `polygonPageRef` vivia en cada instancia de `useFeatureInfo`. El InfoBox crea la suya, distinta
  de la de `MapView`, y la veia siempre vacia: `loadMorePolygonFeatures()` devolvia 0 sin pedir
  nada. El estado de paginacion pasa a `MapsProvider`, compartido por ambas.

## [1.109.0] - 2026-07-31

### Cambiado: el catalogo alinea su cap de features con el visor

El clic del catalogo pedia `FEATURE_COUNT: 20` hardcodeado mientras el visor usa
`FEATURE_COUNT_CAP` (50). Ahora comparten la constante. El catalogo **no tiene seleccion por
poligono**, asi que la paginacion contra el servidor no le aplica: su unica consulta es el
`GetFeatureInfo` del clic.

### Corregido: el scroll infinito del poligono no llegaba a dispararse

La 1.106.0 dejo la paginacion contra el servidor funcionando y expuso
`loadMorePolygonFeatures`, pero **ningun componente la llamaba**: `useInfoBoxLazyLoad` traia un
`!isPolygonSelection` que deshabilitaba el lazy load para la seleccion por poligono — tenia sentido
cuando se pedian todas las features de golpe, no ahora.

El `IntersectionObserver` del InfoBox dispara ahora `loadMorePolygonFeatures()` cuando la seleccion
es por poligono y quedan paginas, y sigue usando `loadMoreFeatures` (cache en memoria) para el
resto.

## [1.108.0] - 2026-07-31

### Agregado: el catalogo recibe las mismas optimizaciones que el visor

`CatalogoMapView` tenia su propia `View` sin `constrainResolution` ni interacciones configuradas, y
su `buildWmsLayer` ignoraba `format` y `antialias` de la capa. Ahora comparte con el visor la
constante `ZOOM_ANIMATION_MS`, el zoom sin animacion, `ratio: 1` y los parametros de render por
capa.

### Cambiado: el default de `antialias` pasa a `text`

`WMS_BASE_CONFIG` reproduce el default nuevo de la base (migracion `0033`), para que una capa sin
el campo resuelto se comporte igual que una configurada.

## [1.107.0] - 2026-07-31

### Cambiado: zoom instantaneo para no repedir los tiles de cada nivel intermedio

Al acercarse, el visor seguia descargando tiles un buen rato despues de que el viewport ya estaba
completo. Medido en el log del gateway: rafagas de **466 peticiones en un minuto** —unos 6-7
viewports— con silencio total entre ellas. No era un bucle: OpenLayers renderiza **cada nivel
intermedio** de la animacion de zoom y pide sus tiles, y como cada nivel tiene 4x mas tiles que el
anterior, la cola crece al acercarse. Por eso solo pasaba con zoom in y paraba al llegar al maximo.

`ZOOM_ANIMATION_MS` (en `helpers/defaultView.js`, usada por la rueda y por los botones +/-) pasa de
los 250 ms por defecto de OpenLayers a **0**: el zoom salta directo al nivel destino sin renderizar
los intermedios. Se probaron 250, 120 y 0; con 250 y 120 la diferencia de rendimiento se seguia
notando, asi que se opto por el salto instantaneo aunque la transicion sea mas brusca.

`constrainResolution: true` en la View acompana el cambio: fija el destino en un nivel entero y
evita un re-render extra. Por si solo **no** resuelve nada — solo afecta la resolucion final, no el
recorrido de la animacion.

La otra mitad del problema estaba en el gateway: los tiles del relieve se repedian enteros en cada
zoom porque salian con `no-store`. Corregido en gateway-hub 1.40.0.

### Cambiado: `ratio` de `ImageWMS` de 1.5 a 1

Las capas no tileadas pedian una imagen 1.5x el viewport —2.25x en area— para tener margen y no
volver a pedir en pans cortos. Con `ratio: 1` se pide exactamente lo visible: menos pixeles por
render, a cambio de que **cualquier desplazamiento dispare una peticion nueva**. Es un intercambio,
no una mejora sin coste: se optimiza la carga y el zoom a costa del pan.

Aplicado tanto al visor (`useWMSLayerFactory`) como a la vista de capa del catalogo
(`CatalogoMapView`).

## [1.106.0] - 2026-07-31

### Agregado: formato de imagen y antialias por capa

El visor deja de pedir siempre `image/png` con el antialias por defecto: ahora usa
`wmsConfig.format` y `wmsConfig.antialias`, que llegan del arbol de capas y se configuran desde
mariachi. El antialias viaja como `format_options=antialias:<valor>` y **solo se manda cuando no
es `full`**, para no ensuciar la URL ni multiplicar llaves en el cache del gateway.

### Agregado: paginacion real en la seleccion por poligono

Antes se pedian **todas** las features del poligono en una sola peticion y se recortaban de a 50
en memoria (`useLoadMoreFeatures`), asi que un poligono grande sobre una capa densa cargaba todo
antes de mostrar nada. Ahora `getFeaturesInPolygonForActiveLayers` acepta `{ startIndex, count }`
y devuelve `{ results, matched, returned, nextIndex, hasMore }`; el hook nuevo
`useLoadMorePolygonFeatures` pide la siguiente pagina al servidor y la anexa por capa.

Tamano de pagina: 200 (`POLYGON_PAGE_SIZE`). El corte se decide con `numberMatched` y
`numberReturned`, que WFS 2.0 incluye en la respuesta GeoJSON — en 1.1.0 no existen.

### Cambiado: WFS 1.1.0 a 2.0.0

Los cuatro servicios que hablan WFS migran a 2.0.0: `featureInfoService` (seleccion por
poligono), `downloadUrls` (descargas y `DescribeFeatureType`), `layerExtentService` y
`catalogoService`. Cambian los nombres de parametro: `typeName` a `typeNames` y `maxFeatures` a
`count`.

**El clic sigue en WMS `GetFeatureInfo` 1.1.0 a proposito.** No es lo mismo que `GetFeature`:
responde "que hay en este pixel" respetando simbologia y capas visibles, y funciona en capas con
WFS deshabilitado en GeoServer — `curvas_de_nivel` y `curvas_de_nivel_render` lo tienen
deshabilitado (`GetFeature` sobre ellas responde 400), asi que migrar el clic a WFS lo habria
roto ahi.

### Eliminado: `srs` del `WMS_BASE_CONFIG`

Declaraba `EPSG:6368` pero **nunca tuvo efecto**: la documentacion de OpenLayers dice que en
`ImageWMS` y `TileWMS` los parametros `WIDTH`, `HEIGHT`, `BBOX` y `CRS`/`SRS` "will be set
dynamically" — se sobrescriben con la proyeccion de la vista, que es 3857. Se retira de
`wmsConfig`, de `useWMSLayerFactory` y de `CatalogoMapView` para que nadie lo lea y crea que
puede cambiar la proyeccion del visor desde ahi.

No confundir con los otros dos `srs` del codigo, que si son reales: `format.srs` en
`downloadUrls` (CRS de descarga) y el `EPSG:6368` de `municipioCqlBuilder`, que es el CRS contra
el que se evalua el `BBOX()` del CQL.

## [1.105.1] - 2026-07-31

### Corregido: el visor caía en pantalla de error con Vite 8 (interop CJS de Rolldown)

`/mapa` mostraba «Algo salió mal...» desde el despliegue de 1.104.0. El error real era un React
#130 —«element type is invalid: got object»— capturado por el `errorElement` del router.

El culpable es el **interop CJS de Rolldown**. `lottie-react` se resuelve por su campo `browser`,
que apunta a un UMD, y Rolldown lo envuelve con `__toESM(mod, 1)`. Ese segundo argumento es
`isNodeMode`: con él, el helper asigna `default = module.exports` **ignorando el `__esModule`** que
el propio UMD declara. Resultado: `import Lottie from 'lottie-react'` entregaba el namespace
completo `{LottiePlayer, default, useLottie, useLottieInteractivity}` en vez del componente, y
`<Lottie />` recibía un objeto. Con Rollup (Vite 7) el interop respetaba `__esModule` y `default`
era el componente.

El arreglo es un alias en `vite.config.js` que apunta `lottie-react` a su build ESM
(`build/index.es.js`), con lo que no hay CJS que interoperar. Se revisó el resto de dependencias:
sólo `lottie-react` combina las tres condiciones que hacen falta para el fallo —CJS, `__esModule`
declarado e import por `default`—. `qr-code-styling` también entra como UMD, pero su chunk exporta
la clase directamente y el envoltorio queda correcto; `react-datasheet-grid` en mariachi usa
imports nombrados, que sobreviven al interop.

**Por qué no lo detectaron los tests ni el CI:** los 814 tests corren sobre el código fuente con el
pipeline de Vitest, no sobre el bundle de producción, y el `build` del CI sólo verifica que compile.
Un bundle que compila y falla al renderizar pasa las dos puertas. La verificación de este arreglo se
hizo cargando `/mapa` en Chrome headless contra el `dist` real.

## [1.105.0] - 2026-07-30

### Cambiado: React Router 8 por el advisory GHSA-qwww-vcr4-c8h2

El advisory de React Router (bypass de CSRF que permite ejecutar acciones antes de un 400) cubre
`>=7.12.0 <8.3.0`: **no hay corrección dentro de la línea 7**, así que la única salida era el
major. Sube de 7.14.2 a 8.3.0.

El agujero está en el modo RSC —React Server Components con server actions—, que MapaLab no usa:
es una SPA con `createBrowserRouter`. No era explotable aquí, pero mantenerlo dejaba un `high`
permanente en `npm audit` sin forma de distinguirlo de uno real.

La migración no tocó código. Pese a lo que sugiere la guía de actualización, en 8.3.0 todo se
sigue exportando desde `react-router`, y `react-router/dom` conserva `RouterProvider`, que es de
donde ya lo importaba `main.jsx`. Lo que desaparece es el paquete `react-router-dom`, que este
repo no usa. Los 814 tests pasan sin cambios.

Requiere React >= 19.2.7 (ya en 19.2.8) y Node >= 22.22.

## [1.104.0] - 2026-07-30

### Cambiado: Vite 8 con Rolldown, y React 19.2.8

Vite 8 reemplaza esbuild y Rollup por **Rolldown** (bundler en Rust) y **Oxc**. El build del
frontend pasa de **4.46 s a 400 ms** y el arranque del dev server a 176 ms. El widget se construye
en 28 ms. Junto con Vite suben `@vitejs/plugin-react` a 6.0.5, React y React-DOM a 19.2.8, Vitest
a 4.1.10 y Tailwind a 4.3.3.

La migración obligó a reescribir el chunking. `build.rollupOptions` es ahora
`build.rolldownOptions`, y la función `manualChunks` quedó deprecada en favor de
`output.codeSplitting.groups`, donde cada grupo se declara con una expresión regular contra el id
del módulo y una prioridad en vez de una cadena de `if`.

**El detalle que importa:** a diferencia de `manualChunks`, un grupo de `codeSplitting` arrastra
las dependencias de los módulos que captura. Con las prioridades traducidas literalmente del orden
anterior, React terminó dentro de `vendor-lottie` y React-DOM dentro de `vendor-router` — la app
habría tenido que descargar los 316 kB de Lottie para arrancar. Por eso `vendor-react` tiene ahora
la prioridad más alta (70) y el resto de los grupos van por debajo. Los ocho chunks resultantes
son equivalentes a los de Vite 7: `vendor-react` 189 kB (antes 193), `vendor-router` 90 kB
(antes 88), `vendor-ol` 378 kB (antes 386).

`html2canvas-pro` se agregó al grupo `vendor-export`, donde ya estaban sus pares, en vez de quedar
como chunk suelto.

El spinner de carga usa expresiones de After Effects (`loopOut`), que Lottie evalúa con `eval`
directo en runtime. Rolldown avisa de ello y el minificador Oxc podría haber renombrado las
variables de ese scope; se verificó ejecutando la animación desde el bundle minificado — renderiza
y avanza de frame sin errores.

Los 814 tests siguen pasando y `rollup-plugin-visualizer` funciona con Rolldown sin cambios.
Requiere reconstruir las imágenes de `frontend` y `nginx`.

**Aviso de despliegue:** el cambio de bundler cambia todos los hashes de los assets. Las sesiones
abiertas durante el deploy pueden caer en `chunk_load_error`; `public/error-recovery.js` las
recupera, pero conviene vigilar el check `client_errors` de `/ontoy` en la primera hora.

## [1.103.0] - 2026-07-30

### Cambiado: Makefile homologado con el resto del ecosistema

La interfaz de comandos es ahora la misma en los nueve repos: `up` levanta desarrollo sin
reconstruir y `deploy` hace produccion completa (`git pull` + `down` + `build` + `up`). Se
retiraron todas las banderas: el entorno se detecta por el nombre de proyecto de Compose y lo que
antes era un argumento ahora es un selector interactivo. Lo transversal vive en `make/common.mk` y
`make/lib.sh`, copiados en cada repo. Convencion completa en `ecosistema/makefiles.md` del repo de
contexto.

### Corregido: el Makefile apuntaba a un `docker-compose.yml` inexistente

El repo ya usa `compose.yaml` + `compose.dev.yaml` + `compose.prod.yaml`, pero las recetas de
produccion seguian pasando `-f docker-compose.yml`, asi que `prod` y `deploy` estaban rotos.

### Eliminado: `docker-compose.override.yml`

Prohibido por la convencion del ecosistema porque se autocarga. Su contenido era redundante: el
target `development` del Dockerfile ya arranca uvicorn con `--reload` y `compose.dev.yaml` ya monta
`backend/app`. Ademas declaraba `network_mode: host`, incompatible con los `ports:` del overlay.

### Eliminado: `mcp`

Levantaba un segundo servidor MCP por stdio dentro del contenedor. Desde 1.35.0 el MCP se sirve por
HTTP en `mapalab-mcp`; el target no se referenciaba en ningun lado y no aparecia ni en su propia
ayuda.

### Cambiado: `refresh-layer-tree` ya no delega a dataengine

Hacia `make -C ../dataengine refresh-layer-tree` con fallback HTTP. En produccion mapalab y
dataengine viven en VMs distintas, asi que esa rama no se ejecutaba nunca y siempre caia al
fallback. Ahora solo hace el `POST /layers/refresh-cache`, que es lo que de verdad corria.

### Cambiado: `dev`/`prod` pasan a `up`/`deploy`

Con ellos desaparecen `down-dev`, `down-prod`, `logs-dev`, `logs-prod` y `build-prod`: `down`
detecta y baja lo que este levantado, y `logs` pide el servicio con un selector.

### perf(download): cache de CSVs en Acervo (redirect 307) + endpoint async con asyncpg + buckets de latencia extendidos

Conjunto de cambios para descargar la presión del backend de MapaLab en producción al servir CSVs de capas. La métrica `http_request_duration_seconds` del instrumentator de FastAPI mide hasta el cierre del response, así que en `/download/{workspace}/{layer}` el "request duration" incluye el tiempo de transferencia al cliente — un CSV grande con cliente en conexión normal saturaba el bucket superior (10s) del histograma y disparaba `HighLatency` en Huachicol sin que hubiera problema real (100% 2xx). En producción los servidores son 4 separados (Gateway+Acervo en S1, MapaLab en S2, DataEngine en S4); en GCP staging todos comparten 1 VM y el almacenamiento es limitado, por eso el redirect a Acervo es opcional y la ruta on-the-fly sigue disponible.

#### Cambiado

- **`backend/app/routers/download.py`** (`download_layer`): convertido a `async def`. Si la request no trae filtros `date_from`/`date_to` y la tabla `mapalab.layer_downloads` tiene un registro con `generated_at` dentro del TTL (`DOWNLOAD_CACHE_TTL_HOURS=36` por default), devuelve `307` a `${ACERVO_MAPALAB_BUCKET_PATH}/{object_key}` (default `/acervo/mapalab/downloads/{schema}/{table}.csv.gz`). Sin filtros y sin dump fresco, o con filtros, cae a streaming on-the-fly.
- **`backend/app/repositories/download_repository.py`**:
  - Nuevo método `find_fresh_cache(session, layer_key, ttl_hours)` que devuelve `object_key` del dump si está dentro del TTL.
  - `stream_csv()` reescrito a `async def` + `asyncpg.Pool.copy_from_query(..., output=async_callable)` con una `asyncio.Queue` como puente entre el productor y el `StreamingResponse`. Reemplaza el workaround anterior de `os.pipe()` + thread bloqueante con `psycopg2.copy_expert`, que ocupaba un thread del threadpool de Starlette durante toda la descarga.
- **`backend/app/databases/async_pool.py`** (nuevo): pool `asyncpg` lazy, compartido entre workers de gunicorn, con `command_timeout=600s` y `max_size=max(DB_POOL_SIZE, 4)`. Reutiliza la resolución de `DB_NAME` del factory síncrono existente.
- **`backend/app/services/acervo_client.py`** (nuevo): wrapper boto3 lazy con `signature_version='s3v4'` para generar URLs presigned con TTL. Usa `ACERVO_PUBLIC_ENDPOINT` (default cae a `ACERVO_ENDPOINT` si no se setea) — la URL firmada debe apuntar al endpoint que el cliente final puede resolver, no al hostname interno de Docker.
- **`backend/app/server.py`**: el instrumentator extiende los buckets del histograma de latencia con `15, 30, 60, 120, 300` s para que las descargas largas no saturen el bucket superior y dejen ver el p95/p99 reales. `lifespan` ahora cierra el pool de asyncpg en shutdown.
- **`backend/app/config.py`**: nuevas variables `ACERVO_ENDPOINT`, `ACERVO_PUBLIC_ENDPOINT`, `ACERVO_ACCESS_KEY`, `ACERVO_SECRET_KEY` (credenciales del usuario `mapalab-user` del bucket `mapalab` de Acervo, no globales), `ACERVO_BUCKET` (default `mapalab`), `ACERVO_PRESIGN_TTL_SECONDS` (default 3600), `DOWNLOAD_CACHE_TTL_HOURS` (default 36).
- **`backend/requirements.txt`**: nuevas dependencias `asyncpg`, `boto3`.
- **`docker-compose.yml`**: el servicio `backend` ahora recibe `ACERVO_ENDPOINT`, `ACERVO_PUBLIC_ENDPOINT`, `ACERVO_ACCESS_KEY`, `ACERVO_SECRET_KEY`, `ACERVO_BUCKET`, `ACERVO_PRESIGN_TTL_SECONDS`, `DOWNLOAD_CACHE_TTL_HOURS`.

#### Notas de implementación

- **asyncpg + bytearray**: `asyncpg.Connection.copy_from_query(..., output=callable)` invoca el callable con `bytearray` (no `bytes`). Starlette's `StreamingResponse` espera `bytes | str` y falla con `AttributeError: 'bytearray' object has no attribute 'encode'`. El writer convierte explícitamente con `bytes(buf)` antes de poner en la queue.
- **asyncpg + fechas**: los parámetros de query con tipo `DATE` en Postgres no aceptan string en asyncpg (a diferencia de psycopg2). `_build_select` ahora hace `date.fromisoformat(date_from)` y `date.fromisoformat(date_to)` antes de pasarlos como params; el regex existente en el endpoint (`^\d{4}-\d{2}-\d{2}$`) garantiza que el string es parseable.

#### Por qué minor

Sin cambios visibles para el usuario del visor; sin breaking changes para integradores que usen `/download/`. En GCP staging todo sigue funcionando idéntico mientras `mapalab.layer_downloads` esté vacía (cae a streaming). En producción, requiere la migración Alembic `0016_layer_downloads` y el cron de dataengine para tomar efecto.

### Agregado: modo Vista por municipio (beta, sólo dev/staging)

Nuevo botón **"Jalisco"** en la barra superior derecha (al lado derecho de Descargar) que permite enfocar el visor en uno o varios municipios del estado. Layout final: `[Descargar | 📍 Jalisco | Share]` (sin `InfoModal`).

- **UI**: panel con buscador + lista de los 125 municipios; pill compacta con default "Jalisco" o "N municipios"/"Guadalajara" según selección.
- **Máscara visual**: VectorLayer sobre el mapa con polígono (outer = viewport, holes = municipios) en `rgba(0,0,0,0.4)`. Se replica en ambos paneles del modo swipe. El usuario percibe que ve solo esos municipios sin que las capas necesiten configuración.
- **Sin filtros CQL, sin metadata por capa**: el modo funciona uniforme para TODAS las capas (raster, vector, externas) sin requerir configuración en mariachi.
- **Switch IIEG/INEGI**: la fuente de polígonos (`geom_iieg` vs `geom_inegi`) se elige automáticamente según las capas de límite activas.
- **Backend propio**: vista materializada `mapalab.municipios` que une `mapa_base.limite_municipal` (IIEG) e `mapa_base.limite_municipal_inegi`. Refresh mensual desde dataengine-jobs (1° de cada mes a las 05:00) o manual con `make refresh-municipios`. Sin dependencia de GeoServer en runtime.
- **Endpoints REST**: `GET /municipios/` (lista con ETag + cache 1h) y `GET /municipios/geometries?source=...&claves=...` (GeoJSON EPSG:3857).
- **Persistencia completa**: URL (`?municipios=014,067`), share JSON (bump v1 → v2 con `payload.municipios`), sessionStorage.
- **Telemetría**: eventos `municipio_mode_enter/exit/change` y `municipio_panel_open`. Documentados en mariachi-admin → Documentación → Telemetría.

Gated por `VITE_APP_ENV in [dev, beta]` — el botón no aparece en producción.

Documentación completa en [`docs/municipio-mode.md`](municipio-mode.md).

#### Que cambio

**Dataengine:**
- **`jobs/alembic/versions/20260525_0015_municipios_materialized_view.py`** (nuevo): MV `mapalab.municipios` con `clave_geo`, `nombre`, `region`, `area_km2`, `area_ha`, `geom_iieg`, `geom_inegi` + indexes GIST.
- **`jobs/run_refresh_municipios.py`** (nuevo): `REFRESH MATERIALIZED VIEW CONCURRENTLY`.
- **`jobs/crontab`**: entrada `0 5 1 * *` para refresh mensual.
- **`Makefile`**: target `refresh-municipios` + entrada en `refresh-all`.

**Backend mapalab:**
- **`backend/app/routers/municipios.py`** (nuevo): endpoints REST con ETag.
- **`backend/app/repositories/municipios_repository.py`** (nuevo): SQL crudo con `ST_AsGeoJSON(ST_Transform(...))`.
- **`backend/app/server.py`**: registro del router.

**Frontend mapalab:**
- **`services/municipioService.js`** (nuevo): fetch + cache contra `/api/municipios/`.
- **`pages/maps/helpers/municipioMask.js`** (nuevo): helpers puros `buildMaskPolygon`, `unionGeometriesExtent`, `extractHoleRings`.
- **`pages/maps/hooks/useMunicipioMode.js`** (nuevo): estado + selección + telemetría.
- **`pages/maps/hooks/useMunicipioMask.js`** (nuevo): VectorLayer por map instance, recálculo en pan/zoom.
- **`pages/maps/components/MapExport/MunicipioFilterButton.jsx`** y **`MunicipioFilterPanel.jsx`** (nuevos): UI del modo.
- **`providers/MapsProvider.jsx`**: instanciación de los hooks + fit al bbox.
- **`pages/maps/components/MapToolsPanel.jsx`**: layout reorganizado, `InfoModal` eliminado.
- **`pages/maps/components/MapExport/Download.jsx`**: botón "Descargar" compacto (w-30) en lugar de "Descargar visualización" (w-235).
- **`pages/maps/hooks/useShareSerializer.js`** y **`useShareDeserializer.js`**: bump a `version: 2` + payload `municipios`, con backwards-compat para v1.
- **`pages/maps/hooks/useInitializeFromUrl.js`**: parseo de `?municipios=`.
- **`services/analyticsService.js`**: 4 trackers nuevos.

**Mariachi-admin:**
- **`features/documentacion/topics/TelemetryTopic.jsx`**: nueva Card con la documentación de los eventos del modo.

---

## [1.102.0] - 2026-07-30

### Agregado: sidecar `version-api` que fusiona los checks del backend

MapaLab era el unico servicio del ecosistema sin sidecar `/ontoy`, y por eso `huachicol-monitor`
tenia que entrar al handler del backend. Ahora tiene el suyo, con una diferencia respecto al del
resto: **no reemplaza los checks de la aplicacion, los absorbe**.

Un sidecar plano solo reporta `disk` y `containers`. El `/ontoy` del backend publica `db`,
`client_errors` y `embeds` — y `client_errors` es lo que sustituyo a Sentry para detectar
pantallas blancas. Cambiar uno por otro habria apagado esa alerta.

La variable `ONTOY_UPSTREAM_URL` (agregada en huachicol 2.2.0, la implementacion de referencia)
hace que el sidecar consulte el `/ontoy` del backend por la red interna y fusione su respuesta:

- los `checks` del backend se suman a los propios, sin pisarlos;
- `version`, `released_at` y `deployed_at` se toman del backend, que es quien tiene el dato real
  (`backend/app/__version__.py`) — el sidecar no necesita un `version.json` propio y no puede
  quedar desincronizado, que es justo lo que fallo en 1.101.1;
- si el backend no responde, aparece un check `upstream` en `down` y el `/ontoy` devuelve 503;
- si el backend se declara `down` sin un check que lo explique, se respeta su `status`.

El sidecar corre bajo el perfil `prod`, monta el socket de Docker en solo lectura y **no recibe
entrada de usuario**: su unica ruta es `/ontoy` y no acepta parametros. Nueva variable de entorno:
`ONTOY_DISK_PATH`.

### Cambiado: `/api/ontoy` cerrado, el monitor entra por `/ontoy`

El `deny all` que 1.99.1 puso sobre `= /mapalab/api/ontoy` no cubria `/api/ontoy`, la variante sin
prefijo que atiende `location /api/` por el puerto directo del nginx. La exposicion a internet ya
estaba cerrada desde gateway-hub 1.35.1 —el gateway reescribe el prefijo, asi que el deny de aqui
nunca se evaluaba—, pero cualquiera dentro de la LAN podia leer el payload.

No se podia cerrar sin mas: era por donde entraba `huachicol-monitor` desde otro nodo, y filtrar
por IP no sirve porque el gateway y el monitor corren en el mismo host y llegan con la misma IP de
origen. Con el sidecar existiendo, ya hay a donde mandarlo:

| Ruta | Antes | Ahora |
|---|---|---|
| `/ontoy` | no existia | proxy al sidecar; es el target del monitor |
| `/api/ontoy` | 200 en toda la LAN | `deny all` |
| `/mapalab/api/ontoy` | `deny all` (nunca evaluado) | `deny all` |

Las dos topologias quedan cubiertas con la misma configuracion:

- **monolito** (Proxmox, GCP) — el monitor resuelve `mapalab-version-api:8088` por `iieg-network`,
  sin pasar por nginx;
- **microservicios** (S1–S4) — el monitor entra por `http://<S2>:8081/ontoy`, el puerto del nginx
  que ya esta abierto entre nodos. **No hace falta publicar el 8088 ni pedir apertura al FortiGate.**

**Al desplegar:** `targets.json` de huachicol no se versiona, asi que hay que apuntar el target de
mapalab a `/ontoy` a mano en cada entorno. Y gateway-hub 1.37.0 tiene que ir **antes**: es quien
cierra `/mapalab/ontoy` a internet, porque su rewrite deja el prefijo fuera del alcance de este
nginx.

---

## [1.101.1] - 2026-07-30

### Corregido: `sync-version.sh` no sincronizaba la version del backend

El script alineaba `README.md` y `package-lock.json` con `frontend/package.json`, pero dejaba
fuera `backend/app/__version__.py` — que es de donde sale el `version` de `/ontoy`. Al depender de
que alguien lo actualizara a mano, **estuvo congelado en 1.74.0 desde mayo** mientras el frontend
avanzaba hasta 1.96.x.

Consecuencia: el monitor y el panel de Observabilidad reportaban una version falsa de MapaLab
durante meses, y la verificacion `curl /ontoy | grep version` de los despliegues **nunca podia
pasar** para este repo. Confirmado en produccion el 2026-07-30, donde `/ontoy` seguia diciendo
`1.74.0` con el codigo en 1.96.2.

#### Corregido

- `scripts/sync-version.sh` escribe tambien `backend/app/__version__.py` desde
  `frontend/package.json`, que es la fuente unica de version del repo.

---

## [1.100.1] - 2026-07-30

### Corregido: una leyenda que no carga deja de reportarse como error

`useWMSLegend` registraba con `console.error` el fallo de `GetLegendGraphic`, pese a que el caso
es recuperable: devuelve `null` y la capa se dibuja sin leyenda. El resultado era una traza roja
completa en la consola del navegador cada vez que GeoServer no respondia esa peticion, y el mismo
ruido en la salida de los tests que ejercitan ese camino.

Pasa a `console.debug`, con el formato que ya usan los dos avisos equivalentes del flujo de capas
WMS: `wmsCapabilitiesService` ante un GetCapabilities fallido y `centerOnLayer` cuando no puede
resolver un extent.

---

## [1.101.0] - 2026-07-30

### Se va el entorno staging; el profile de nginx se llama `prod`

El staging nunca se uso. No habia rama, ni pipeline, ni VM propia: solo un `.env.staging` que
apuntaba a localhost con `ENVIRONMENT=production` adentro, y tres targets de `make` que en la
practica eran el modo produccion con otro nombre.

Lo que si existe y se queda es el despliegue de GCP, que no es un staging: es produccion con
`VITE_APP_ENV=beta`, y esa etiqueta es la que enciende el badge naranja «test», el `TestEnvModal`
y las herramientas `nonProdOnly`. Nada de eso se toco.

#### Eliminado

- Targets `make staging`, `make down-staging` y `make logs-staging`, y la variable
  `COMPOSE_STAGING` del Makefile. `make logs-prod` reemplaza a `logs-staging`.
- El archivo `.env.staging` (no estaba versionado).
- El perfil `--env staging` y la variable `STRESS_TEST_STAGING_URL` de `scripts/stress_test.py`.

#### Cambiado

- **El profile de compose `staging` pasa a llamarse `prod`.** Nunca fue un profile de staging: era
  el que levanta nginx, y `make prod` y `make deploy` ya lo usaban con `.env.production`.
- **Al desplegar esta version hay que bajar los contenedores viejos antes.** Un
  `docker compose --profile prod down` no ve lo que se levanto con el profile anterior:

  ```bash
  docker compose -p mapalab --profile staging down   # con el checkout viejo
  # o, si ya se hizo checkout del nuevo:
  docker stop mapalab-nginx-1 && docker rm mapalab-nginx-1
  ```

---

## [1.100.0] - 2026-07-30

### Cambiado: los rechazos de embed son un check, y el resto de contadores se va

Los contadores que la 1.99.0 mudo a `/ontoy` no los leia nadie: el monitor de huachicol solo
persiste `status`, `checks`, `containers`, `version` y `deployed_at`. Y ademas eran acumulados en
memoria de cada worker, asi que los numeros salian parciales y nunca podian compararse contra un
umbral.

Los dos que si dicen algo pasan a ser un check con su propio `status`:

- **`embeds`**: rechazos por llave invalida (`denied`) y por cuota agotada (`quota_exceeded`),
  contados sobre una ventana de 15 minutos. `degraded` a partir de 30, con detalle del desglose.
  Sirve para notar que alguien esta probando llaves; ese conteo era justo el que no convenia
  publicar en abierto, y desde la 1.99.1 el endpoint ya no lo esta.

Los errores JS del embed dejan de tener contador propio y se registran en `client_errors`, que ya
era un check con umbral: un solo lugar para los sintomas del navegador.

Se borran los de volumen puro —`tree_requests`, `tree_cache_hits`, `tree_refresh`,
`search_requests`, `download_requests`, `embed_requests`, `mcp_calls`—, el modulo `app/metrics.py`
completo y el `/metrics` que quedaba en el servidor MCP. Medir trafico pide una base de series
temporales, que es justo lo que el ecosistema decidio no tener.

La mecanica de ventana con archivo y `flock` que ya usaba `client_errors` se extrajo a
`services/ventana_eventos.py` y ahora la comparten los dos trackers.

### Nota de despliegue

**Hay dos variables nuevas en el `.env`**, sin las cuales el compose falla al levantar (usa `:?`):

```
EMBED_ABUSE_WINDOW_MINUTES=15
EMBED_ABUSE_WARN_COUNT=30
```

## [1.99.1] - 2026-07-30

### Corregido: `/ontoy` estaba expuesto a internet y ahora publica contadores

Al mudar los contadores a `/ontoy` en la 1.99.0 se revisó quién puede leer ese endpoint. Resulta que
**el `/ontoy` del backend era alcanzable desde fuera** por dos rutas: `/mapalab/api/ontoy` a través
del gateway (que enruta todo `/mapalab/api/` al backend) y el puerto `3006` de `mapalab-nginx`
publicado en el host. Respondía 200 a cualquiera.

No era una exposición de diseño: el gateway publica a propósito el `/ontoy` de gateway-hub,
geoserver, acervo, huachicol y sieej —sidecars que solo dicen versión y estado—, pero mapalab no
está en esa lista; caía por la regla general del prefijo. mariachi, con el mismo patrón de handler,
no es alcanzable por ninguna ruta pública.

Lo que se habría filtrado al desplegar la 1.99.0: el volumen de árbol, búsquedas, descargas, embeds
y llamadas MCP, y sobre todo `embed_denied` y `embed_quota_exceeded`, que le sirven a quien esté
probando API keys como oráculo para saber si sus intentos se están rechazando. Ya sin contadores,
el payload también trae `checks.db.detail` con el mensaje de la excepción, que ante una caída de
Postgres puede incluir host y usuario.

Se bloquea `= /mapalab/api/ontoy` en `nginx/nginx.conf` con el mismo `deny all` que tenía
`/metrics`. El bloqueo cierra las dos rutas de una vez, porque el gateway pasa por ese mismo nginx.
huachicol no se ve afectado: sondea `http://mapalab-backend-1:8000/ontoy` por la red interna, sin
pasar por nginx —verificado, sigue respondiendo 200—, y el panel de monitoreo del admin tampoco,
porque lee `/sistema/monitor/status` del backend de mariachi y no los `/ontoy` directamente.

## [1.99.0] - 2026-07-30

### Eliminado: la instrumentacion que ya no lee nadie

La 1.98.0 dejo contadores e histogramas calculandose en memoria sin superficie de lectura. Se
borran los cinco contadores que `/ontoy` no publica (`shares_created`, `shares_accessed`,
`shares_pinned`, `embed_wms_proxy`, `embed_telemetry`) y **todo el motor de histogramas**:
`observe()`, el diccionario `_histograms`, los buckets por defecto y las dos series que lo usaban
(`embed_vital_ms` y `mcp_latency_ms`).

Con los histogramas se va el bucle que procesaba los Web Vitals en `POST /embed/telemetry` y su
allowlist. **El endpoint sigue aceptando el campo `vitals`**: el widget lo manda y hacerlo fallar
seria romper a los embebedores en producción; simplemente ya no se procesa. Los errores JS, que si
se publican en `/ontoy`, se siguen registrando igual.

Un histograma sin base de series temporales detras no da percentiles ni tasas: si mas adelante se
quieren latencias, el camino es medirlas donde haya con que agregarlas, no reconstruir los buckets
a mano.

## [1.98.0] - 2026-07-30

### Eliminado: prometheus, con los contadores mudados a `/ontoy`

huachicol dejo de ser un stack de observabilidad en su 2.0.0 (2026-07-21) y hoy solo sondea el
`/ontoy` de cada servicio, asi que `GET /metrics` exponia metricas que ya nadie scrapeaba.

Se retiran `prometheus-fastapi-instrumentator`, la dependencia transitiva `prometheus-client`, el
middleware de instrumentacion, el endpoint `/metrics` y el `location` que lo bloqueaba en
`nginx/nginx.conf` (defensa en profundidad que dejo de tener objeto). El sistema de contadores
propio se conserva y ahora viaja en el payload de `/ontoy` bajo la llave `counters`, sumado sobre
las etiquetas de cada contador:

`tree_requests`, `tree_cache_hits`, `tree_refresh`, `search_requests`, `download_requests`,
`embed_requests`, `embed_denied`, `embed_quota_exceeded`, `embed_js_errors` y `mcp_calls`.

Quedan contandose en memoria pero sin exponer los `shares_*`, `embed_wms_proxy`, `embed_telemetry` y
los histogramas de `observe()` (vitals del embed y latencia MCP): un histograma sin base de series
temporales detras no aporta nada accionable en un sondeo. Añadir un contador es agregar su nombre a
`ONTOY_COUNTERS`.

### Cambiado: nginx a 1.30.4-alpine

`nginx/Dockerfile` usaba la etiqueta flotante `nginx:stable-alpine`. Se fija la linea estable
parchada contra **CVE-2026-42533** (CVSS 9.2, desbordamiento de heap con posible ejecucion remota de
codigo), **CVE-2026-60005** y **CVE-2026-56434**. Ambas configuraciones (`nginx-main.conf` y
`nginx.conf`) se validaron con `nginx -t` contra 1.30.4 sin cambios.

### Nota de despliegue

Hay que reconstruir las imagenes del backend y de nginx. Quien tuviera algo apuntando a
`GET /mapalab/api/metrics` debe mirar `counters` en `/ontoy`.

## [1.97.1] - 2026-07-29

### El contexto, el roadmap y los planes se movieron al repo central

Solo documentacion; sin cambios de codigo.

#### Eliminado

- `docs/context.md`, `docs/roadmap.md`, `docs/taiga.md`, `docs/avisos-multipunto-pendiente.md` y
  `docs/planes/` completo (9 archivos). Viven ahora en el repositorio central de contexto
  (`iieg-oficial/context-ame-esta`): `repos/mapalab/contexto.md`, `pendientes.md` (con triage de
  cada item del roadmap contra este changelog) y `planes/` con los que siguen abiertos. Los planes
  ya ejecutados —widget embebible y refactor del item de capa activa— quedaron condensados en
  `historial/`.
- La guia de Taiga: la gestion de proyectos se maneja **solo** desde el repo central
  (`ecosistema/taiga.md`), que ademas conserva las credenciales fuera de git. Las dos copias que
  existian (esta y la de sieej) se contradecian sobre como vincular una historia a una epica; la
  version verificada quedo en el central.

#### Cambiado

- `docs/render_layers.md` → `docs/render-layers.md` y `docs/stress_test.md` →
  `docs/stress-test.md`, por la convencion de nombres del ecosistema (kebab-case). El script
  `scripts/stress_test.py` **no** se renombro: las menciones en los docs apuntan al archivo real.
- README: el enlace al roadmap ahora apunta al repo central; `docs/municipio-mode.md` apunta al
  plan migrado.

#### Corregido

- `docs/mcp.md` enlazaba a `../../docs/SKILL.md`, una ruta que nunca existio en este repo (es una
  skill del repositorio central).

## [1.97.0] - 2026-07-29

### Corregido: la pantalla en blanco al recargar el visor

Tres piezas se alineaban para dejar la pantalla vacía, sin error ni mensaje:

1. **`index.html` sin `Cache-Control` en la raíz de producción.** La regla de `no-cache` vivía
   anidada en `location /`, que solo cubre el despliegue en la raíz del dominio. En `/mapalab/`
   nginx resolvía por `alias` más la directiva `index` y devolvía el HTML sin ninguna cabecera
   de caché, así que el navegador aplicaba caché heurística. Tras un deploy, un `index.html`
   guardado pedía chunks cuyo hash ya no existe. Los deep links (`/mapalab/mapa`) sí caían en
   el fallback y sí recibían `no-cache`: de ahí que el fallo pareciera aleatorio.
2. **El recuperador de chunks era de un solo disparo.** `error-recovery.js` marcaba una bandera
   en `sessionStorage` antes de recargar y, al volver, si la bandera existía hacía `return`
   **sin registrar ningún listener**. Un segundo fallo consecutivo —el caso normal, porque el
   HTML cacheado no cambia— quedaba sin reload, sin reporte y sin mensaje.
3. **El único ErrorBoundary estaba roto.** Su fallback era `ErrorPage`, que llama
   `useRouteError()` y renderiza `<Link>`, pero el boundary envolvía al `RouterProvider` desde
   fuera: al no haber contexto de router, el fallback lanzaba dentro del propio boundary y
   React desmontaba la raíz. Cualquier error que escapara del router terminaba en blanco.

Ahora `index.html` se sirve con `no-cache` en las dos rutas, los assets con hash responden
`404` explícito cuando no existen, `error-recovery.js` reintenta hasta dos veces con un
contador (y a la tercera muestra una pantalla con instrucciones de recarga forzada en lugar de
nada), y el boundary usa `ErrorScreen`, un componente presentacional sin hooks de router.
`error-recovery.js` también salió de la regla `immutable` de un año: antes, un arreglo al
recuperador no llegaba a los usuarios recurrentes.

### Corregido: el visor se quedaba esperando las capas para siempre

`LayersProvider` pedía árbol y orden inicial con `Promise.all` y sin timeout: si el backend no
respondía —no fallaba, colgaba—, `loading` no volvía nunca a `false`. Y la espera tampoco se
veía, porque el `LottieSpinner` se montaba sin `loop`, sin `autoplay` y sin clase de tamaño:
la animación quedaba congelada en un contenedor de dimensión cero. El resultado era otra
pantalla en blanco.

Los fetch de arranque llevan `AbortSignal.timeout` de 20 s y un reintento; el error muestra
`ErrorPage` con botón para reintentar sin recargar toda la aplicación, y el spinner ahora se
ve. El mismo timeout se aplicó a `fetchShare`, que podía colgar la inicialización desde una
URL compartida (`?s=`) y dejar el mapa sin capas.

### Cambiado: la telemetría de errores de cliente viaja por huachicol

Sentry se retira del proyecto: `@sentry/react`, `@sentry/vite-plugin` y `sentry-sdk[fastapi]`,
junto con `SENTRY_DSN` y `SENTRY_TRACES_SAMPLE_RATE`. Nunca estuvo activo en producción —el DSN
no se inyectaba en el build— y el ecosistema ya no lo usa.

El canal ahora es el mismo que vigila el resto de los servicios. El backend acumula los
beacons de error de cliente en una ventana móvil y los publica como el check `client_errors`
de `/ontoy`, que huachicol-monitor ya sondea cada 60 s:

```json
"client_errors": { "status": "degraded", "count": 6, "window_minutes": 15,
                   "by_type": { "chunk_load_error": 6 },
                   "detail": "6 errores de carga en el navegador en 15 min (...)" }
```

El check nunca reporta `down`, así que `/ontoy` sigue respondiendo `200` y un pico de errores
de navegador no se confunde con el servicio caído: llega a Discord como degradado. Requiere
huachicol ≥ 2.1.0 para que el detalle aparezca en la alerta. Umbral y ventana se configuran
con `CLIENT_ERROR_WARN_COUNT` y `CLIENT_ERROR_WINDOW_MINUTES`.

### Corregido: una descarga podía congelar al worker que la atendía

`download_layer` estaba declarado `async def` pero por dentro abría sesión de SQLAlchemy y
leía de acervo con boto3, ambos síncronos: mientras resolvía la capa, el event loop de ese
worker quedaba bloqueado y no atendía nada más, ni los endpoints que sirven de caché en
memoria. Esa preparación se movió a `asyncio.to_thread`; el streaming del CSV no cambia.

### Agregado: timeouts explícitos hacia la base de datos

El engine se creaba sin límites: una conexión o una query atorada retenía su lugar en el pool
indefinidamente, y con `DB_POOL_SIZE=5` en producción bastan cinco para dejar al worker sin
conexiones. Se agregan `DB_CONNECT_TIMEOUT_SECONDS` (10) y `DB_STATEMENT_TIMEOUT_SECONDS`
(30), más `pool_recycle` de 30 min. El límite de sentencia se aplica vía `options` de libpq,
soportado por el pgbouncer de dataengine (v1.25) y coherente con su `query_timeout=120`.

### Corregido: el mapa quedaba muerto si el basemap no existía

`useMapInitialization` salía temprano cuando `basemaps[baseMapId]` no resolvía —posible al
restaurar una vista compartida— sin crear el mapa, sin cleanup y dejando parchado el
`HTMLCanvasElement.prototype.getContext` global. Ahora cae al basemap por defecto y el parche
se aplica después de la validación. También se protegieron los accesos a `paneSnapshot` en
`MapView` y la lectura de `localStorage` de `TestEnvModal`, que corría en el primer render de
todas las rutas y lanzaba `SecurityError` con cookies de terceros bloqueadas.

## [1.96.2] - 2026-07-27

### Cambiado: la propuesta de tarjeta es anónima, sin campo de correo

El formulario pedía un correo opcional «para avisarte del resultado». Mariachi no tiene envío de correo —lo único que notifica es a Discord por webhook—, así que esa promesa no se podía cumplir: el dato habría quedado guardado sin que nadie lo usara.

Se retira el campo. La propuesta no pide ningún dato personal y el circuito se cierra donde tiene que cerrarse: en la bandeja de moderación del admin. La columna `email` de la tabla queda reservada por si más adelante existe envío, pero nadie la llena.

## [1.96.1] - 2026-07-27

### Cambiado: el editor de tarjeta también se abre desde la tarjeta abierta

Hasta ahora sólo se llegaba al editor desde la lista de capas. `ActionsToolbar` estrena una prop opcional `onEdit` —aditiva, el visor no la pasa— que suma un botón de lápiz a la columna de acciones del `CatalogoInfoBox`, tanto en la columna de escritorio como en la fila de herramientas del panel móvil.

Al entrar por ahí, el feature que ya está seleccionado se pasa como `featureMuestra`: la vista previa arranca con el dato que el usuario tiene en pantalla en lugar de pedir otro por WFS. La prop existía en el editor y no la usaba nadie.

### Corregido: los items de la lista de capas no mostraban cursor de mano

Tailwind 4 retiró el `cursor: pointer` que los navegadores daban por defecto a `<button>`, así que la fila se sentía inerte aunque fuera clickeable.

## [1.96.0] - 2026-07-27

### Agregado: personalizar la tarjeta de información desde el catálogo

Cada capa de la lista muestra un botón de edición al pasar el cursor (o al enfocarlo con el teclado), pegado a la orilla derecha. Abre un editor donde se eligen los campos que aparecen al hacer clic en el mapa: se arrastran —o se hacen clic— desde la lista de campos disponibles a tres zonas (título, cifras y detalles), se reordenan y se les pone el nombre con el que los verá quien consulta. La vista previa usa el mismo `renderCard` del visor sobre un registro real de la capa, así que lo que se ve es exactamente lo que quedaría.

La propuesta no publica nada: pasa a revisión del IIEG y sólo al aprobarse cambia la tarjeta pública. Gateado a `VITE_APP_ENV` `dev`/`beta`, como el resto del catálogo.

- **Campos disponibles**: `fetchNonGeometryColumns`, el mismo helper que ya usaba la descarga de CSV vía WFS.
- **Registro de muestra**: el de la tarjeta abierta si la hay; si no, uno traído con WFS `maxFeatures=1`.
- **El borrador** vive en `helpers/infoboxDraft.js` como funciones puras, con su propio test: hereda la configuración existente, rellena etiquetas faltantes a partir del nombre del campo, respeta el tope de 12 filas por bloque y produce sólo las claves que el validador del servidor acepta.
- **Envío**: `POST /api/public/mapalab/catalogo/infobox-propuestas` con honeypot. El servidor limita a 3 por hora por IP y a 10 propuestas pendientes por capa.

Eventos nuevos: `catalogo_infobox_editor_open` y `catalogo_infobox_propuesta`. **Requieren mariachi 1.91.0**, que los registra en `ALLOWED_EVENT_NAMES`.

## [1.95.0] - 2026-07-27

### Agregado: el catálogo puede tener su propia configuración de tarjeta

`mapalab.catalogo_capas` no tenía `infobox_config`: heredaba la del árbol con un `LEFT JOIN LATERAL` sobre `mapalab.layers`. Eso dejaba dos huecos — las capas del catálogo que no existen en el árbol se quedaban sin tarjeta, y cualquier ajuste hecho desde el catálogo habría tenido que escribir en `layers`, cambiando también lo que ve el visor principal.

Con la migración `0029` de dataengine la tabla estrena su propia columna. La lectura hace `COALESCE(c.infobox_config, l.infobox_config)`: si la capa no define la suya sigue heredando, así que nada cambia para las ya configuradas. La respuesta suma `littleCardPropia` para distinguir una configuración propia de una heredada.

Es la base del editor de tarjetas a solicitud del catálogo, cuya escritura tocará únicamente esta columna.

## [1.94.0] - 2026-07-27

### Agregado: la tarjeta de información del catálogo reusa el InfoBox del visor

`CatalogoInfoBox` reimplementaba una versión mínima: posicionaba por pixel fijo, con un recorte manual contra el viewport (`PANEL_WIDTH = 239`, `innerHeight - 220`) y sin acciones. El defecto de fondo era el anclaje: la tarjeta guardaba el pixel del clic, así que al mover o hacer zoom en el mapa se quedaba quieta mientras el feature se iba.

Ahora monta las piezas del `InfoBox` del visor, que **reciben todo por props y no tocan ningún contexto**: `InfoBoxArrow` (ancla a la coordenada y la sigue en pan/zoom), `useViewportContainment`, `useDraggablePanel`, `ActionsToolbar` (cerrar / mover / descargar CSV / centrar selección), `ScrollContainer`, y en móvil `MobileSheet` + `InfoBoxTools` + `DismissGesture`, con los mismos estilos del visor. Se ganan la columna de acciones, la vista móvil real y el descarte por gesto.

No se monta `InfoBox.jsx` completo a propósito: está acoplado a `MapsContext`, `SiderContext` y `useFeatureInfo` —que exige `LayersProvider` y `EventoProvider`—, y más de la mitad de su lógica (capas alternativas, swipe, selección por polígono, `WhatsNewModal`) no aplica a una vista de una sola capa. `downloadFeaturesAsCSV` acepta `allLayers` opcional y cae a `result.layerName`, lo que permitió prescindir del árbol.

Dos ajustes puntuales: la tarjeta se queda en `z-30` (en el visor va en `z-5`, debajo de los paneles; aquí quedaría bajo el de leyendas), para lo cual `InfoBoxArrow` recibió una prop `zIndex` con default `4` — cambio aditivo que no altera el visor. Y `centerOnResults` reubica la tarjeta con un `onReposition` que actualiza el pixel en `CatalogoMapView`, en vez del `clickPosition` del provider.

Evento nuevo `catalogo_infobox_action` (`download` / `center_group`). **Requiere mariachi con el evento en `ALLOWED_EVENT_NAMES`**: el collector valida contra lista blanca y un nombre desconocido tumba el lote entero con 422, no solo ese evento.

### Corregido: la lista de instituciones se aplastaba con «Todas» seleccionada

El contenedor del buscador reparte `80vh` entre encabezado, panel de capas, pills, lista de instituciones e input. La lista era el único bloque sin `shrink-0`, así que absorbía toda la compresión: con «Todas» el panel de capas trae todos los resultados y llena su `calc(80vh-140px)`, dejando la lista en poco más de dos elementos. Al filtrar por institución hay menos capas y por eso se veía bien.

Ahora la lista lleva `shrink-0` y el presupuesto se reparte explícitamente: con la lista desplegada, el panel de capas baja a `calc(30vh-70px)` y la lista toma `calc(50vh-70px)` (nueva prop `maxHeight`), que suman exactamente los `80vh` disponibles. Sin ese reparto, el `shrink-0` habría empujado el bloque fuera del viewport.

### Cambiado: superficies homologadas en el buscador del catálogo

Las pills de institución adoptan el `backdrop-blur-md` del título y pierden su sombra propia; en hover toman el mismo relleno sólido que la pill activa. Los márgenes entre encabezado, panel, pills e input se unifican en `STACK_SPACING` (`mb-3`), antes repartidos entre `mb-2` y `mb-4`.

Al quedar todo con la misma sombra, las dos constantes se colapsan en una: `PANEL_SHADOW` pasa a ser la suave (`0 6px 20px rgba(26,38,100,.10)`) y desaparece la anterior, que además proyectaba hacia arriba.

### Cambiado: la barra de periodicidad se reacomoda en móvil

Estaba centrada arriba y chocaba con el logo. Ahora se coloca bajo el botón de «Regresar a Mapalab», alineada a la orilla inferior del bloque del logo (`top-17 left-26`, derivados de sus 92 px de alto y 80 px de ancho más el `gap-2`), con `h-10` explícito para igualar la altura de ese botón. La pill toma sólo el ancho de su contenido; el panel desplegable se sale del contenedor con `-ml-22` para ocupar el ancho completo del viewport. En escritorio se mantiene centrada.

La «×» de cerrar el panel deja de tener fila propia y entra en la misma línea del título «Periodicidad», pegada a la derecha, vía la nueva prop `titleAction` de `PeriodicitySection` (el encabezado ya no crece). El bote de basura vuelve a la pill mientras el panel está cerrado y usa la variante `hover` del icono, que es la roja — la variante `normal` es gris y no se podía recolorear por CSS al servirse como `<img>`.

### Cambiado: el panel de leyendas se ajusta en móvil

El encabezado medía 54 px (`pt-3` + botón `size-8` + `pb-2.5`); baja a 40 px con `min-h-10 py-1.5` y botones `size-7`, homologado con la pill de periodicidad. Minimizado toma `rounded-full` para leerse como pill, y el nombre de la capa se trunca con elipsis en vez de saltar de línea e invadir el espacio de otros componentes — al maximizar vuelve a ocupar las líneas que necesite.

El botón de información de la barra de atribuciones pasa a `size-7 md:size-6`: en móvil empata con el botón `©` de 28 px que tiene al lado y en escritorio con la barra de «Contribuciones», de 24 px de alto.

## [1.93.1] - 2026-07-27

### Cambiado: el panel de leyendas del catálogo aprovecha el ancho en móvil

Maximizado ocupaba los mismos 240 px que minimizado, así que las leyendas anchas se apretaban en media pantalla. Ahora, cuando está abierto, toma todo el ancho del viewport (`calc(100vw-2rem)`, respetando el margen del `right-4`); minimizado conserva su `min(240px,50vw)`. En escritorio no cambia nada.

Con ese ancho ya cabe el botón de minimizar, que estaba oculto en móvil (`hidden md:flex`): ahora aparece mientras el panel está maximizado y se esconde al minimizarlo, donde no cabe. El encabezado sigue siendo clickeable en ambos estados, así que abrirlo nunca dependió del botón.

El panel abierto sube a `z-21`. `CatalogoBackButton` se monta después en el DOM con el mismo `z-20`, de modo que a ancho completo el logo quedaba encima del contenido de la leyenda.

## [1.93.0] - 2026-07-27

### Cambiado: los controles de periodicidad hablan un solo idioma de color

Hasta ahora el color de los controles de fecha era arbitrario: el botón de animación siempre era naranja (aunque estuviera detenido), la velocidad y la dirección siempre moradas, y los años y meses usaban azul `#2E4372` en reposo. Ahora el color **codifica estado**: morado mientras el control está en su valor por defecto, naranja en cuanto se acciona o se cambia. Aplica al play/pausa (morado detenido, naranja reproduciendo), a la velocidad (naranja si no es 1s), a la dirección (naranja si es de derecha a izquierda) y a los años y meses (naranja cuando están seleccionados).

En modo comparación el color lo sigue dictando el lado (A morado, B naranja), porque ahí identifica el panel y esa lectura es prioritaria.

La regla vive en `pages/maps/helpers/periodicityTones.js` (`toneStateFor`, `toneClasses`, `toneButtonFor`) y la consumen `SimpleDateSelectorParts`, `SimpleDateSelector`, `LayerDateControls` y `CatalogoTimeBar`, en lugar de las tres paletas duplicadas que había.

### Cambiado: bordes y radios homologados en los controles de fecha

Los botones de solo icono (dirección del loop) pasan a `rounded-full` y los de acción con texto (velocidad, «Ver animación») a `rounded-[14px]`, el radio de botón con label ya establecido en el resto del visor. Los años, los meses y el badge del año expandido conservan su `rounded-[9px]`.

El borde toma el mismo color que el texto y el icono, y en reposo se pinta del color del propio fondo (`#F9FBFF`) en vez de transparente: así ocupa su píxel siempre y el botón no se percibe más chico cuando no está accionado.

### Cambiado: el título de la sección de periodicidad

Sube a 15 px y pierde los dos puntos finales. Al vivir en `PeriodicitySection`, aplica al modal del visor y al panel del catálogo, en escritorio y en móvil.

### Corregido: regresar a la vista de años ya no borra la selección

La flecha de regreso limpiaba año y meses, dejando la capa sin filtro de fecha. Ahora selecciona el año completo del que se venía, que es lo que el gesto sugiere. En capas raster mensuales conserva el mes: ahí el filtro es un valor `TIME` puntual y «todo el año» no existe, así que vaciarlo dejaba la vista marcando el año mientras el WMS seguía pidiendo el mes anterior.

### Corregido: la animación no se reflejaba en el panel de fechas del Catálogo

`SimpleDateSelector` solo resalta el mes o el año en curso cuando `showLoopHighlight` es verdadero, y esa bandera se apaga en cuanto el consumidor pasa `getSpecificFilterOverride`. `CatalogoTimeBar` lo pasaba sin declarar `loopAppliesToSlot`, así que con el panel abierto el loop avanzaba en el mapa pero ningún botón lo indicaba. Ahora lo declara.

### Cambiado: la pill de fecha del Catálogo se resume y estrena bote de basura

Con más de tres meses seleccionados la pill enlistaba todos los nombres y desbordaba. Ahora se resume: rango si son contiguos («Enero a Mayo de 2024») o conteo si no lo son («4 meses de 2024»). El tope vive en `formatDateFilterPill` (`dateLoopHelpers.js`), que envuelve a `formatLoopLabelLong` con `maxMonths: 3`; el helper original no cambia de comportamiento para el resto de sus consumidores.

Además, el botón que quitaba el filtro dejó de ser una «×» ambigua y ahora es un bote de basura rojo. La «×» pasó a su papel real, cerrar el panel, y se coloca según el espacio disponible: en escritorio entra al final de la barra de acciones del panel (vía la nueva prop opcional `trailingAction` de `PeriodicitySection`) y en móvil se queda anclada en la esquina superior derecha, en una fila `sticky` que sigue visible al hacer scroll.

En móvil el bote de basura sale de la pill y queda solo en la barra de acciones del panel, empujado a la derecha con `ml-auto md:ml-0` para que no se pierda si la fila hace wrap. Consecuencia a tener en cuenta: con el panel cerrado hay que abrirlo para quitar el filtro.

La pill y el panel bajan a `PANEL_SHADOW_SOFT` (`0 6px 20px rgba(26,38,100,.10)`), una nueva constante de `catalogoStyles.js`. La sombra anterior proyectaba también hacia arriba (`0 -18px 48px`), que tiene sentido en el buscador — se abre desde el borde inferior — pero no en un panel que cae hacia abajo. `PANEL_SHADOW` sigue vigente para el buscador y la lista de instituciones.

### Eliminado: los cuatro SVG de play y pausa

`ico_play_normal`, `ico_play_hover`, `ico_pause_normal` e `ico_pause_hover` traían el naranja quemado en el `fill`, lo que impedía colorearlos por estado y obligaba a duplicar cada icono para el hover. Se reemplazaron por `play` y `pause` en `Icon.jsx`, que usan `currentColor` y heredan el tono del botón.

Por la misma razón se agregó `chevron`: el `downArrow` del botón de dirección se sirve como `<img>` desde `ico_down_arrow.svg`, que trae `stroke="#465055"` fijo, así que ninguna clase de color lo alcanzaba y la flecha se veía gris en todos los estados. `downArrow` sigue en uso para el botón de regreso y las flechas del carrusel, que sí quieren ese gris.

## [1.92.1] - 2026-07-27

### Cambiado: el título del catálogo se apoya en una píldora de vidrio

El encabezado del buscador (`CatalogoSearchModal`) dejaba el título flotando directo sobre el mapa, sin superficie propia, así que sobre capas saturadas costaba leerlo. Ahora el título va dentro de una píldora con desenfoque de fondo y sin sombra, en los dos estados del encabezado: nombre de institución activa y «Catálogo». La constante `TITLE_PILL` vive en `helpers/catalogoStyles.js`, junto a `PANEL_SHADOW` y los `Z_*`, para no repartir la decisión en clases sueltas.

## [1.92.0] - 2026-07-24

### Agregado: descarga por streaming a disco para no saturar la memoria

Hasta ahora toda descarga se acumulaba completa en memoria (`fetch` → `new Blob`), lo que en capas pesadas (GeoPackage/Shapefile con geometría) podía tronar el navegador, sobre todo en equipos con poca RAM. Ahora, donde el navegador lo soporta (Chromium: Chrome/Edge de escritorio), la descarga usa la **File System Access API**: el usuario elige dónde guardar y los bytes se escriben a disco por chunks conforme llegan, sin acumularse en RAM. El progreso y el cronómetro siguen funcionando en este modo porque seguimos contando los bytes leídos.

- **`services/downloadUrls.js`**: `supportsFileSystemAccess()`.
- **`services/downloadService.js`**: se separó "abrir respuesta validada" (`resolveLayerResponse`, con el fallback backend→WFS antes de leer cuerpo) de "consumir" (`consumeResponse`, que escribe a un `writable` de disco **o** arma el Blob). `runLayerDownload` intenta el picker y hace streaming; si el usuario cancela el diálogo reporta cancelado, y si el picker falla por permisos/gesto (o el navegador no soporta la API — Firefox, Safari, móvil) cae al flujo Blob de siempre. Un solo `runLayerDownload` sirve al botón directo, al menú con filtros y al catálogo.
- Las descargas con metadatos (ZIP) siguen armándose en memoria con `jszip`, que necesita los bytes completos.
- **`services/downloadMetadata.js`** (nuevo): los helpers de metadatos (`getMetadataFiles`, `addMetadataToZip`, `getAvailableMetadata`) salieron de `downloadService.js` para no rebasar el límite de líneas del lint.

### Agregado: descarga de rasters en el catálogo (GeoTIFF)

El panel de leyendas del catálogo ofrecía siempre GPKG/SHP/CSV, aunque la capa fuera raster. Ahora, si la capa es raster, muestra **GeoTIFF** (`RASTER_FORMATS`) y la descarga va por WCS con `SUBSET=time` de la fecha activa, reutilizando el mismo `fetchLayerBlob`/`runLayerDownload` del visor. Para vectoriales no cambia nada. `CatalogoLegends` se salta la comprobación de geometría (`capaHasGeometry`) cuando es raster.

### Corregido: test intermitente de `useLayerSymbolIcon`

`symbolUrlCache` es un `Map` a nivel de módulo que persistía entre tests y provocaba fallos fantasma según el orden de ejecución. Se expuso `clearSymbolUrlCache()` y el test lo limpia en `beforeEach`.

## [1.91.0] - 2026-07-24

### Corregido: la descarga de CSV cacheados rompía por CSP y las URLs del Acervo estaban mal armadas

El backend, al servir un CSV cacheado (sin filtro de fecha), respondía **307 a una URL prefirmada del Acervo**. Eso no podía funcionar por dos motivos: (1) el gateway sirve `/acervo/` **reescribiendo** la ruta (`/acervo/(.*)` → `/$1`), así que la firma SigV4 —que cubre host y ruta— nunca valida contra lo que ve SeaweedFS; y (2) la URL prefirmada apuntaba a `https://localhost/mapalab/mapalab/downloads/...` (host `localhost` y doble prefijo `/mapalab/mapalab/`), que el `connect-src` del CSP bloqueaba. El resultado en el visor era un error de CSP en consola y una descarga que caía al fallback.

- **`backend/app/services/acervo_client.py`**: nuevo cliente **interno** (`ACERVO_ENDPOINT`, host de la red) y `open_object`/`iter_object_body` para leer el objeto por streaming. `presign_get` se conserva pero ya no se usa en descargas.
- **`backend/app/routers/download.py`**: en vez de redirigir a la URL prefirmada, el backend hace **streaming del dump** por el endpoint interno (mismo origen). Envía `Content-Disposition: filename="{capa}.csv"` y, como el dump está gzipeado, `Content-Encoding: gzip` para que el navegador lo descomprima y guarde un `.csv`. Sin URL prefirmada no hay problema de CSP, de firma ni de host público. Verificado contra el Acervo real: ruta cacheada (gzip → CSV) y ruta con filtro de fecha (streaming en vivo) funcionan same-origin.

### Corregido: enlaces de metadata (TXT/XLSX) con host y prefijo equivocados

`_metadato_with_acervo` arma `{ACERVO_PUBLIC_URL}/mapalab/metadata/...`, y con `ACERVO_PUBLIC_URL=https://localhost/mapalab` salía `https://localhost/mapalab/mapalab/metadata/...` (mismo doble prefijo y host `localhost`). Se alineó la configuración: `ACERVO_PUBLIC_URL` debe ser `{host público}/acervo` (el gateway reescribe `/acervo/` hacia SeaweedFS). Actualizados `.env.production`, `.env.staging` y `.env.example`; `VITE_ACERVO_ORIGIN` apunta al mismo origen del sitio.

### Corregido: el logo del QR del catálogo dejaba un 404 en consola

Se leía del Acervo por `fetch` (`/acervo/iieg/logos/mapalab_short.svg`), que en entornos sin ese objeto devolvía 404. El mismo logo ya está en el bundle (`@logos/mapalab_short.svg`, mismo origen), así que se usa directo: sin fetch, sin 404, sin taint del canvas.

### Cambiado: el CSV del catálogo respeta la fecha activa

`downloadCatalogoCapa` recibe el `cqlFilter` activo y lo traduce a `date_from`/`date_to` (CSV) o `CQL_FILTER` (GPKG/SHP). Con el streaming del backend arreglado, el catálogo vuelve a aprovechar el dump cacheado same-origin cuando no hay filtro.

## [1.90.0] - 2026-07-24

### Corregido: al recargar la página se perdía la capa seleccionada

Tras un refresh, el visor restauraba las capas activas pero volvía a seleccionar la primera de la lista, no la que tenías. La sesión sí guardaba la selección; el problema era un orden de efectos: `useInitializeFromUrl`/`useShareDeserializer` (en `Maps`, hijo) restauran la selección, pero el efecto de auto-selección de `useSymbology` (en `MapsProvider`, padre) corre después con `activeLayerIds` todavía vacío, hacía `setSelected(null)` y luego auto-elegía la primera capa, pisando lo restaurado.

- **`hooks/useSymbology.js`**: nuevo `restoreSelectedById(id)` que deja el id en un `useRef`; el efecto de auto-selección lo consume antes de elegir la primera capa y respeta la restauración si sigue activa. Robusto al timing de efectos, no depende de que los setters batcheen en un orden concreto.
- Los tres puntos de restauración (`useInitializeFromUrl` para `?layers=*<id>`, `useShareDeserializer` para `?s=` y para la sesión de `sessionStorage`) llaman `restoreSelectedById` además de `setSelectedLayerForSymbology`.

### Cambiado: una sola petición de descarga para todos los puntos

La descarga del catálogo (`downloadCatalogoCapa`) duplicaba la lógica de elegir backend vs WFS y de armar la URL. Ahora construye un `config` equivalente y pasa por el mismo `fetchLayerBlob` que el botón directo, el menú con filtros y el panel de capas activas. Un cambio en la petición se refleja en todos los puntos sin depurar de uno en uno.

### Corregido: el CSV vía WFS todavía traía la geometría

El fix de 1.87.0 quitó la geometría del CSV del backend y del dump nocturno, pero cuando la descarga cae a WFS (capa con filtro fijo, o el backend falla) el CSV lo genera GeoServer, que incluía las columnas de geometría como WKT gigante — el mismo problema de celdas que rebasan el límite de Excel, ahora por otra vía. Afectaba al botón "Descargar capa" en esas capas y al catálogo.

- **`services/downloadUrls.js`**: nuevo `fetchNonGeometryColumns`, que hace un `DescribeFeatureType` cacheado y devuelve las columnas no-geométricas; `buildWFSUrl` acepta `propertyName`. En CSV vía WFS se piden sólo esas columnas, así el WKT nunca entra al archivo. GeoServer marca únicamente la geometría default como `gml:*`; una segunda columna de geometría aparece como `xsd:MultiPolygon`, así que la detección también compara `localType` contra los tipos geométricos OGC. Verificado en vivo: `desarrollo_social:pobreza` por WFS pasó de incluir `geom_iieg,geom_inegi` a excluir ambas.

### Agregado: cronómetro en el progreso de descarga

`<LayerDownloadProgress>` ahora muestra el tiempo transcurrido (`m:ss`) además de los bytes. Sirve de feedback cuando la respuesta no trae `Content-Length` y no se puede calcular porcentaje.

## [1.89.0] - 2026-07-24

### Corregido: la barra temporal del catálogo tronaba al abrir el selector

`SimpleDateSelector` hace `useContext(MapsContext)` sin tolerar `null`, y la `CatalogoTimeBar` se renderizaba **fuera** del provider stub del catálogo, así que al desplegar el selector la vista se caía con `Cannot destructure property 'getSpecificFilter' of useContext(...) as it is null`. La barra se movió dentro del `MapsContext.Provider`, cuyo stub ya expone `getSpecificFilter`, `getLoopState` y `stopLoop`.

### Agregado: la descarga y lo compartido del catálogo respetan la fecha activa

Antes, si veías junio 2026 en el mapa y descargabas, te llevabas el histórico completo; y el enlace/QR compartido abría la capa sin fecha. Ahora la fecha viaja con las tres acciones.

- **Descarga** (`downloadCatalogoCapa`): recibe el `cqlFilter` activo. El CSV lo traduce a `date_from`/`date_to` con `cqlToDateRange`; GPKG y SHP lo mandan como `CQL_FILTER` a WFS. Sin filtro se comporta igual que antes.
- **URL compartida**: la fecha se serializa como `?fecha=2026-6` (o `2026` para un año, o varios meses separados por coma). Al abrir el enlace, `CatalogoPage` lee el parámetro y lo aplica como filtro inicial; `useSearchParams` lo mantiene sincronizado con `replace` para no ensuciar el historial. Helpers `cqlToFechaParam`/`fechaParamToCql` en `catalogoRoutes.js`.
- El estado del tiempo se elevó a un `CatalogoTiempoProvider` (contexto ligero) para que el mapa, el panel de leyendas y la página compartan el mismo filtro sin prop-drilling.

### Agregado: periodicidad de rasters desde la dimensión TIME del GetCapabilities

Las capas raster no están en `public.layer_periodicity` (esa tabla se calcula sobre PostGIS). Ahora su periodicidad se lee de la **dimensión TIME** del `GetCapabilities` que el catálogo ya pedía para el bbox — sin peticiones nuevas.

- `wmsCapabilitiesService`: el índice por workspace guarda `{ extent, time }`; nuevo `getLayerTimePeriodicity` y `parseTimeDimensionToPeriodicity`, que agrupan los valores TIME por año y mes.
- `useCatalogoTiempo` distingue raster de vector: el raster aplica el valor como parámetro **TIME** del WMS (no `CQL_FILTER`), su default es la fecha más reciente disponible, y alimenta `PeriodicitySection` como `rasterPeriodicity`. El vector sigue con CQL y default al año más reciente sólo en polígonos.
- La sincronización con la URL (parámetro `fecha`) aplica al filtro vectorial (CQL); el TIME de raster no se serializa por ahora.

### Corregido: la descarga CSV del catálogo y el logo del QR sin ruido en consola

- **CSV del catálogo**: iba primero al backend `/download`, que sin filtro de fecha responde **307 a una URL prefirmada del Acervo**; `fetch` la seguía y `connect-src` la bloqueaba (error de CSP en consola), cayendo al WFS. El catálogo ahora pide el CSV **directo por WFS** (`forceWfsCsv`), que es del mismo origen (`/geoserver/`), excluye la geometría con `fetchNonGeometryColumns` y respeta el filtro de fecha. Sin intento al backend no hay error de CSP ni dependencia del dump cacheado. El visor conserva su ruta con dump + progreso.
- **Logo del QR**: se leía del Acervo por fetch (`/acervo/iieg/logos/mapalab_short.svg`), que en entornos sin ese objeto devolvía 404 en consola. Como el mismo logo ya está en el bundle (`@logos/mapalab_short.svg`, mismo origen), se usa directo: sin fetch, sin 404, sin taint del canvas.

### Agregado: la leyenda sigue la fecha activa (catálogo y visor)

Nuevo helper compartido `pages/maps/helpers/legendUrl.js::buildLegendGraphicUrl`, que arma la petición `GetLegendGraphic` resolviendo el `STYLE` por fecha (`timeStylePattern`) y, cuando hay filtro activo, pasando el `CQL_FILTER` con `LEGEND_OPTIONS=...;hideEmptyRules:true` para que **la leyenda oculte las clases sin datos** en la fecha filtrada.

- **Visor**: `useWMSLegend.getLegendUrl` se refactorizó sobre el helper. Para capas con `timeStylePattern` resuelve el estilo por fecha (comportamiento previo); para capas vectoriales con filtro de fecha ahora pasa el CQL + `hideEmptyRules`, así la leyenda inline del panel de capas activas refleja lo que está en el mapa. Sin filtro de fecha la petición es byte-idéntica a la anterior (verificado por los tests existentes).
- **Catálogo**: el panel de leyendas usa el mismo helper y re-renderiza al cambiar la fecha. En raster no pasa CQL (usaría TIME, no CQL).

El costo de `hideEmptyRules` (GeoServer evalúa reglas contra los datos filtrados) sólo se paga cuando hay un filtro de fecha activo; el resto de las leyendas no cambia.

## [1.88.0] - 2026-07-24

### Agregado: las pestañas del panel de símbolos aceptan íconos de imagen y SVG

El ícono de cada categoría del catálogo de símbolos solo podía ser un emoji. Desde mariachi 1.82.0 también puede ser una imagen o un SVG del Acervo, y en ese caso el catálogo público (`GET /api/mapalab/symbols/catalog`) manda `iconUrl` además de `icon`.

- **`EmojiPanel.jsx`**: si la categoría trae `iconUrl` la pestaña renderiza un `<img>`; si no, se mantiene el comportamiento previo (emoji, o la inicial del nombre como respaldo). Sin este cambio la URL se habría pintado como texto crudo.

## [1.87.0] - 2026-07-24

### Corregido: los CSV de descarga traían la geometría y se abrían desalineados en Excel

Los CSV de capa incluían las columnas de geometría, y con ellas celdas de cientos de miles de caracteres. Excel admite 32,767 caracteres por celda: al abrir el archivo truncaba esa celda y **el resto de la fila se recorría**, de modo que la columna `fecha` mostraba cualquier otra cosa. En `desarrollo_social:pobreza` una sola fila medía 60,102 caracteres y la celda mayor 345,940; 267 de sus 375 filas rebasaban el límite.

La exclusión de geometría existía en el backend, pero no se aplicaba: `_fetch_export_columns` consultaba `information_schema.columns`, que **no lista vistas materializadas**, así que devolvía una lista vacía y el `SELECT` caía al comodín `*`. De las 87 capas descargables, 72 son vistas materializadas. El dump nocturno de `dataengine` (`run_dump_layers_csv.py`), que es el que alimenta el cache de Acervo servido por 307, hacía `SELECT *` de forma explícita.

- **`backend/app/repositories/download_repository.py`**: `_fetch_export_columns` ahora resuelve las columnas con `pg_attribute` + `pg_type`, que sí cubre `relkind` `m` (materializada), `v`, `r`, `p` y `f`. `_build_select` lanza si la lista viene vacía en vez de degradar a `SELECT *` — un fallback silencioso era justo lo que reintroducía la geometría.
- **`dataengine/jobs/run_dump_layers_csv.py`**: el `COPY` lista las columnas exportables con la misma consulta.

Efecto medido en `desarrollo_social:pobreza`: **53.6 MB → 20.5 KB** (99.96 % menos), celda mayor de 345,940 → 29 caracteres. Los 87 dumps regenerados suman 29 MB. Las descargas de GeoPackage y Shapefile conservan la geometría, que es su propósito.

### Corregido: "Descargar por fecha activa" descargaba todo

El servicio pasaba `getFilter(layerId)` como `date_from`/`date_to`, pero eso devuelve la expresión CQL combinada (`(fecha >= '2024-01-01' AND fecha < '2025-01-01')`), no una fecha. El backend la rechazaba con 400 por no cumplir `YYYY-MM-DD`, el `catch` caía a WFS **sin filtro alguno** y el usuario recibía la capa completa sin aviso. En GPKG y SHP el filtro se ignoraba desde el principio.

- **`helpers/dateFilterHelpers.js`**: nuevo `cqlToDateRange`, que traduce el CQL a `{dateFrom, dateTo}` reutilizando `parseCQLToSelections`. Resuelve el último día real del mes y cubre el rango completo cuando hay varias selecciones.
- **`services/downloadService.js`**: usa `getSpecificFilter(layerId, 'date')` y traduce con `cqlToDateRange`. Si la expresión no es traducible a rango, va a WFS pasándola como `CQL_FILTER` en lugar de descargar todo; lo mismo aplica ahora a GPKG y SHP. `buildWFSUrl` combina con `AND` el filtro propio de la capa y el de fecha, en vez de que uno pisara al otro.
- **`backend/app/routers/download.py`**: si la capa no tiene columna `fecha` (12 de 87, todas atemporales: límites municipales, aeropuertos, regiones), responde 400 con mensaje explícito antes de abrir el stream.

### Agregado: progreso de descarga en el panel de capas activas

El botón de descarga del item seleccionado sólo mostraba un spinner. Ahora despliega debajo una fila colapsable (`<LayerDownloadProgress>`) que empuja la leyenda hacia abajo, con bytes descargados, barra de avance y botón de cancelar. Cuando la respuesta trae `Content-Length` sin `Content-Encoding` —el caso de los dumps servidos desde Acervo— se muestra **porcentaje y tamaño total**; si no, sólo los bytes acumulados, sin fingir un progreso que no se conoce.

### Cambiado

- **`services/downloadUrls.js`** (nuevo): los constructores de URL (WFS, WCS, backend CSV), los formatos y `RASTER_WORKSPACES` salen de `downloadService.js`, que había rebasado el límite de 300 líneas del lint.

## [1.86.0] - 2026-07-24

### Agregado: compartir capas del catálogo con enlace o QR

Nuevo botón "Compartir" junto a "Descargar" en el panel de leyendas, con dos opciones desplegables al estilo de los formatos de descarga:

- **Enlace**: copia la URL de la capa al portapapeles con feedback verde (fallback a `window.prompt` si el navegador bloquea el clipboard).
- **QR**: genera el código con el **logo corto de Mapalab al centro** y permite descargarlo en PNG a 800 px para materiales impresos. Usa `qr-code-styling` cargado con `import()` dinámico —no entra al arranque de la sección— y nivel de corrección `H`, que tolera el ~30 % de módulos ocluidos por el logo. El logo se pide al Acervo por **ruta relativa** (`/acervo/iieg/logos/mapalab_short.svg`) y se convierte a data URL para que el canvas no quede *tainted*: una URL absoluta violaba el `connect-src` del CSP y quedaba bloqueada. Donde esa ruta no resuelve (entornos sin el Acervo montado en el mismo origen) cae al SVG del bundle, que es el mismo logo.

El mismo componente (`CatalogoShare`) se reutiliza para compartir una institución completa, ahí como popover anclado al botón del header para no sumar otra sección apilada sobre el buscador.

Las tres capas del buscador se ordenan en z de forma explícita (`helpers/catalogoStyles.js`): input abajo, lista de instituciones en medio y lista de capas arriba, de modo que la sombra de una no se proyecte sobre la de enfrente. La sombra es común a las tres, más marcada y en los cuatro lados.

### Agregado: filtro y animación temporal en el catálogo

Las capas con dimensión temporal traen una barra centrada en la parte superior del visor. Colapsada es una pill que dice **qué fecha se está viendo** ("Junio de 2026", "2 años" o "Todas las fechas"); al tocarla se despliega el selector de años y meses con los controles de animación (reproducir, velocidad y dirección).

**Comportamiento por defecto según la geometría de la capa**: polígonos y raster abren filtrados al **año más reciente** —mostrarlos completos superpone años y no se entiende nada—; puntos y líneas abren **sin filtro**, con todas las fechas a la vista. La geometría se detecta con el `DescribeFeatureType` que el visor ya cachea, y el workspace decide si es raster.

Casi todo es código del visor sin modificar: `PeriodicitySection`, `SimpleDateSelector`, los botones de loop, `useDateLoop` y los helpers de fechas. Lo nuevo son dos hooks de cableado (`useCatalogoTiempo`, `useCatalogoLoop`) que resuelven la periodicidad pidiéndola directo con workspace y capa, guardan el filtro de la única capa y lo aplican al WMS. La vista se envuelve en `LayerLoadingProvider`, que es lo único que el motor de animación exige.

Se dejó fuera el modo avanzado (el árbol año → mes → día que en el visor se abre con Ctrl+clic): son 273 KB de interfaz para un modo oculto que nadie descubriría en una vista de exploración.

Detalle de la animación: mientras el ciclo corre se **suprime el indicador de carga** —si no, parpadearía en cada cuadro— y la pill de la fecha pulsa para señalar que está avanzando sola.

### Corregido: el indicador de carga del catálogo no aparecía al abrir una capa

El spinner Lottie sólo se mostraba mientras se resolvía el slug contra el backend. Desde que la capa se resuelve contra la lista ya cargada esa espera desapareció, así que en la práctica nunca se veía — justo cuando más se necesita, que es mientras GeoServer devuelve la imagen WMS. Ahora `CatalogoMapView` escucha `imageloadstart` / `imageloadend` / `imageloaderror` del `ImageWMS` y muestra el spinner **centrado en el viewport** durante la carga real de la capa.

### Agregado: instituciones en el catálogo

Las capas del catálogo ahora se pueden agrupar por la dependencia que las produce, y cada institución tiene su propia URL compartible.

- **Pills** entre la lista y el buscador, con **Todas** activa por defecto (morada, para distinguirla del resto, que van en naranja institucional). Al elegir una institución la lista se filtra y el header pasa de "Catálogo" al nombre de la institución seguido de la palabra `catálogo` en chico y gris, alineada a su línea base. Junto a la X aparece el botón para compartir ese catálogo (enlace o QR), con el mismo ícono que usa el visor para compartir.
- **Lista desplegable de instituciones**: un botón fijo a la derecha de la fila de pills (que scrollea horizontalmente cuando no caben) abre, debajo de ellas, una lista vertical con **logos**, nombre y número de capas de cada institución. Es la vista pensada para cuando el catálogo crezca a decenas de dependencias, donde las pills dejan de ser cómodas. El logo sale de `logo_url`; sin logo se muestra la inicial. La entrada "Todas" usa el logo corto de Mapalab.
- **El buscador también encuentra por institución**: escribir el nombre o el slug de una dependencia lista sus capas sin tener que cambiar de filtro.
- **Rutas**: `/catalogo/<institucion>` para el modo institución y `/catalogo/<institucion>/<capa>` para una capa dentro de él; `/catalogo/<capa>` sigue funcionando igual que antes. Capas e instituciones comparten namespace, así que `resolveCatalogoRoute` decide en cliente contra las listas ya cargadas (sin peticiones extra) y `capas_catalogo_service.py` de mariachi valida el slug contra **ambas** tablas al crear o editar, incluida la generación automática del alta masiva. Si un slug legacy colisionara, gana la capa para no romper enlaces ya compartidos.
- **Backend**: `GET /catalogo/instituciones` (solo instituciones con al menos una capa habilitada, ordenadas por `orden, nombre`) y `institucion: {slug, nombre}` en cada capa de `/catalogo/capas`. El cache en memoria pasa a ser por colección, con el mismo TTL de 5 minutos.
- **Invalidación de cache**: nuevo `POST /catalogo/invalidate-cache` con `X-Internal-Token`, que mariachi invoca tras cada alta, edición, borrado o reordenamiento del catálogo. Antes, un cambio en el admin tardaba **hasta 5 minutos** en verse en el visor (el TTL del cache en memoria); una institución recién creada simplemente no aparecía. Mismo patrón que `/layers/refresh-cache` del árbol de capas.
- **Admin (mariachi)**: la subpágina Catálogo pasa a **pestañas** (Capas | Instituciones) con el conteo de cada una. La de instituciones permite alta —con slug autocompletado conforme se escribe el nombre, hasta que se edite a mano—, edición inline de nombre y slug, borrado (las capas quedan sin institución, no se borran) y reorden por drag & drop que define el orden de las pills. La tabla de capas suma columna de institución con filtro y edición inline, el formulario de alta un selector, el importador de workspace la asigna a todo el lote, y la barra de selección múltiple permite asignarla en lote.
- **Telemetría**: `catalogo_share` (`scope`, `slug`, `type`) y `catalogo_institucion_select` (`slug`, `capas`).

Requiere la migración `0028_catalogo_instituciones` de dataengine (tabla nueva + columna `institucion_id`), aplicada **antes** de desplegar los backends.

## [1.85.4] - 2026-07-23

### Corregido: la vista pública del catálogo respeta el orden manual de las capas

La query de `/catalogo/capas` (`CatalogoRepository.get_enabled_capas`) ordenaba siempre por `nombre` (alfabético), ignorando la columna `orden` de `mapalab.catalogo_capas`. Ahora ordena por `orden, nombre`, de modo que el reordenamiento por drag & drop hecho desde el admin de mariachi se refleja también en la vista pública. Requiere la migración `0027_catalogo_capas_orden` de dataengine (columna `orden`).

## [1.85.0] - 2026-07-23

### Cambiado: el relieve se sirve desde GeoWebCache (WMTS)

`createReliefSource` pasa de `TileWMS` a `ol/source/WMTS` contra `/geoserver/gwc/service/wmts`, gridset `EPSG:900913` (31 niveles, tiles de 256 px), compatible con la vista en `EPSG:3857`. Ambas capas (`hillshade_iieg_cog`, `hillshade_inegi_cog`) ya estaban registradas en GWC. Aprovecha el metatiling 4×4 de GWC: un render produce 16 tiles.

**Cada capa lleva su propio `extent`**, tomado del `WGS84BoundingBox` que publica GWC, y por eso el tileGrid se construye por capa en vez de compartirse. No es opcional: WMTS responde **400 `TileOutOfRange`** fuera del área de la capa, y sin `extent` el tileGrid cubre el mundo entero y OpenLayers pide tiles inexistentes. El WMS no tenía ese problema porque devuelve PNG transparente.

Verificado en tres niveles: los rangos de tiles de OpenLayers coinciden **exactamente** con los `TileMatrixSetLimits` de GWC en los 21 niveles de ambas capas; 1684 tiles reales del rango (z=6–11) responden 200; y `basemaps.test.js` fija el rango esperado a z=8 para que un desalineado del grid falle en CI.

### Corregido: el indicador de carga parpadeaba con capas por tiles

Con `ImageWMS` el spinner recibía un `start` y un `end` por render; con `TileWMS` recibía uno por **cada** tile (~70 por pantalla), así que hacía toggle decenas de veces hasta terminar.

`useWMSLayerFactory` ahora cuenta tiles en vuelo: emite `start` con el primero y `end` solo cuando no quedan pendientes **y** pasan 250 ms sin actividad nueva. El margen importa porque OpenLayers carga en tandas y el contador toca 0 entre ellas — sin él vuelve a parpadear. Los tiles con error también descuentan, así que una tanda fallida no deja el indicador colgado. Cubierto por `useWMSLayerFactory.test.js` (3 casos).

### Documentación

Nuevo `docs/render_layers.md`: cadena completa de render (los tres cachés en serie y cómo distinguirlos), estado y motivo de configuración de cada capa, por qué la reproyección **no** es el cuello de botella (medido) y las trampas conocidas — rate limit de control-flow que solo se reproduce con cookie, el include del gateway que vive dentro de la imagen, y el etag del árbol de capas.

## [1.84.3] - 2026-07-23

### Agregado

- **Telemetría de la sección Catálogo**: 10 eventos nuevos que instrumentan el embudo completo — `catalogo_open` (`from`, `slug`), `catalogo_search` (`query`, `results`), `catalogo_layer_select` (`slug`, `from_search`), `catalogo_download` (`slug`, `format`), `catalogo_feature_click` (`slug`, `count`), `catalogo_tools_toggle`, `catalogo_layer_close`, `catalogo_info_open`, `catalogo_back` y `catalogo_slug_not_found` (detecta enlaces compartidos rotos). Se emiten con `trackEvent` y no con `withMapInteraction`, para no inflar el agregado `map_interaction` del visor. Inventario en `docs/analytics.md`.

### Corregido

- **El Catálogo se contabilizaba como `visor` en la telemetría propia**: `detectSource()` solo distinguía `embed` de `visor`, así que las sesiones y eventos de `/catalogo` ensuciaban las métricas del visor y solo podían aislarse filtrando por `pathname`. Ahora reporta `source: 'catalogo'`.

## [1.84.2] - 2026-07-23

### Cambiado

- **Lista de capas del Catálogo con `ScrollContainer`**: reutiliza el componente compartido en lugar de un `overflow-y-auto` propio — oculta la barra de scroll, agrega degradado arriba/abajo (`overlayFade` en blanco, al ras del borde) y flechas que aparecen solo cuando hay overflow, clickeables a partir de 12 capas (mismo criterio que `EmojiPanel`).

### Corregido

- La sombra superior del input de búsqueda se proyectaba sobre la lista de capas; la lista ahora lleva `relative z-10` para quedar por encima en el orden de apilado.

## [1.84.1] - 2026-07-23

### Cambiado

- **Herramientas del Catálogo tras un botón**: las herramientas de medición/anotación pasan de permanentes a un botón circular (regla ↔ X rosa, sin confirmación) que las despliega; el botón se reubica al pie de la columna cuando está activo. Al cerrarlas se **borran los trazos** (`clearDrawings`). Botones a `size-10`, uniformes con el toggle.
- **Persistencia de anotaciones aislada**: el catálogo usa la llave `mapalab.catalogo.annotations`, ya no comparte trazos con el visor. `useMapDrawing` acepta `{ storageKey }` y `useAnnotationsPersistence` un `storageKey` (default = la llave del visor, sin cambios ahí).

### Corregido

- **Leyendas del Catálogo homologadas** con el panel de capas activas: mismos parámetros de `GetLegendGraphic` (ícono fijo 20×20, `dpi:100`, tipografía Garet, **sin `transparent`**) y mismo contenedor, lo que elimina el espacio sobrante que descuadraba el centrado vertical. Título del panel a 15px.
- `alt` duplicado ("Leyenda de Leyenda de X") en la leyenda inline del visor.

### Refactor

- `LegendImage` (carga con Logo, fade-in y manejo de error) extraído a `@components/LegendImage` y reutilizado por el visor y el catálogo.
- `ToolSelector` (`buttonClass`/`iconClass`) y `HistoryButton` (`size`/`iconSize`) aceptan tamaño configurable; los defaults conservan el tamaño del visor.

## [1.84.0] - 2026-07-22

### Agregado: información por clic y herramientas en el Catálogo

#### Frontend

- **Información por clic (GetFeatureInfo)**: al hacer clic sobre la capa activa se consulta `GetFeatureInfo` de GeoServer y se muestra una tarjeta (`CatalogoInfoBox`) que reutiliza `renderCard` del visor. Usa la configuración de tarjeta heredada de `mapalab.layers` (`littleCard`).
- **Herramientas de dibujo y medición** (`CatalogoTools`): reutiliza `MeasurementTools`, `useMapDrawing` y `useMapEditing` del visor dentro de la vista de catálogo.
- **Rediseño del buscador** (`CatalogoSearchModal`): a la altura de los controles del mapa; header "Catálogo" flotante con X (solo abierto) que se desplaza como cabecera de lista + input; lista con fuente 16 (Garet Medium), tope de 80vh con scroll; en mobile se colapsa a una píldora cuando no está activo. Sombras direccionales (lista/input hacia arriba en desktop, más grandes en mobile).
- **Botón de información**: reubicado a la barra de atribuciones (a la derecha de "Contribuciones", ícono redondo naranja) mediante el nuevo prop `extraRight` de `MapAttribution`; ya no vive junto a "Regresar a Mapalab".
- **Panel de leyendas**: título a 18, imagen con alto máximo y scroll, botón de eliminar capa sin fondo.

#### Backend

- `GET /catalogo/capas` y `/catalogo/capas/{slug}` ahora incluyen `littleCard` (config de `infobox_config` heredada de `mapalab.layers` vía `LEFT JOIN LATERAL`), para renderizar la tarjeta de información por clic.

## [1.83.1] - 2026-07-22

### Agregado

- **Pista del botón de información del Catálogo**: al entrar por primera vez, el tooltip "¿Qué es esta vista?" se despliega solo y permanece hasta que el usuario interactúa (hover o click). El "visto" se persiste en `localStorage` (reusa `useFeatureSeen`); en visitas posteriores el tooltip solo aparece con hover.

## [1.83.0] - 2026-07-22

### Agregado: sección Catálogo (`/catalogo`)

Vista pública simplificada para explorar y descargar capas sueltas, gestionadas desde mariachi. Requiere la migración `0025_catalogo_capas` en DataEngine (ver RUNBOOK → "Catálogo de capas").

#### Frontend

- Nueva ruta `/catalogo` y `/catalogo/:slug` (fuera de `MapsProvider`): mapa simplificado (Voyager + relieve), buscador desplegable, panel de leyendas con descarga colapsable (GPKG/SHP/CSV) y encuadre al **bbox real de la capa** (reusa `getLayerExtent3857`). Recicla `MapControls`, `ScaleLineControl` y `MapAttribution` (nuevo prop `hideActions`) del visor vía contextos stub.
- Dos botones de entrada al catálogo desde el visor (junto a Contribuciones y en el sider), gateados a `VITE_APP_ENV ∈ {dev,beta}` (ocultos en producción).

#### Backend

- Endpoints públicos `GET /catalogo/capas` y `/catalogo/capas/{slug}` (repositorio SQL + cache TTL 5 min; resuelve `geoserverWorkspace`).
- **CSV sin columnas geométricas**: `stream_csv` excluye columnas `geometry`/`geography`; aplica también a las descargas CSV de **capas normales** del visor (para geometría, usar GPKG).

## [1.82.4] - 2026-07-22

### Corregido

- **Caida de `/layers/tree` e `/layers/initial-order` ante lentitud de la BD**: `get_cached_state()` consultaba PostgreSQL en cada request (un `SELECT etag`) aun con el arbol ya en memoria, por lo que un episodio de lentitud o bloqueo de la BD colgaba la carga del mapa (timeouts `504`) pese a tener workers y cache. Ahora `_MEM_CACHE` sirve el arbol **sin tocar la BD** mientras esta fresco (TTL `_MEM_TTL_SECONDS` = 30s), revalida solo el `etag` al expirar, y ante un fallo de la BD sirve el ultimo arbol bueno (`stale-while-error`) en lugar de propagar el error.

## [1.82.3] - 2026-07-16

### Refactor: eliminar defaults inline del compose + `.env.example`

Sin cambios de runtime. Requiere que el `.env` de cada host tenga todas las variables (fail-fast).

#### Agregado

- **`.env.example`**: nuevo archivo con las ~54 variables del compose (placeholders `<>`), que antes no existía.

#### Cambiado

- **`docker-compose.yml`**: eliminados todos los defaults inline `${VAR:-valor}`. Config obligatoria vía `${VAR:?}` (incluye `ENVIRONMENT`, `DEBUG`, `CORS_ORIGINS`, puertos, workers); opcionales de valor vacío como `${VAR}`. **Importante:** cada host debe poblar su `.env` desde `.env.example` (verificar `ENVIRONMENT=production` y `BACKEND_TARGET=production` en S2) antes de desplegar.

## [1.82.2] - 2026-07-16

### Seguridad: endurecer configuración de producción del backend

#### Cambiado

- **`app/config.py`**: `DEBUG` por defecto pasa de `True` a `False`. Nuevo validador que rechaza `CORS_ORIGINS` con `*` cuando `ENVIRONMENT=production` (mismo patrón que mariachi), evitando `*` combinado con `allow_credentials=True`.
- **`app/server.py`**: `openapi_url` se cierra en producción (antes solo `docs_url`/`redoc_url`), dejando de exponer el esquema en `/openapi.json`.
- **`backend/Dockerfile`**: el stage de producción corre como usuario no-root (`appuser`). La imagen no monta código en prod y el lock del scheduler vive en `/tmp`, así que no requiere coordinar UID.

## [1.82.1] - 2026-07-09

### Corregido

- **Pantalla blanca intermitente en carga inicial**: cuando un chunk JS (vendor o lazy) falla al cargarse — por 404 tras un deploy, por latencia de red o por `open_file_cache` frio de nginx — la app quedaba en blanco porque el module loader de ES abortaba toda la ejecucion antes de que React montara. Ahora un script de recuperacion escucha `vite:preloadError`, errores de carga de `<script>`/`<link>` en `/assets/` y `unhandledrejection` de `ChunkLoadError`, y recarga automaticamente la pagina con guarda anti-loop via `sessionStorage`.

- **`VITE_ACERVO_ORIGIN` ausente en las imagenes Docker de build**: el placeholder `__ACERVO_ORIGIN__` en el CSP de `index.html` siempre se reemplazaba por string vacio porque la variable no llegaba a `frontend/Dockerfile` ni a `nginx/Dockerfile`. Agregado `ARG` + `ENV` y mapeado desde `docker-compose.yml`.

### Agregado

- **Telemetria de errores de chunk**: endpoint `POST /api/log/client-error` en el backend que recibe beacons del script de recuperacion (tipo `chunk_load_error`, URL fallida, user-agent, pagina). Incrementa el contador Prometheus `mapalab_client_chunk_errors_total` y loggea en `Logger.warning`.

---

## [1.82.0] - 2026-07-08

### MCP enfocado en crear mapas: 15 → 6 tools

El MCP se recortó y reorganizó alrededor de su único objetivo (crear mapas de MapaLab con un modelo chico). Catálogo final de **6 tools**: `search_layers`, `describe_layer`, `municipios`, `query_wfs`, `create_map`, `create_swipe`.

#### Corregido

- **Numeralia de capa siempre vacía en el MCP** (`get_layer_stats`): consultaba `values->'stats'` con columnas `geoserver_workspace`/`geoserver_layer` que no existen en `mapalab.layer_stats`, así que devolvía `[]` siempre. Ahora lee `mapalab.layer_stats.values` como el **array plano** `[{posicion, nombre, valor, simbolo}]` que escribe `dataengine/jobs/run_refresh_layer_stats.py`, resolviendo por `layer_key = geoserver_workspace:geoserver_layer`.

#### Agregado

- **`describe_layer` = retrato único de una capa**: absorbe `get_metadata`, `get_layer_stats` y `get_periodicity` en una sola llamada. Nuevo bloque `capabilities` (`temporal`, `hasMunicipio`, `municipioField`, `descargable`, `consultableWfs`, `zoomRange`) que le dice al agente qué puede hacer con la capa, y `periodicidad` resumida a `{años, meses}`. `capabilities.temporal` es `true` si la capa tiene años de periodicidad aunque no use dimensión TIME de WMS.
- **`create_map`**: crea un mapa de un panel. Dos modos: `query`/`theme` (busca la mejor capa) o `layers` (capas ya resueltas), + modificadores `municipio`, `year` (validado contra la periodicidad), `annotations`, `view`, `basemap`, `selected`. Absorbe `make_map` + `create_single_share`.
- **`create_swipe`**: crea un mapa comparativo A|B. Dos modos: `layer`+`year_a`+`year_b` (una capa en dos años) o `pane_a_layers`+`pane_b_layers` (dos capas). En modo dos-capas, `year_a`/`year_b` filtran cada lado y el server arma+valida el CQL de fecha (el agente no escribe CQL). + `municipio`. Absorbe `create_swipe_share` + `compare_years`.

#### Eliminado

- **Tools MCP `get_metadata`, `get_layer_stats`, `get_periodicity`** (absorbidas por `describe_layer`), **`get_layer_tree`, `get_initial_order`, `get_sources_batch`** (sin rol en crear mapas; `search_layers`/`describe_layer` cubren lo necesario) y **`measure_geometry`** (utilidad de análisis, 0 uso en telemetría). Las funciones internas y los endpoints REST del backend se conservan; solo cambia la exposición como `@mcp.tool()`.

#### Refactor

- **`servers/share_tools.py` dividido por dominio** en `servers/resolve.py` (resolución de capas, periodicidad, fechas, búsqueda, municipios), `servers/layers.py` (`describe_layer`, `get_layer_stats`, `query_wfs`) y `servers/shares.py` (`create_map`, `create_swipe` + internos). `servers/mapalab.py` queda como capa delgada de registro de `@mcp.tool()`.

---

## [1.81.0] - 2026-06-30

### Backend expone `tiled`; frontend usa el flag del backend

El backend serializa la columna `mapalab.layers.tiled` en `wmsConfig.tiled` y el frontend la consume directamente, eliminando la lista local `TILED_LAYERS`.

#### Agregado

- **Backend** (`models/layer.py`, `services/layer_tree_service.py`): columna `tiled` en el modelo ORM y serialización en `_layer_to_wms_config`.
- **Frontend** (`helpers/wmsConfig.js`): `hydrateWmsConfig` resuelve `tiled` exclusivamente desde `wmsConfig.tiled` (`=== true`). Se elimina la constante `TILED_LAYERS` hardcodeada en el frontend.

---

## [1.80.0] - 2026-06-30

### Agregado

- **Capas servidas por tiles (`TileWMS`), configurable por capa**: `useWMSLayerFactory` crea `TileLayer` + `TileWMS` cuando la capa trae `tiled: true` (en vez de `ImageWMS`). Esto permite que GeoWebCache cachee los tiles —incluso con `CQL_FILTER`, vía un parameter filter en GWC— haciendo la navegación (pan/zoom) mucho más fluida en capas grandes y estáticas. `hydrateWmsConfig` resuelve `tiled` desde la config del backend con fallback a una lista local (`TILED_LAYERS`), por ahora solo `economia:cultivos`.

### Notas

- Pendiente: exponer `tiled` como columna en `mapalab.layers` (editable desde mariachi) para retirar la lista local `TILED_LAYERS`.

## [1.79.0] - 2026-06-24

### Agregado

- **Sombreado de relieve en producción**: el overlay permanente de relieve (introducido en 1.77.0 con capas placeholder) ahora apunta a las capas reales publicadas en GeoServer `raster:hillshade_iieg_cog` / `raster:hillshade_inegi_cog`. Conserva todo el comportamiento del overlay: siempre activo, fuera del panel de capas activas, oculto en "Sin Mapa Base", `zIndex 10000` y alternancia IIEG/INEGI según el switch de capas de límites.

### Cambiado

- **Blend `multiply` del relieve en el cliente**: el sombreado se compone con `globalCompositeOperation = 'multiply'` en el `prerender`/`postrender` del `reliefLayer` (`useMapInitialization`), de modo que oscurece según el relieve sin tapar los colores de las capas temáticas. El blend del SLD (`composite: multiply`) no aplicaba en este montaje porque el relieve es una petición WMS independiente, no una capa compuesta por GeoServer junto a las demás.

## [1.78.1] - 2026-06-24

### Corregido

- **Íconos del sider comprimidos**: el puntito de novedad del tema envolvía el ícono en un contenedor flex, por lo que el margen negativo de la animación de colapso encogía horizontalmente el ícono. La animación de colapso se movió al contenedor y el ícono queda fijo (`shrink-0`), restaurando su proporción cuadrada en ambos estados del sider.

## [1.78.0] - 2026-06-19

### Agregado

- **Badge "Nueva/Actualizada" por capa**: nueva configuración por capa (`badge` JSONB en `mapalab.layers`, tab "Badge" en el editor de mariachi) que muestra una pildora junto a la capa en el menú de temas, los resultados de búsqueda y el panel de capas activas. Presets `Nueva`/`Actualizada`/`Próximamente` (label y color por defecto) más variante `custom` con texto y color libres. Soporta **temporalidad** (`validFrom`/`validUntil`): la pildora solo aparece mientras el badge esté vigente.
- **Puntito de novedad en el tema**: el tema raíz del sider muestra un indicador cuando alguna de sus capas tiene un badge vigente que el usuario aún no ha activado. Al activar la capa se marca como vista en `localStorage` (clave `mapalab.badge.seen.<layerId>.<hash>`) y el puntito no reaparece; si el admin re-badgea la capa (cambia el hash de contenido), vuelve a mostrarse. La pildora persiste por temporalidad aunque el puntito ya se haya apagado.
- Helpers `badgeHelpers.js` (presets, ventana de vigencia, hash de contenido, `themeHasUnseenBadge`), store reactivo `badgeSeenStore.js` (`useSyncExternalStore`) y componente `LayerBadge`. Tests de `badgeHelpers`.

## [1.77.0] - 2026-06-19

### Agregado

- **Overlay permanente de sombreado de relieve**: capa de relieve montada sobre el stack de OpenLayers (`zIndex 10000`) que se pinta siempre por encima de cualquier capa o mapa base, fuera del WMS layer manager y sin aparecer en el panel de capas activas. Visible salvo en "Sin Mapa Base". Alterna entre variante IIEG e INEGI según el switch de capas de límites. Estilo/blend resuelto en GeoServer; el visor solo la posiciona y elige la variante. Nuevo hook `useReliefOverlay` y definiciones (`RELIEF_OVERLAY`, `RELIEF_OVERLAY_Z_INDEX`) en `helpers/basemaps.js`. Los nombres de las capas de GeoServer (`raster:sombreado_relieve_iieg` / `_inegi`) son placeholder hasta su publicación.
- **`docs/mapbase.md`**: documentación de mapas base seleccionables, overlays permanentes (etiquetas, relieve) y el pendiente de administración desde mariachi.

### Cambiado

- La derivación del modo IIEG/INEGI se centralizó en `isInegiBaseMode` (`helpers/basemaps.js`), reutilizada por `ActiveLayersList` y `MapView` (la variante del relieve respeta el pane activo en modo swipe).

## [1.76.0] - 2026-06-12

### Agregado

- **Icono de simbología en el estado vacío del InfoBox**: cuando la capa seleccionada no tiene información en el punto clickeado, el panel muestra el swatch de la capa consultada junto al mensaje y el de cada capa alternativa sugerida. Nuevo hook `useLayerSymbolIcon` que resuelve el icono via `GetLegendGraphic` JSON (lee las reglas del estilo) + PNG icon-only (`forceLabels:off`, `&rule=<primera>` cuando hay varias reglas con nombre; sin nombre cae a la pila completa recortada con CSS). Cache en memoria por capa; los errores de red no se cachean para permitir reintento.
- **Pulso de capa al hover sobre una alternativa (desktop)**: pasar el mouse sobre una capa sugerida la destaca en el mapa reutilizando el pulso del panel de capas activas; al salir se restaura de inmediato. `useLayerSelectionPulse` ahora expone `cancelPulse` en el contexto.
- **Telemetría del estado vacío**: eventos `infobox_action` con `empty_suggestions_view` (aparición del estado vacío, con `layer_id` consultado) y `select_alternative` (capa sugerida elegida).
- **Parámetro `rule` en `getLegendUrl`** (`useWMSLegend`) para pedir leyendas de una sola regla.
- Tests del hook `useLayerSymbolIcon` (5 casos: multi-regla, regla única, grupos, reglas sin nombre, error de red).

### Cambiado

- **Mensaje del estado vacío del InfoBox**: "No hay información en este punto" → "La capa seleccionada no tiene información en este punto." para aclarar que la consulta fue sobre la capa seleccionada.
- `selectedFeatureInfo` incluye `queriedLayerId` junto a `queriedLayerName`; `selectAlternativeLayer` lo actualiza al cambiar de capa.
- La agrupación de capas alternativas se extrajo a `groupAlternativeResults` en `layerHelpers.js` (sin cambio de comportamiento).

## [1.75.0] - 2026-06-08

### Cambiado

- **Barra de acciones de herramientas en mobile**: ahora se usa **la misma barra que en desktop** (↶ ✓ ✕ en línea/polígono, color/grosor en trazo libre) en lugar del pill provisional. Para darle espacio, al seleccionar una herramienta en mobile el panel **colapsa automáticamente** a solo la herramienta activa y al terminar se expande mostrando todas. Flujo **one-shot** en mobile: tras finalizar (Escape / doble click / Terminar / Cancelar) o colocar (emoji/texto/trazo), la herramienta se deselecciona. En desktop el comportamiento multi-trazo se mantiene.
- **Eliminado el botón manual de colapso ◀/▶** (mobile y desktop): el colapso es automático por selección; desktop muestra todas las herramientas siempre.
- Nuevo hook `hooks/useIsMobile.js` (matchMedia con el breakpoint 768 de `SiderContext`), usado por `useMapDrawing` ya que `SiderProvider` vive por debajo de `MapsProvider`.

### Corregido

- **Ícono de eventos en mobile**: se ocultaba solo con `areMeasurementToolsVisible`; ahora se oculta siempre que el panel de herramientas esté presente — `toolsPanelVisible = areMeasurementToolsVisible || areAnnotationToolsVisible || isDrawing || measurements.length > 0` — cubriendo el caso de **trazos persistidos tras un refresh** (cuando solo se ven lista + X) y el de anotaciones/dibujo.
- **Ancho de columna en compact (mobile)**: el grupo aplicaba el layout de 2 columnas (`[&>*]:w-[calc(50%-2px)]`) también con una sola herramienta activa, desfasando la barra `left-full`; en compact ahora usa ancho natural para que la barra quede pegada al botón.

## [1.74.0] - 2026-06-08

### Agregado

- **Iconos por estado en temas del sider**: los temas del menú lateral ahora soportan iconos distintos para estado normal y hover/activo. La propiedad `iconOverrides` del árbol permite definir `{ normal: "/acervo/...", hover: "/acervo/..." }`. Si existe, reemplaza al `iconUrl` estático; si no, mantiene el comportamiento actual (SVG hardcodeado por categoría).

### Cambiado

- **`helpers/menuItems.jsx`**: `MenuButton` acepta `iconOverrides` y resuelve `iconOverrides?.[iconState]` con fallback a `imageUrl` y finalmente al `Icon` hardcodeado. `createCategoryItems` pasa `category.iconOverrides`.

## [backend 1.72.0] - 2026-06-08

### Agregado

- **Columna `icon_overrides` en modelo Layer**: `models/layer.py` mapea la nueva columna JSONB.
- **Resolución de URLs de acervo en `layer_tree_service.py`**: nuevo helper `_resolve_acervo_icon()` convierte paths relativos (`mapalab/...`) a root-relative (`/acervo/...`). Se aplica a `iconUrl` y `iconOverrides` para temas. Corrige URLs rotas en el visor (antes el navegador resolvía rutas relativas contra `/mapalab/` duplicando el prefijo).

## [1.73.0] - 2026-06-08

### Agregado

- **Longitud por segmento**: líneas y polígonos ahora pueden mostrar la longitud de cada tramo entre vértices consecutivos como etiquetas en el punto medio. Se activa/desactiva desde el panel de configuración de mediciones (ícono de engrane en "Mis mediciones").
- **Perímetro en polígonos**: la etiqueta de los polígonos ahora muestra tanto el área como el perímetro (antes solo mostraba área).
- **Selector de unidades**: nuevo panel de configuración accesible desde el historial de mediciones con controles para forzar unidades de distancia (Auto / m / km) y área (Auto / m² / ha / km²). La preferencia se persiste en `localStorage` (`mapalab.measure.units`). Cambiar la unidad recalcula instantáneamente todas las etiquetas existentes.

### Cambiado

- **Refactor de formateo**: las funciones `formatLength` y `formatArea` se extrajeron de `useMapDrawing` al helper compartido `helpers/formatMeasure.js`, con soporte de unidades parametrizable. Se reutilizan en `useMapDrawing`, `restoreAnnotations` y `drawingStyles`.
- **Estilos de medición**: las funciones `createAngleStyles` y `createSegmentLengthStyles` se movieron a `helpers/measurementStyles.js` para mantener `drawingStyles.js` bajo el límite de líneas.

## [1.72.0] - 2026-06-08

### Agregado

- **Persistencia local de mediciones y anotaciones**: ahora sobreviven al refresh de la página. Se guardan en `localStorage` (`mapalab.annotations`) en cada cambio y se restauran al cargar el visor; mientras existan se mantienen el botón de lista y la X. La X de "Cerrar herramientas" limpia el almacenamiento. Si hay un share activo (`?s=`), el enlace tiene prioridad y no se hidrata desde local.
  - `helpers/annotationsSerialization.js`: serializador compartido reutilizado por el share y la persistencia local.
  - `useMapDrawing.js`: efectos de hidratación (una vez) y persistencia (por cambio de `measurements`); `restoreAnnotations` acepta `{ showTools }`.

### Cambiado

- **Estilo completo en shares y persistencia**: el payload de anotaciones ahora incluye `fillColor`, `bgColor`, `size` (escala) y `symbol` (emoji), antes se perdían al compartir/restaurar.
- **Homologación de marca en herramientas**: colores de dibujo alineados a tokens institucionales — línea/medición y halo en morado `purple-deep` (#703088, antes convivían #703089/#70308A), polígono en naranja de marca (#FF8300), selección en azul numeralia (#2e4372), trazo libre en rosa de marca (#FF577D). Etiquetas y ángulos del mapa en fuente **Garet** (antes Inter). JSX del subsistema migrado a clases token (`text-graphite`, `bg-purple`, etc.).
- **Default de color de texto centralizado** en `helpers/drawingConstants.js` (`DEFAULT_TEXT_FILL`), antes repetido en 4 archivos.

### Corregido

- **Texto restaurado se veía como emoji**: `restoreAnnotations` lo renderizaba con `createSymbolStyle` (fuente emoji 32px); ahora usa `createTextStyle` con su color/fondo/escala.
- **Anotaciones restauradas no eran editables**: se aplicaba `feature.setStyle()` directo, anulando la función de estilo de la capa; ahora se cachea en `cachedStyle`, por lo que rotar/escalar vuelve a re-renderizar.
- **XSS potencial**: el catálogo de símbolos se inyectaba como SVG crudo (`dangerouslySetInnerHTML`); ahora se renderiza vía data-URL en `<img>`, igual que en el mapa.
- **`crypto.randomUUID()` fuera de contexto seguro**: nuevo helper `genId()` con fallback (no truena al terminar un trazo en HTTP plano).
- **Escape mientras se escribe**: deseleccionaba/abortaba el trazo al teclear Escape en el input del panel de texto; los hooks de dibujo/edición ignoran Escape cuando el foco está en un campo de texto.
- **`HistoryPanel`**: botón de cerrar sin `aria-label`.
- **Reset al cerrar herramientas**: color/fondo/tamaño/borrador de texto se reinician a su valor por defecto.

## [1.71.0] - 2026-06-05

### Panel de herramientas: Mediciones y Anotaciones separados

Refactorización del panel de herramientas flotante para separar herramientas de medición (Punto, Línea, Polígono) de anotaciones (Texto, Emoji, Trazo libre) en dos grupos independientes con toggles desde el menú lateral.

- **`ToolsMenu.jsx`**: tercer botón "Anotaciones" (ícono emoji) junto a Mediciones y Swipe. Grid 2 columnas.
- **`ToolSelector.jsx`**: grupos `measurementGroup` y `annotationGroup` con renderizado independiente. Desktop 1 columna, mobile 2 columnas con ambos grupos abiertos. Colapso manual con botón de flecha que preserva la herramienta activa visible.
- **`ToolsPanel.jsx`**: `FloatingIconButton` reutilizado para colapsar. Pill de acciones (↶✓✕) solo mobile y solo al dibujar. `CloseButton` unificado cierra ambos grupos. Botón "Mostrar/Ocultar" con transición. `areAnnotationToolsVisible` y `hideAnnotationTools` añadidos al estado.
- **`useMapDrawing.js`**: `areAnnotationToolsVisible`, `hideAnnotationTools`, `toggleAnnotationTools` expuestos.
- **`MapSider.jsx`**: `handleToggleAnnotations` con mismo comportamiento que mediciones (cierra sider en mobile, telemetría).
- **`menuItems.jsx`**: `toggleAnnotationTools`, `areAnnotationToolsVisible` propagados.
- **`ExternalEventoWidget.jsx`**: oculta eventos en mobile si hay herramientas activas (mediciones o anotaciones).

### Anotaciones: color, fondo y tamaño

- **`TextPanel.jsx`**: controles de color (fillColor), fondo (bgColor) y tamaño (0.1–3.0) en el panel de texto. Se guardan en el feature vía `useMapDrawing`.
- **`useTextTemplate.js`**: refs `textFillColorRef`, `textBgColorRef`, `textSizeRef` y setters expuestos.
- **`drawingStyles.js`**: `createTextStyle` y `createEmojiStyle` aceptan `fillColor`, `bgColor`, `fontFamily`, `backgroundFill`, `backgroundStroke`. `createSymbolStyle` propaga los nuevos parámetros.
- **`restoreAnnotations.js`**: lee `size`, `fillColor`, `strokeColor`, `backgroundFill`, `backgroundStroke`, `fontFamily` del payload de anotaciones. Texto usa Garet por defecto.
- **`MapToolsPanel.jsx`**: chip gris con botón X para quitar share. `useSearchParams` para `handleClearShare`.

### Fixes

- **`useShareDirtiness.js`**: gracia de 500ms vía timestamp (sin Date.now en render). `setIsDirty` con flag `pendingResetRef`.
- **`SwipeView.jsx`**: hereda vista del mapa principal al entrar a swipe. Soporta `paneMapInstances` como objeto.
- **`useSwipeMode.js`**: `capturedView` desde `mapRef.current` al entrar. Conserva capas en pane A.
- **`useShareDeserializer.js`**: `capturedView` desde el payload del share al `compareMode`.
- **`useBaseMapManager.js` / `useMapInitialization.js`**: protegidos contra crash con basemap desconocido.
- **`finishCurrentSketch`**: llama `updateSketchingState(false)` directamente (drawend no confiable en mobile).

### Documentación

- **`docs/tools-panel.md`**: nuevo. Layout, botones, flujo de acciones, personalización de anotaciones.
- **`docs/mcp.md`**: actualizado con 18 tools y recetas.
- **`docs/context.md`**: `MARIACHI_VERIFY_SSL`, `MCP_AUTH_ENABLED`, `MCP_QUOTA_FLUSH_INTERVAL_SECONDS`.
- **`mariachi/.../McpTopic.jsx`**: guía rápida para agentes.

## [1.70.0] - 2026-06-04

### MCP: guía de uso, mejoras en shares y fixes de visor

Sesión intensiva de prueba y pulido del MCP con un agente externo. Se crearon shares con capas, filtros de fecha, anotaciones (polígonos, líneas, emojis), modo municipio y swipe. Cada fallo se diagnosticó y corrigió en el momento.

#### MCP y documentación

- **`servers/mapalab.py`**: descripciones mejoradas de `create_single_share`, `create_swipe_share` y `get_periodicity` con ejemplos concretos de CQL para filtros de fecha, basemaps válidos (`voyager`/`position`), formato de anotaciones (`LineString`, `Polygon`, `Emoji` con `textLabel`) y municipios.
- **`docs/mcp.md`**: nueva sección "Guía rápida" y "Receta 0" con flujo completo `search_layers → get_periodicity → resolve_municipios → measure_geometry → create_single_share`.
- **`docs/context.md`**: documentadas `MARIACHI_VERIFY_SSL`, `MCP_AUTH_ENABLED`, `MCP_QUOTA_FLUSH_INTERVAL_SECONDS` en variables de entorno del backend.
- **`mariachi/admin/.../McpTopic.jsx`**: guía rápida en la página de documentación del admin con tips de basemaps, filtros fecha, anotaciones, municipios y flujo típico.

#### Fixes de frontend

- **`useBaseMapManager.js`** y **`useMapInitialization.js`**: protegidos contra crash con basemap desconocido (`basemaps[baseMapId]` undefined).
- **`drawingStyles.js`**: `createSymbolStyle` ahora acepta strings planos como emoji (antes esperaba objeto `{kind, value}`).
- **`restoreAnnotations.js`**: corregido `scale` NaN al restaurar emojis (se pasaba `type` string en vez de `1`).
- **`SwipeView.jsx`**: hereda vista del mapa principal al entrar a swipe desde un share. Soporta `paneMapInstances` como objeto (no solo array).
- **`useSwipeMode.js`**: `enterCompareMode` captura `capturedView` del mapa principal y conserva capas en pane A (ya no las vacía). Acepta `mapRef`.
- **`useShareDeserializer.js`**: comparte `capturedView` desde el payload del share al `compareMode` para que el swipe abra centrado.
- **`useShareDirtiness.js`**: gracia de 500 ms (vía timestamp) para absorber cambios de setup del share antes de marcar como sucio. Botón X para quitar el share desde el chip gris.
- **`MapToolsPanel.jsx`**: botón X en chip gris para quitar el share sin recargar.
- **`ToolsMenu.jsx`**: tooltip actualizado (capas van al lado A, no se vacían).

#### Docker

- **`docker-compose.yml`**: `MARIACHI_VERIFY_SSL` en containers backend y MCP.
- **`.env.production`** (local): `MAPALAB_PUBLIC_BASE_URL` a `https://<host-staging>` para shares locales.

## [1.69.0] - 2026-06-04

### MCP y backend: `MARIACHI_VERIFY_SSL` para comunicación interna con mariachi vía HTTPS

El MCP no podía validar API keys porque `MARIACHI_BACKEND_URL` apuntaba a `http://mariachi-api:8000` (nombre DNS de Docker), inalcanzable desde el servidor de producción de mapalab. Además, la comunicación HTTP a mariachi vía nginx (puerto 80) recibía un 301 redirect a HTTPS que el cliente `httpx` no seguía.

- **`backend/app/config.py`**: nuevo campo `MARIACHI_VERIFY_SSL` (default `true`) para controlar la verificación del certificado en llamadas internas a mariachi.
- **`backend/app/services/api_key_validator.py`**: el cliente `httpx` ahora usa `verify=settings.MARIACHI_VERIFY_SSL`.
- **`backend/app/services/api_key_quota.py`**: ídem.
- **`backend/app/services/access_logger.py`**: ídem.
- **`servers/telemetry.py`**: ídem.
- **`.env.production`**: nuevo `MARIACHI_BACKEND_INTERNAL_URL` (para el MCP) + `MARIACHI_VERIFY_SSL=false` para certificados auto-firmados en red interna.
- **`docs/mcp.md`**: documentada la variable `MARIACHI_VERIFY_SSL` en la sección de configuración.

## [1.68.0] - 2026-06-04

### Eventos: abrir el detalle de una capa elegida + telemetría solo en click explícito

Al abrir un evento se auto-activan varias capas y el `LayerDetailModal` quedaba mostrando el de la última activada (orden arbitrario). Ahora, si en mariachi se marca una capa del evento (campo `abrirDetalle`, admin 1.28.0 / api 1.28.0), al abrir el evento se abre **su** detalle.

- `pages/maps/components/EventoMenu.jsx`: tras auto-activar, abre el `LayerDetailModal` de la capa con `abrirDetalle` (`setSelectedLayer`), que gana sobre el default porque se llama después de activar todas. Si ninguna está marcada, comportamiento anterior intacto.
- **Telemetría**: la apertura **automática** del `LayerDetailModal` deja de contar para `trackLayerDetailOpen`. Solo cuenta el click explícito del usuario en el botón de detalles del panel de capas activas.
    - `pages/maps/components/LayerDetailModal/LayerDetailModal.jsx`: el effect de tracking respeta una bandera `silent` en `selectedLayer`.
    - `pages/maps/hooks/useLayerToggle.js`: la apertura del modal al activar una capa marca `silent` (es efecto secundario, no intención de ver detalle). `EventoMenu` también marca `silent`. `ActiveLayerItem` (click explícito) pasa el objeto sin `silent`, así que sigue contando.

## [1.67.0] - 2026-06-03

### Telemetría: abrir un evento no infla las activaciones de sus capas

Al abrir un evento se auto-activan sus capas; cada activación emitía un `layer_toggle` que se contaba como activación de capa en Estadísticas de MapaLab, inflando todas las capas del evento. Ahora esas auto-activaciones se **etiquetan** (no se suprimen) para que el backend (mariachi `api 1.27.0`) las cuente como contexto del evento, no de la capa. La función de auto-activación no cambia: las capas se siguen prendiendo igual; el switch manual de una capa sí cuenta para esa capa.

- `services/analyticsService.js`: `trackLayerToggle(layerId, isActivating, context)` mete el `context` en `props` del evento `layer_toggle`.
- `pages/maps/hooks/useLayerToggle.js`: el 3er parámetro de `handleToggleLayer` acepta booleano (legacy `skipAnalytics`) o un objeto `{ skipAnalytics, analytics }`, retrocompatible.
- `providers/MapsProvider.jsx`: encadena el contexto también en la rama de swipe/compare.
- `pages/maps/components/EventoMenu.jsx`: la auto-activación pasa `{ analytics: { source: 'evento_open', evento_id } }`, así el `layer_toggle` resultante queda etiquetado.

---

## [1.66.1] - 2026-06-03

### Cache de eventos/home: TTL de 24h y logging de errores

Mejoras al sistema de cache del frontend para datos de eventos y home (provenientes de mariachi).

- **TTL de 24 horas**: la cache local de `eventos` y `home` ahora expira despues de 24 horas desde su ultima carga, como safety net adicional al polling de `cache-version` (30s). Antes, los datos podian quedar stale indefinidamente si el polling fallaba por problemas de red o el usuario tenia la pestana abierta por periodos largos. Al recargar la pagina, la cache de memoria se limpia automaticamente.
- **Logging de errores en desarrollo**: el catch silencioso en `checkVersions` ahora logea un warning en consola cuando el entorno es `DEV`, facilitando el debugging sin afectar produccion.
- **Variable de entorno `VITE_MAPALAB_PUBLIC_API_HOST`**: agregada a `.env.production` para consistencia con los demas entornos. Define el prefijo base para las peticiones a mariachi (`/api/mapalab/`).

`frontend/src/services/eventosService.js`: timestamps `eventosTimestamp`/`homeTimestamp` en el objeto cache, helper `isCacheValid()`, y verificacion de TTL antes de retornar datos cacheados.

---

## [1.66.0] - 2026-06-02

### Avisos por capa: zoom robusto y tamaño compacto

Mejoras al render de los avisos por capa (`notice`), enfocadas en los anclados a punto con rango de zoom.

- **Tolerancia a `zoomRange` invertido**: `isZoomWithinRange` (`helpers/noticeHelpers.js`) normaliza el rango cuando `min > max`. Antes, un rango invertido (p. ej. `{min: 15.8, max: 11.3}`, generable desde el editor) hacía que el filtro nunca se cumpliera y el aviso **no apareciera jamás**. Beneficia a los registros ya guardados sin tocar la base.
- **Nuevo tamaño `compact`**: se expone el preset `compact` que ya existía en `Message` (más chico que `small`, sin sombra). `NOTICE_SIZE_WIDTH_CLASS` (300px) y `SIZE_ARROW` (14) lo soportan. Aplica a avisos anclados a punto. Sin migración: las capas existentes conservan su tamaño.

Las escalas de zoom del editor (mariachi admin 1.26.0) se calibraron al rango real del visor (`minZoom 8` / `maxZoom 18`).

---

## [1.65.0] - 2026-06-02

### Home: respetar el flag `activo` por item en Guía, Opciones, Preguntas y Subtemas

El editor del Inicio (mariachi admin 1.25.0 / api 1.24.0) ahora permite desactivar items de estas secciones sin eliminarlos. El visor ya filtraba los Temas inactivos (`activo !== false`); se extiende el mismo criterio al resto de secciones del home para que un item apagado en el admin no se pinte en el home público.

- `frontend/src/pages/home/helpers/homeAdapters.js`: `buildGuide` y `buildSelect` filtran `activo !== false` antes de mapear; los `subtopics` en `buildTopics` se filtran con el mismo criterio. `buildFaqContent` filtra las preguntas inactivas y, si no queda ninguna activa, devuelve `null` para caer al FAQ bundled en lugar de pintar la sección vacía.

Sin cambios de contrato: el flag llega dentro de cada item del payload JSON de la sección. Items sin el campo se interpretan como activos (compatibilidad hacia atrás).

---

## [1.64.1] - 2026-06-02

### Panel de herramientas: botón de descarga con nombre completo y ancho auto mientras "Vista por municipio" no está en producción

Mientras "Vista por municipio" siga limitada a entornos no productivos (`MunicipioFilterButton` retorna `null` en producción), el panel de herramientas (`MapToolsPanel`) deja de forzar el ancho fijo `md:w-[373px]`: pasa a `w-auto` y se ajusta a su contenido. En ese caso el botón de descarga (`Download`) muestra el nombre completo **"Descargar visualización"** (ancho `md:w-auto`) en lugar del corto "Descargar".

Cuando "Vista por municipio" llegue a producción, ambos vuelven solos al comportamiento actual (panel a 373px, botón "Descargar" con `md:w-30`) — todo gobernado por el mismo flag `IS_NON_PROD`. Mobile y modo colapsado no cambian (siguen mostrando solo el ícono).

- `frontend/src/pages/maps/components/MapToolsPanel.jsx`: `IS_NON_PROD`, ancho `w-auto` cuando no hay municipio, prop `expanded` hacia `Download`.
- `frontend/src/pages/maps/components/MapExport/Download.jsx`: prop `expanded` → texto "Descargar visualización" + `md:w-auto md:px-6` + `whitespace-nowrap`.

---

## [backend 1.33.0] - 2026-05-31

### Seguridad MCP: auth por API key + cuota por key + rate limit en nginx

Cierre de tres hallazgos de una auditoría de seguridad al servidor MCP (`mapalab-mcp`), que hasta 1.32.x era público sin auth: cualquiera que alcanzara `/mcp` podía llamar las 14 tools, incluidas las dos writes (`create_*_share`) que persisten filas en la BD, sin rate limit ni atribución.

#### H1 — Autenticación por API key (todas las tools)

- Nuevo `servers/auth.py::MCPAuthMiddleware`, montado como middleware **más externo** sobre `combined_app` (antes que `MCPTelemetryMiddleware`). Exige `Authorization: Bearer mk_...` (o `X-API-Key`) en toda request a `/mcp`.
- Valida con `app.services.api_key_validator.validate_api_key(key, origin=None, ip=...)` — el mismo validador cacheado del widget embebible, en threadpool para no bloquear el event loop. Sin key/ inválida → **401** + `WWW-Authenticate`.
- Cubre lectura y escritura (cierra también la fuga de nombres internos vía `get_workspaces`). `/health`, `/`, `/metrics` quedan fuera del prefijo `/mcp`.
- Toggle `MCP_AUTH_ENABLED` (default `true`) para dev local sin mariachi.

#### H2 — Cuota por key (abuso de escritura)

- `servers/telemetry.py` consume el `mapalab_key` del `scope` y, por cada `tools/call`, aplica `QuotaTracker` (`app.services.api_key_quota`): `can_consume` antes (→ **429** + `Retry-After` si agotada) y `record` después.
- `servers/mapalab.py` arranca `quota_flush_loop` (`MCP_QUOTA_FLUSH_INTERVAL_SECONDS`, 60 s) que flushea uso a mariachi, con flush síncrono final en shutdown.

#### H3 — Rate limit + connection limit en nginx

- `nginx/nginx-main.conf`: zonas `mcp_req` (10 r/s) y `mcp_conn`, status 429.
- `nginx/nginx.conf`: `limit_req zone=mcp_req burst=20 nodelay` + `limit_conn mcp_conn 10` en los 4 bloques `location` de `/mcp`.

#### Cómo conecta un cliente LLM

El humano configura su cliente MCP con el header (`claude mcp add --header "Authorization: Bearer mk_pub_..."`); el agente lo reenvía en cada request. Caveat: las keys para MCP deben emitirse sin restricción de dominio en mariachi (el MCP llama con `origin=None`). Detalle completo en `docs/mcp.md §Auth y seguridad`.

Verificado: `nginx -t` OK, smoke test del container (401 sin token / con token inválido, 200 en `/health`, `tools/list` OK con `MCP_AUTH_ENABLED=false`), middleware de auth confirmado como outermost. Pendientes de la auditoría no incluidos aquí: M1 (cap de vértices en `measure_geometry`) y M2 (validar `filters.date` CQL server-side).

---

## [1.64.0] - 2026-05-31

### Selección de capa: pulso por capa con overlay + encuadre consciente de paneles + centrar desde la leyenda

Forma final del resaltado al seleccionar una capa no-activa en el panel de Capas Activas (`useLayerSelectionPulse`), tras la serie de iteraciones 1.60.0–1.63.0. Reemplaza el resaltado por features (WFS) de 1.62.0 por una atenuación de la opacidad real de las capas WMS.

#### Pulso por capa con overlay para grupos

- `classifyLayer` clasifica cada `ImageLayer` del mapa frente a la seleccionada: `target` (solo la seleccionada → se deja full), `other` (no la contiene → se atenúa a 0 y reaparece en 6 s con `easeInOut`), `mixed` (seleccionada + hermanas del mismo workspace en una sola request WMS).
- Para `mixed` monta un **overlay temporal** (`ImageWMS` clonando los params reales del grupo, recortados por índice) con solo la seleccionada a opacidad full, y **espera `imageloadend` antes de atenuar el grupo** para que la seleccionada nunca parpadee. `cleanup` restaura opacidades y remueve overlays.
- Duración del pulso 6000 ms (`8db9669`).

#### Encuadre consciente de paneles

- Nuevo `helpers/mapFit.js::getFitPadding`: `view.fit` usa padding asimétrico `[top, right, bottom, left]` que reserva el ancho real del sider (`useSider().width`) y del panel de capas activas (`ACTIVE_LAYERS_PANEL_WIDTH = 373`) más márgenes, con clamp si los paneles superan el 80 % del mapa; en mobile usa márgenes simétricos. Aplicado a `centerOnLayer`, `centerOnEvento` y "centrar en Jalisco" de `<MapControls>`. Antes el fit centraba sobre la pantalla completa y la capa quedaba tapada por los paneles.
- `centerOnLayer` acepta `fitOptions` y cae a la cadena de ancestros vía `resolveCenterExtent` si la capa no resuelve extent, en vez de no mover el mapa.

#### Centrar desde la leyenda

- Toda la tarjeta de `<LayerLegendInline>` es clickeable (`role="button"` + teclado) y dispara `centerOnLayer`; en hover muestra el ícono `fit_extent` arriba a la derecha como indicador.

#### Corregido: bbox corrupto de GeoServer (`84e8e65`)

- Algunas capas (ej. `salud:unidades_salud`) anuncian en el GetCapabilities un BoundingBox inválido (longitud con error de signo, bbox global con latitud 90). Transformar lat 90 a EPSG:3857 da Infinito, rompiendo `view.fit` y dejando el mapa en zoom máximo al centrar.
- `sanitizeExtent4326` (`services/wmsCapabilitiesService.js`) detecta extents fuera del rango válido de Mercator o con span imposible para Jalisco y los recorta a `JALISCO_BOUNDS`; los extents plausibles quedan intactos.

Archivos: `useLayerSelectionPulse.js`, `helpers/mapFit.js` (nuevo), `LayerLegendInline.jsx`, `EventoMenu.jsx`, `MapControls.jsx`, `ActiveLayerItem.jsx`, `services/wmsCapabilitiesService.js`. Estado final documentado en `docs/context.md §Selección de capa: pulso + encuadre`.

---

## [1.63.0] - 2026-05-29

### Selección de capa: el pulso atenúa la opacidad real de las capas WMS no seleccionadas

Cambio de enfoque sobre 1.62.0: en lugar de resaltar las features de la seleccionada vía WFS (costoso) o pintar máscaras bbox, el pulso ahora baja la opacidad real de las demás capas WMS del mapa y deja la seleccionada intacta, restaurándola al terminar. Sin requests WFS ni máscaras. `useLayerSelectionPulse.js` simplificado. Es la base de la versión final 1.64.0.

---

## [1.62.0] - 2026-05-29

### (Experimental) Resaltado de features de la capa seleccionada vía WFS — reemplazado en 1.63.0

Intento de resaltar las features de la capa seleccionada consultándolas por WFS (`layerFeaturesService.js`, `bbox=viewport`, cap 500), con fallback a máscara bbox cuando la capa no resolvía features. Resultó costoso y se reemplazó en 1.63.0/1.64.0 por la atenuación de opacidad WMS; `layerFeaturesService.js` quedó sin uso tras 1.63.0.

---

## [1.61.2] - 2026-05-29

### Estilo: pulso de 3 s, sin ring morado, atenuación máxima 50 %

Ajuste visual del pulso de 1.61.0: se quita el ring morado sobre el bbox y se suaviza la atenuación (opacidad máxima 50 %), con duración 3 s. `useLayerSelectionPulse.js`.

---

## [1.61.1] - 2026-05-29

### Corregido: centerOnLayer/pulseLayer resuelven el extent unión para capas grupo

`centerOnLayer`/`pulseLayer` no movían el mapa cuando la capa seleccionada era un grupo (sin bbox propio en el GetCapabilities). Ahora resuelven el extent unión de los hijos. Duración del pulso ajustada a 1.6 s. `useLayerSelectionPulse.js`.

---

## [1.61.0] - 2026-05-29

### Selección de capa: pulso de 800 ms con atenuación alrededor + ring sobre el bbox

Primer pulso al seleccionar una capa: nuevo hook `useLayerSelectionPulse.js` que atenúa el entorno y dibuja un ring sobre el bbox de la capa durante 800 ms. Lógica extraída de `MapsProvider.jsx`. El ring y estos tiempos se ajustaron en 1.61.2 y el enfoque cambió en 1.63.0–1.64.0.

---

## [1.60.0] - 2026-05-29

### Capas activas: centrar el mapa en el bbox de la capa al seleccionarla

Al seleccionar una capa en el panel de Capas Activas, el mapa se centra automáticamente en su extent. Nuevo `services/wmsCapabilitiesService.js` que parsea el GetCapabilities WMS para resolver el BoundingBox por capa (con tests). `MapsProvider.jsx` expone `centerOnLayer`; `ActiveLayerItem.jsx` lo dispara al seleccionar.

---

## [1.59.0] - 2026-05-29

### Banner del home: logo respeta el `logoUrl` por item en mobile + descripción y CTA opcionales

Iteración sobre el banner del home (introducido en `[1.57.0]`). El sub-header mobile/tablet del banner mostraba siempre el `<Logo name="mapalab" variant="dark">` bundled aunque el banner del API trajera su propio `logoUrl` (caso típico: un banner de evento curado desde mariachi con su propia identidad visual). Y la descripción + CTA estaban siempre presentes, cayendo al texto bundled si el API venía vacío.

#### Logo mobile/tablet condicional

`pages/home/components/Header.jsx`, bloque `<div className="absolute top-4 left-1/2 -translate-x-1/2 2xl:hidden z-10">`: aplica el mismo patrón condicional que ya existía en el bloque desktop XXL (`2xl:flex`). Si `activeBanner.logoUrl` está set renderiza `<img src={activeBanner.logoUrl} className="w-80 h-25 object-contain" />`; si no, cae al `<Logo name="mapalab" variant="dark" size="w-80 h-25" expanded />` bundled como antes. Sin cambios en el bloque XXL — ya funcionaba.

#### Descripción y CTA opcionales

- `banners.map` deja de hacer fallback al banner bundled cuando los campos están vacíos: antes `description: api.descripcion || fallback.content.description`, ahora `description: api.descripcion || ''`. Idem `label`/`link` del CTA. Si el editor en mariachi deja descripción vacía, el visor ya no inyecta el texto bundled del banner default ("MapaLab es una herramienta interactiva…").
- El `<p>` de descripción se monta condicionalmente: `{activeBanner.content.description && <p>…</p>}`.
- El `<Link>` del CTA se monta condicionalmente requiriendo ambos campos: `{activeBanner.content.button.label && activeBanner.content.button.link && <Link>…</Link>}`. Esto evita el escenario en que el editor llene solo uno de los dos (botón sin destino o destino sin texto) y rompa el render con un `<Link to="">`.

Permite banners minimalistas con solo título e imagen de fondo, útil para anuncios cortos de evento. Sin cambios en otras secciones del home.

---

## [1.58.1] - 2026-05-29

### UX: la pill principal del chip de compartido y del chip de municipio ahora es la acción de centrar

Simplificación de los dos chips flotantes (`<ShareActiveChip>` y `<MunicipioActiveChip>`). En vez de un botón circular separado para "Centrar selección" / "Recargar configuración", la pill blanca/verde con la etiqueta del estado es ahora directamente clickeable y ejecuta esa acción. Tooltip describe la intención al hover. Reduce 1 elemento visual en cada chip y convierte la pill en su affordance principal.

#### `<ShareActiveChip>`

- Removido botón circular "Recargar configuración" (`fit_extent`, `bg-white`, ícono morado).
- El label verde "Compartido: `<id>`" pasa a ser `<button>` con `onClick={handleReapplyShare}`, mismo color base (`bg-[#DCFCE7]`), hover `bg-[#BBF7D0]`.
- Tooltip: "Click para recargar la configuración original del compartido".
- Quitado el responsive `md:flex-col lg:flex-row` porque ya no hay 2 botones que apilen — el chip queda en una sola línea en todos los breakpoints `md+`.

#### `<MunicipioActiveChip>`

- Removido botón circular "Centrar selección" (`fit_extent_normal`/`_hover` desde `externalIcons`).
- El chip blanco con el nombre del municipio pasa a ser `<button>` con `onClick={() => centerOnSelection?.()}`, mismo `bg-white border-[#EAEFFA]`, hover `border-purple`.
- Tooltip: `Click para centrar en <nombre>`.
- Removido el import `externalIcons` y el state `centerHovered` que ya no son necesarios.

#### `<MunicipioFilterPanel>`

- Removido el link "Centrar selección" del row de acciones del panel — la acción ya vive en el chip flotante (`<MunicipioActiveChip>`) y duplicarla aquí confundía cuál es la canónica. Solo queda "Salir del modo".
- Removido el destructuring de `centerOnSelection` del prop `municipioMode`.

---

## [1.58.0] - 2026-05-29

### Compartir mapa: chip flotante con acciones, quick-share + clipboard, fix race conditions

Iteración mayor del flujo de compartir. Combina UX (quick-share desde el botón principal, chip rediseñado con acciones inline) con dos fixes críticos del flujo de carga del visor desde un link `?s=`.

#### `<ShareActiveChip>` (nuevo componente)

Reemplaza el `<span>` verde estático que solo mostraba el ID del share. Vive en el flex row del `<MapToolsPanel>` (junto al botón compartir) y trae 3 piezas:

1. **Label verde** "Compartido: `<id>`" — mantiene el patrón visual del estado in-sync (`bg-[#DCFCE7]` / `border #22C55E` / `text #16A34A`).
2. **Botón recargar (`fit_extent`)** — `bg-white` con `hover:border-purple`, ícono morado institucional. Hace `fetchShare(loadedShareId)` + `useShareDirtiness.markPending()` + `deserialize(envelope)`. Re-aplica todo el envelope (view + capas + filtros + basemap + anotaciones) sin recargar la página.
3. **Botón X (`cerrar`)** — mismo patrón rosa del `<MunicipioActiveChip>`. Quita el `?s=` del URL con `setSearchParams.delete('s')` preservando el resto del state.

**Responsive (solución temporal):** `md:flex-col lg:flex-row` para que en pantallas medianas (768-1023px) el label quede arriba y los botones abajo (alineados a la derecha vía `md:items-end`), y en pantallas grandes vuelvan a una sola línea junto al panel de herramientas.

#### `<ShareButton>` — quick share + long press

El botón principal "Compartir" ahora actúa con dos gestos:

- **Click corto** (`< 450ms`): genera el envelope (single o swipe según `compareMode`), POST a `/shares`, copia el URL al portapapeles con `navigator.clipboard.writeText`, fallback a `window.prompt`. Feedback visual de 2.5s con bg verde + ícono `shared_click` + tooltip "¡Enlace copiado!".
- **Long press** (`≥ 450ms`): abre el `<SharePanel>` anclado (panel completo con tabs Link/Insertar).
- **Mobile + in-sync con un share**: tap corto desliga el `?s=` (en lugar de generar uno nuevo) — sustituye la X del chip que en mobile no se muestra. Tooltip dinámico: "Toca para desligarte · mantén para opciones".

Implementado con Pointer Events (`onPointerDown/Up/Cancel/Leave`) para unificar mouse y touch sin el doble disparo que ocasionaba en mobile cuando `touchend` se traducía a `mousedown` sintético. Sin `disabled` durante `generating` (los buttons disabled no emiten pointer events, lo que mataría el long press) — en su lugar `cursor-wait` + `opacity-80` + `aria-busy`.

#### `useShareDirtiness.markPending()`

Nuevo método para el `<ShareActiveChip>`: setea `settledRef = false` + `setIsDirty(false)`. Necesario antes del re-apply porque cuando el deserialize dispara state changes (`setActiveLayerIds`, `setFilters`, etc.), el effect del dirtiness tracker compara las nuevas refs contra las anteriores y marca `isDirty = true`. Con `markPending`, el primer effect después del re-apply ve `settledRef = false`, hace `settle` y `return` sin marcar dirty.

#### Fix: race condition del share fetch en `useInitializeFromUrl`

Bug que se manifestaba como "el link compartido a veces no aplica las capas":

1. Mount → `useEffect` ve `?s=`, marca `initialized.current = true`, lanza fetch async.
2. En paralelo, `useMunicipioMode.loadList()` (precarga 125 municipios desde `/municipios/list`) cambia la referencia del `municipioContext`.
3. Re-render → `useInitializeFromUrl` se re-ejecuta (porque `municipioMode` es dep).
4. **Cleanup function corre primero**: `abortRef.cancelled = true`.
5. El fetch a `/shares/<id>` termina, el async hace `if (abortRef.cancelled) return;` — **sale sin llamar `deserialize`**. Las capas se pierden.

Fix con dos refs:

```js
const initialized = useRef(false);       // ya terminó el flujo
const shareFetchStarted = useRef(false); // ya hay fetch en vuelo (persistente entre re-renders)

if (shareFetchStarted.current) return;
shareFetchStarted.current = true;
(async () => {
    const envelope = await fetchShare(shareId);
    if (envelope) {
        const applied = deserialize(envelope);
        if (applied) {
            initialized.current = true;  // marcar AL FINAL, no al inicio
            ...
        }
    }
    initialized.current = true;
})();
return; // sin cleanup que cancele el fetch en vuelo
```

#### Fix: `mapRef.current` null en mobile cuando deserialize aplica el view

Bug que se manifestaba como "en mobile el link abre las capas correctas pero el mapa NO está centrado". En mobile `<MapView>` tarda más en montar que en desktop, así que cuando `deserialize` llega a `payload.view`, `mapRef.current` aún es `null`. Las capas se aplican (son state del context), pero `setCenter/setZoom/setRotation` no se ejecutan.

Fix: nuevo helper `scheduleViewApply(mapRef, view)` en `useShareDeserializer.js`:

```js
const applyOnce = () => {
    const map = mapRef?.current;
    if (!map) return false;
    // setCenter, setZoom, setRotation
    return true;
};
if (applyOnce()) return;
let attempts = 0;
const intervalId = setInterval(() => {
    attempts++;
    if (applyOnce() || attempts >= 60) clearInterval(intervalId);
}, 100);
```

Intenta aplicar el view inmediatamente; si `mapRef.current` aún es `null`, hace polling cada 100ms hasta 60 intentos (6s timeout) — apenas el ref se asigna, aplica el view y limpia el interval. Aplicado en ambos paths: `payload.view` (single) y `shared.view` (swipe).

#### Piezas

| Archivo | Rol |
|---|---|
| `frontend/src/pages/maps/components/ShareActiveChip.jsx` | Nuevo — chip flotante con label + recargar + X |
| `frontend/src/pages/maps/components/ShareButton.jsx` | Quick share + clipboard + long press + mobile clear |
| `frontend/src/pages/maps/components/MapToolsPanel.jsx` | Integración del chip en el flex row del panel |
| `frontend/src/pages/maps/hooks/useShareDirtiness.js` | Nuevo `markPending` |
| `frontend/src/pages/maps/hooks/useInitializeFromUrl.js` | Fix race condition con `shareFetchStarted` |
| `frontend/src/pages/maps/hooks/useShareDeserializer.js` | `scheduleViewApply` con retry |

---

## [1.57.2] - 2026-05-29

### Documentación: `context.md` actualizado para reflejar el botón compartir evento, fix de autoOpen y alt-query resistente

Solo documentación. Tres bloques actualizados en `docs/context.md` para reflejar el estado real del código tras los commits `6bc7c14` (v1.56.0) y `77692af` (v1.57.1):

- **`<EventoActionsBar>`**: removido el texto sobre el badge "beta" y `border-orange` de non-prod, ya no aplica. Layout final documentado: `[Switch] | ml-auto | [Centrar] [Compartir] [FunButton]`. Añadido párrafo sobre el botón **Compartir evento** con URL permanente `?evento=<slug>`, fallback a `window.prompt`, telemetría `evento_share`, y explicación de cuándo usar este botón vs el `<ShareButton>` general.
- **`useAutoOpenEventoFromUrl`**: clarificado que el hook setea `'ext-evento-${match.id}'` (no `'evento-${id}'` como antes), y describe la cadena de propagación `MapSider → ExternalEventoWidget → ExternalEventoItem → MenuItem` para que el `===` del MenuItem matchee. Mención del path alternativo `createEventoItems` gated por `SIDER_EVENTS_ENABLED=false`.
- **Sección nueva "Alt-query del InfoBox"**: documenta la separación entre `queryWMSGetFeatureInfo` (request individual) y `getFeatureInfoForActiveLayers` (orquestador con fallback per-capa), incluyendo el caso real del workspace FIFA que disparó el fix.

---

## [1.57.1] - 2026-05-29

### Fix: alt-query de InfoBox resistente a CQL filters rotos en el batch

El "InfoBox de no-info" del mapa muestra **alternativas** cuando la capa seleccionada no tiene features en el punto clickeado — consulta las demás capas activas y propone las que sí tienen datos ahí. En el escenario del evento FIFA esto fallaba: el InfoBox solo decía "No hay datos de ninguna capa activa en este punto" aunque visualmente hubiera features de otras capas del evento justo en el punto del click.

#### Diagnóstico

La alt-query de `getFeatureInfoForActiveLayers` agrupa todas las capas que comparten `baseUrl` en una **sola petición WMS GetFeatureInfo** con `LAYERS=a,b,c,...&CQL_FILTER=f1;f2;f3;...` (semi-separados, una entrada por capa). Una de las capas del workspace del evento (~18 capas batched) tiene en GeoServer una SQL view que referencia una columna `latitud` que no existe en la tabla subyacente. Cuando GeoServer renderiza el batch:

```xml
<ServiceException code="internalError">
  Rendering process failed. Layers: elementos, puntos_fan_fest, eventos, ...
  org.postgresql.util.PSQLException: ERROR: column "latitud" does not exist
  Position: 114
</ServiceException>
```

Una capa rota tumba **toda** la respuesta del batch. `parseResponse` ve content-type XML (no JSON) → retorna `null` → `getFeatureInfoForActiveLayers` filtra ese `null` del array de promises → resultado neto: 0 features para el batch entero → `alternativeLayers = []` → InfoBox sin alternativas.

#### Fix

Extraje la lógica del request a `queryWMSGetFeatureInfo(baseUrl, layerGroups, ...)` y modifiqué `getFeatureInfoForActiveLayers`:

1. **Intenta el batch primero** (misma optimización: una sola petición por baseUrl).
2. **Si el batch retorna `null` Y hay >1 capa**, reintenta **cada capa individualmente** (`Promise.all` de queries de 1 capa cada una).
3. Las capas que sí funcionan retornan sus features normalmente; la(s) rota(s) retornan `null` y se filtran.

Resultado: una capa con CQL roto (o SQL view rota en GeoServer, o cualquier otro error server-side) ya no envenena las alternativas para las demás. El usuario ve las alternativas válidas correctamente.

Costo: en el caso del fallo se ejecutan N peticiones extras (una por capa), pero solo cuando el batch falla. Caso happy-path (batch OK) no cambia.

#### Acción pendiente fuera de mapalab

El filtro `latitud` no está ni en `mapalab.layers` (DB) ni en el frontend ni en las definiciones de capas — vive en GeoServer directamente (probablemente una SQL view del workspace del evento mal configurada). Con este fix aplicado, en DevTools ahora se ven N peticiones GetFeatureInfo individuales al hacer click — la(s) que devuelvan `ServiceException` con `column "latitud" does not exist` identifican la capa rota a corregir en GeoServer.

---

## [1.57.0] - 2026-05-28

### Banner del home: fondo configurable desde mariachi (imagen mobile/desktop + gradient editable)

El banner del home (`pages/home/components/Header.jsx`) solo permitía cambiar el mockup ilustrativo y el texto desde mariachi; el fondo estaba fijo al gradiente morado IIEG (`#5C2472` → `#963CBA` 359°) hardcodeado en el componente, con una variante extra de alpha `0.9` para mobile. Ahora cada item del banner consume del API de mariachi (v1.20.0) 5 campos opcionales nuevos para personalizar el fondo y el gradiente, con comportamiento condicional por breakpoint para no recortar feo en pantallas chicas.

#### Campos consumidos del API mariachi `/api/mapalab/home`

- `imagenUrlMobile` — imagen de fondo en mobile (`<768px`).
- `imagenUrlDesktop` — imagen de fondo full-width en tablet/desktop.
- `gradientFrom`, `gradientTo`, `gradientAngle` — colores hex y dirección del gradiente cuando no hay imagen.
- `imagenUrl` (legacy) — sigue siendo el mockup flotante a la derecha en desktop y el fondo en tablet cuando no hay `imagenUrlDesktop`.

#### Lógica de los 3 estilos

- `banners.map` ahora propaga `mobileBgUrl`, `desktopBgUrl` y un objeto `gradient` con merge contra el fallback de `bannerConfig.js` (`api.gradientFrom || fallback.gradient.from`, etc.). El `image.src` deja de hacer fallback al bundled — queda vacío si la API no manda `imagenUrl`.
- `mobileStyle`/`tableStyle`/`desktopStyle` con la misma forma: **si hay imagen → `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(bg)` con `cover, cover`** (scrim oscuro fijo para legibilidad del texto blanco encima, independiente del gradient editable). Si no hay imagen → `linear-gradient(angle, from, to)` con el `activeBanner.gradient` editable.
- `tableStyle` mantiene un nivel intermedio: si no hay `desktopBgUrl`, cae al comportamiento legacy donde `imagenUrl` (mockup) se usaba como fondo con el gradient como overlay (`E6` alpha). Preserva el seed actual del banner sin cambios.
- El `mobileStyle` que tenía colores hardcoded `rgba(92,36,114,0.9)` / `rgba(150,60,186,0.9)` con ángulo `359deg` fijo ahora usa `activeBanner.gradient` igual que desktop. Los 3 breakpoints respetan el override del editor.

#### Mockup flotante de desktop ahora es opcional

El `<img>` flotante a la derecha en desktop (`hidden xl:block w-[35vw] ...`) ahora se renderiza solo si `mockupSrc` (que viene de `api.imagenUrl`) no está vacío:

```jsx
{mockupSrc && (
    <div className="hidden xl:block w-[35vw] absolute right-0 ...">
        <img src={mockupSrc} alt={activeBanner.image.alt} ... />
    </div>
)}
```

Antes siempre se renderizaba haciendo fallback a `bannerHeader.webp` bundled. Ahora si el editor del CMS deja vacío "Mockup/ilustración", el banner desktop queda sin el ilustrativo y la sección de texto/CTA respira más.

#### Matriz de comportamiento resultante

| Caso | Mobile | Tablet | Desktop |
|---|---|---|---|
| Sin nada configurado | Gradient editado o morado IIEG | Mockup `imagenUrl` como bg + gradient overlay (legacy) | Gradient + mockup flotante |
| Solo `gradientFrom`/`To`/`Angle` editados | Gradient custom | Igual (legacy) | Gradient custom |
| Solo `imagenUrlMobile` | Imagen + scrim oscuro | Legacy o gradient | Gradient |
| Solo `imagenUrlDesktop` | Gradient | Imagen + scrim | Imagen + scrim |
| Todo | Imagen mobile + scrim | Imagen desktop + scrim | Imagen desktop + scrim + mockup flotante encima |

Sin cambios en otras secciones del home ni en el polling de cache-version. Lado mariachi: v1.20.0 (schema + editor). Detalle completo en `mariachi/docs/CHANGELOG.md` §[1.20.0].

---

## [1.56.0] - 2026-05-28

### Compartir evento con URL permanente + limpieza del action bar + URL clean-up al borrar capas

Cuatro cambios relacionados que cierran el flujo "abrir un evento desde un enlace y volver al estado base limpiamente".

#### Botón nuevo "compartir evento" en `EventoActionsBar`

Antes el usuario solo podía compartir con el `ShareButton` general, que crea un share nuevo en DB cada vez (hash nuevo, TTL 30 días). Para eventos curados desde mariachi tiene más sentido un enlace **permanente y estable**: el mismo URL siempre apunta al mismo evento, sin tocar DB.

- Botón con ícono `copie` junto a centrar + fun fact. Copia `/mapa?evento=<slug>` al clipboard usando `slugifyTitulo(evento.titulo) || evento.id`.
- Feedback visual: fondo verde `#DCFCE7` + ícono `shared_click` durante 2.5s.
- Fallback `window.prompt` si `clipboard.writeText` falla (sin permiso).
- Telemetría nueva `trackEventoShare(eventoId, status)` → push `evento_share` con `status` (`copied` / `prompt`).

El share normal (`?s=<hash>`) sigue siendo correcto cuando el usuario customiza el mapa. El share de evento es solo para el "estado base" del evento configurado en mariachi.

#### Limpieza del `EventoActionsBar` (quitar todo lo de beta)

Removido del bar:
- `<Badge text="beta">` al inicio.
- Border naranja del container.
- `<ReportButton>` final + telemetría `trackEventoReport` ya no se usa.
- Constante `IS_NON_PROD` y los gates asociados.

Container queda con `border border-transparent bg-[#F9FBFF]` (el estilo que antes era solo de producción). Layout final: `[Switch "Solo este evento"]   [Centrar] [Compartir] [FunButton]`.

#### Fix: el URL `?evento=` no abría el panel ni autoactivaba capas

Dos bugs encadenados:

1. **`useAutoOpenEventoFromUrl`** seteaba `autoOpenMenuId = 'evento-${match.id}'`, pero los eventos hoy se renderizan vía `ExternalEventoWidget` con item.id `'ext-evento-${evento.id}'` (el prefijo `ext-` los disambigua del path alternativo `createEventoItems`, gated por `SIDER_EVENTS_ENABLED=false`). `MenuItem` compara con `===` → nunca matcheaba. **Fix**: el hook ahora setea `'ext-evento-${match.id}'`.

2. **`ExternalEventoItem`** pasaba `autoOpenMenuId={null}` y `clearAutoOpenMenu={() => {}}` hardcodeados a su `<MenuItem>`. Aunque el hook escribía en el estado del `MapSider`, nunca llegaba a este árbol. **Fix**: nueva cadena `MapSider` → `ExternalEventoWidget` → `ExternalEventoItem` → `MenuItem` propagando ambos props.

Con ambos fixes, `/mapa?evento=<slug>` ahora: (1) matchea por slug/id/título, (2) abre el panel del evento, (3) `EventoMenu` monta y dispara su efecto de auto-activación que prende todas las capas con `autoActivar !== false`, (4) centra el mapa en el `bbox` si no había ya capas del evento activas.

#### Limpieza de URL al borrar todas las capas activas

En `handleRemoveAll` del panel de capas activas, tras desactivar capas y resetear simbología ahora llama `setSearchParams({}, { replace: true })` — limpia toda la query string. Antes, si el usuario llegaba por `/mapa?evento=X` y borraba todas, el URL seguía con `?evento=X` y un refresh reactivaba todo. Aplica también a `?s=`, `?filter_*`, etc. — borrar todas las capas es conceptualmente "reset total". `replace: true` evita meter una entrada nueva al history.

---

## [1.55.0] - 2026-05-28

### Corregido: el basemap ya no parpadea (flash blanco) al cruzar zoom 15

Los basemaps Carto (Voyager y Light) tenían `labelZoomThreshold: 15` y al cruzar ese zoom, `useBaseMapManager` hacía `setSource(otraURL)` reemplazando el source completo del basemap. Eso invalidaba TODAS las tiles cacheadas mientras descargaba el nuevo source (la versión con labels), causando un flash blanco visible cada vez que el usuario cruzaba zoom 15 en cualquier dirección.

#### Solución: overlay de labels en capa separada

Se separó el basemap en dos `TileLayer` independientes:

- **Basemap principal** (`zIndex: -1`): siempre usa la URL `_nolabels`. Su source se carga UNA vez al inicializar y solo cambia cuando el usuario elige otro basemap desde el panel (Voyager ↔ Light ↔ Sin Mapa). En navegación normal nunca se invalida → cero flash.
- **Labels overlay** (`zIndex: 9000`): segundo `TileLayer` con la URL `_only_labels` correspondiente al basemap activo. En vez de `setSource()` en cada cambio de zoom, ahora se hace `setVisible(true/false)` según se cruce el threshold. Las tiles del overlay también permanecen cacheadas entre cambios.

#### Que cambió

- **`frontend/src/pages/maps/helpers/basemaps.js`**: helper interno `cartoSource(path)` para deduplicar configuración común. `create()` siempre devuelve la versión `_nolabels` (sin parámetro `withLabels`). Nueva función `createLabelsOverlay()` por basemap que devuelve el source `_only_labels` (Voyager: `rastertiles/voyager_only_labels`, Light: `light_only_labels`). El basemap "Sin Mapa Base" no expone `createLabelsOverlay` — el overlay queda oculto.
- **`frontend/src/pages/maps/hooks/useMapInitialization.js`**: el `OLMap` se inicializa con DOS layers en vez de uno. Nuevo parámetro `labelsOverlayRef` que se popula con `map.getLayers().item(1)`. El overlay arranca con `visible: false`.
- **`frontend/src/pages/maps/hooks/useBaseMapManager.js`**: refactor. El effect que escucha `moveend` ya no reemplaza el source del basemap; solo hace `setVisible()` sobre el overlay. El effect que reacciona a cambio de `baseMapId` ahora actualiza también el source del overlay si el nuevo basemap soporta labels.
- **`frontend/src/pages/maps/components/MapView.jsx`**: crea `labelsOverlayRef` y lo pasa a `useMapInitialization` y `useBaseMapManager`.

---

## [1.54.2] - 2026-05-28

### Estilo: botón Descargar respeta el estado colapsado del MapToolsPanel + MunicipioFilter flexible

Pulir el layout del row de herramientas cuando el panel está colapsado (icon-only) vs expandido.

#### Cambiado

- **`Download.jsx`**: acepta nuevo prop `collapsed` (default `false`) propagado desde `MapToolsPanel` (`isCollapsed` del localStorage `mapalab.tools.collapsed`). Cuando `collapsed || isMobile` el botón rinde solo el ícono `download` con ancho `w-12.5`; en estado expandido pasa de `md:w-[235px]` a `md:w-30` y el label se acorta de "Descargar visualización" a "Descargar" para encajar.
- **`MunicipioFilterButton.jsx`**: el wrapper externo dejaba de ocupar todo el ancho en estado expandido, lo que hacía que los hijos `showLabel` se truncaran de forma inconsistente. Ahora alterna entre `flex-1 min-w-0` (modo label) y sin clases extras (modo icon) para que el botón crezca hasta el ancho disponible sin desbordar.
- **`LayerItem.jsx`**: limpieza de trailing space en el className concatenado (no afecta render).

---

## [1.54.1] - 2026-05-28

### Corregido: el tab "Insertar" del panel Compartir ya no aparece en producción

`SharePanel.jsx` exponía dos tabs ("Enlace" e "Insertar") en todos los ambientes. La pestaña Insertar todavía está marcada como BETA (Web Component embebible) y el endpoint del backend para servir el bundle aún no está habilitado en producción, así que pulsarla en prod no funcionaba.

Cambio: `IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV)`. El `<div role="tablist">` con los dos botones de tab y el contenido de `tab === 'embed'` se renderizan solo si `IS_NON_PROD`. En producción se ve directamente el contenido del tab Enlace sin la franja de tabs encima.

---

## [1.54.0] - 2026-05-28

### InfoBox y leyenda de descarga: nombres heredan alias del grupo padre vía EventoContext

Capas que viven dentro de un evento (`EventoContext.getAliasByLayerId`) ya tenían alias propio en el árbol; sin embargo el InfoBox y la sección de leyendas del PDF/PNG seguían mostrando el `layer.label` literal. Ahora ambos consumen `resolveLayerDisplayName(layerId, fallback, ancestor, getAliasByLayerId)` con la misma cascada (alias del evento > label del grupo padre > label propio).

#### Cambiado

- **`useFeatureInfo.js`**:
  - Consume `useEventoContext().getAliasByLayerId` y lo pasa a `resolveLayerDisplayName` para resolver `queriedLayerName` del feature seleccionado y también el `groupName` de cada alternativa cuando se agrupan resultados por `parentGroup`.
  - Fallback ordenado al armar `queriedLayerName`: `selectedLayerForSymbology.name || .label || layerNode?.label` antes de pasar por `resolveLayerDisplayName`.
  - `selectAlternativeLayer` ahora prioriza `layer.name` sobre `layerNode.label` para que el alias del backend gane cuando viene presente.
- **`useMapDownload.js → layersWithLegends`**:
  - Para cada leyenda candidata busca `ancestor = findParentGroup(layer.id, allLayers)`. Si dos leyendas comparten ancestro las deduplica (`Set seenAncestors`), evitando duplicar la entrada de un grupo entero en el PDF cuando hay varios hijos activos.
  - El `label` final pasa por `resolveLayerDisplayName(layer.id, layer.label, ancestor, getAliasByLayerId)` antes de incluirlo en `result`.

---

## [1.53.0] - 2026-05-28

### Home: carrusel de banners destacados con autoplay y paginación

`Header.jsx` rotaba un único banner activo. Cuando mariachi marca varios `home.banner.items` con `activo=true`, ahora se rotan automáticamente cada 5s con pausa al hover y un row de dots como navegación manual.

#### Agregado

- **`Header.jsx`**:
  - `banners` (useMemo) ahora devuelve la lista completa de banners activos con título (en vez de solo el primero). Si no hay ninguno desde la API, retorna `[fallback]` con `bannerConfig` local. Cada item incluye el shape esperado por el render (imagen, contenido, CTA).
  - `currentIndex` con `useState` + `setInterval` de `BANNER_ROTATION_MS = 5000` que cicla `(prev + 1) % banners.length`. Se desmonta el timer en cleanup y no se arma si solo hay 1 banner o el hover está activo.
  - `isPaused` se setea con `onMouseEnter`/`onMouseLeave` del `<header>` para no rotar mientras el usuario lee el contenido.
  - `useEffect` extra resetea `currentIndex` a 0 cuando la lista de banners cambia y el índice queda fuera de rango (caso: pasar de 3 a 2 banners activos en runtime).
- **Dots de paginación** (solo cuando hay 2+ banners): row con `role="tablist"`/`role="tab"` y `aria-selected`. El dot activo es naranja (`bg-orange`) y se expande a `w-6 h-2.5`; los inactivos son crema (`bg-[#FFE4C4]`) `w-2.5 h-2.5` con hover `bg-[#FFC98A]`. Posicionado `bottom-[calc(5vh)] 2xl:bottom-[calc(15vh)]` centrado.

---

## [1.52.0] - 2026-05-28

### Metadata: soporte para múltiples fuentes y metodologías por capa

Algunas capas declaran más de una fuente original (varios institutos) o más de una metodología (calculo + recolección). Hasta `1.51.0` el backend exponía solo la primera; el modal de detalle solo renderizaba un bloque. Ahora ambas dimensiones se modelan como arrays con render apilado.

#### Backend (`1.32.0`)

- **`backend/app/schemas/metadata.py`**: nuevos `FuenteItem` (`corto`, `largo`, `enlace`, `enlace_label`) y `MetodologiaItem` (`texto`, `archivo_enlace`). `MetadataResponse` agrega `fuentes: list[FuenteItem] | None` y `metodologia: list[MetodologiaItem] | None`.
- **`backend/app/services/layer_metadata_service.py`**:
  - Helper `_to_list_of_dicts(value)` normaliza el JSON guardado en DB (acepta dict legacy, lista de dicts o `None`) descartando entries cuyo único contenido sean strings vacíos.
  - `get_metadata_response` mantiene los campos flat legacy (`fuentes_texto_corto/largo/enlace`, `metodologia_texto/archivo_enlace`) apuntando al **primer** item de cada lista para no romper consumers viejos, y agrega los nuevos arrays `fuentes`/`metodologia`.
  - `get_sources_batch` también consume `_to_list_of_dicts` para evitar AttributeError si el row trae lista en vez de dict.

#### Frontend (`1.52.0`)

- **`LayerInfoSections.jsx`**:
  - Nuevos normalizers `normalizeFuentes(metadata)` y `normalizeMetodologia(metadata)` que prefieren los arrays nuevos del backend pero hacen fallback a los flat fields (split de `fuentes_enlace` por comas se conserva como caso especial). Mantiene compatibilidad con respuestas mientras DataEngine migra todos los registros al formato lista.
  - Render apilado con `flex flex-col gap-3` entre items. Título se pluraliza automáticamente: "Fuente"/"Metodología" cuando hay 1, "Fuentes"/"Metodologías" cuando hay 2+.
  - Cada fuente puede traer su propio `enlace_label` (configurable desde mariachi); fallback a `corto`, luego a `"Ver fuente"` / `"Fuente N"`. Metodologías múltiples usan `"Ver documento N"`.

---

## [backend 1.31.0] - 2026-05-28

### Descarga de CSV: cache en Acervo con redirect a presigned URL + streaming asíncrono

El endpoint `/download/{workspace}/{layer}` migra de `psycopg2.copy_expert` (síncrono con pipe entre hilos) a `asyncpg.copy_from_query` sobre un pool dedicado, y añade una capa de cache servida directamente desde Acervo (S3-compatible).

#### Agregado

- **`backend/app/databases/async_pool.py`** (nuevo): pool global `asyncpg` con `ssl='require'`, `min_size=1`, `max_size=max(DB_POOL_SIZE, 4)` y `command_timeout=600`. La función `get_pool()` es lazy y la cierra `close_pool()` durante shutdown.
- **`backend/app/services/acervo_client.py`** (nuevo): cliente `boto3` S3 lazy contra `ACERVO_PUBLIC_ENDPOINT or ACERVO_ENDPOINT` con `signature_version='s3v4'`. Expone `presign_get(object_key, ttl_seconds=None)` que retorna `None` si faltan credenciales (degrada a generar el CSV en vivo).
- **`backend/app/repositories/download_repository.py → find_fresh_cache`**: busca en `mapalab.layer_downloads` un `object_key` para `layer_key` cuyo `generated_at >= now() - ttl_hours`. Retorna `None` si no hay registro fresco.
- **`backend/app/routers/download.py`**: cuando la request no trae `date_from`/`date_to` (full dump) consulta `find_fresh_cache` con `DOWNLOAD_CACHE_TTL_HOURS`. Si hay hit y se puede firmar, responde `307 Redirect` a la presigned URL — el cliente baja el archivo directamente de Acervo. Cuando hay date filter siempre genera en vivo.

#### Cambiado

- **`stream_csv`** ahora es `async` y consume `asyncpg.Pool` en vez de `Session`. Internamente usa `Queue` con `maxsize=16` chunks para backpressure: un task productor llama `copy_from_query(query, *params, output=writer, format='csv', header=True)` y el generador async consume. Pasa `asyncpg.CancelledError` y excepciones por la cola con sentinel para terminar limpio en client disconnect.
- **`_build_select`**: construye el SELECT con identificadores quoteados y filtros `WHERE fecha >= $1 AND fecha <= $2` parametrizados (`date.fromisoformat`). Antes se usaba `psycopg2.sql.Literal`.
- **Variables nuevas en `config.py` y `docker-compose.yml`**: `ACERVO_ENDPOINT`, `ACERVO_PUBLIC_ENDPOINT`, `ACERVO_ACCESS_KEY`, `ACERVO_SECRET_KEY`, `ACERVO_BUCKET` (default `mapalab`), `ACERVO_PRESIGN_TTL_SECONDS` (default 3600), `DOWNLOAD_CACHE_TTL_HOURS` (default 36).

#### Por qué

El streaming sync con `os.pipe()` + thread bloqueaba un worker Gunicorn entero por toda la duración del COPY (capas grandes ~minutos). Con `asyncpg` el worker queda libre para atender otras requests mientras Postgres bombea. Adicionalmente, el cache en Acervo evita regenerar el CSV en cada hit: una vez que el job nocturno (no incluido aquí) deja el objeto en S3 con su `layer_downloads.generated_at`, el endpoint responde `307` inmediato y el byte stream lo sirve Acervo (no FastAPI).

---

## [1.51.0] - 2026-05-26

### Vista por municipio: restringir interacciones fuera del polígono + botón "Centrar selección"

Dos mejoras de UX al modo Vista por municipio (mapalab 1.50.0):

#### Agregado: bloqueo silencioso de interacciones fuera del municipio

Cuando hay un municipio/región/ZMG seleccionado, las acciones del mapa que caigan fuera del polígono se ignoran sin feedback visual:

- **Click para InfoBox**: si el click cae fuera del polígono unión de los seleccionados, `useMapInteractions` aborta antes de llamar `queryFeatures`. El InfoBox no se abre.
- **Selección por polígono dibujado**: si ningún vértice del polígono dibujado cae dentro de algún municipio, `handlePolygonComplete` en `MapsProvider` retorna sin ejecutar `queryFeaturesInPolygonRef`.

Implementación:
- **`useMunicipioMode.js`**: dos nuevos helpers expuestos en el return:
  - `isInsideMunicipios(coord)`: itera `geometries` y devuelve `true` si la coordenada cae dentro de algún polígono de municipio. Si el modo no está activo, devuelve `true` (sin restricción).
  - `polygonIntersectsMunicipios(olGeometry)`: verifica si algún vértice del outer ring del polígono dibujado cae dentro de algún municipio. Heurística rápida (no usa intersección exacta polígono-polígono); suficiente para 99% de los casos reales.
- **`useMapInteractions.js`**: nuevo parámetro opcional `isClickAllowed` (callback). Guarda en ref y consulta antes de `queryFeatures`. Si retorna `false`, aborta silenciosamente.
- **`MapView.jsx`**: pasa `ctx.municipioMode?.isInsideMunicipios` como `isClickAllowed` a `useMapInteractions`.
- **`MapsProvider.jsx`**: `handlePolygonComplete` consulta `polygonIntersectsMunicipios` vía `municipioModeRef` (necesario porque `handlePolygonComplete` se declara antes que `municipioMode`).

#### Agregado: botón "Centrar selección" (chip flotante + panel del filtro)

Para volver a la vista del municipio después de hacer pan/zoom sin perder la selección:

- **`useMunicipioFit.js`** (nuevo): hook que encapsula la lógica del fit automático (`useEffect` cuando cambia `selected`) + la función `centerOnSelection()` callable manualmente. Extraído de `MapsProvider` que excedía el límite de 300 líneas.
- **`MapsProvider.jsx`**: usa `useMunicipioFit(...)` y extiende `municipioMode` con `centerOnSelection: centerOnMunicipioSelection` en el value del context, exponiendo la función a cualquier consumer.
- **`MunicipioActiveChip.jsx`** (chip flotante top-center, solo desktop): nuevo botón entre la label y la X. Mismo tamaño que el botón X (`size-10`, `rounded-full`) pero color azul claro (`bg-white`, `hover:border-purple`) para diferenciarlo del rojo de cerrar. Usa los íconos `fit_extent_normal/hover` ya existentes en `externalIcons`.
- **`MunicipioFilterPanel.jsx`** (panel del filtro, disponible en mobile): botón "Centrar selección" a la izquierda del "Salir del modo". Texto morado para diferenciarlo. Margen reducido (`mt-3` → `mt-1`) para que la sección no se sienta tan separada del input de búsqueda.

Esta dualidad chip+panel cubre desktop (chip flotante) y mobile (panel del filtro), ya que el chip está oculto con `hidden md:flex`.

#### Cambios complementarios

- **`MapToolsPanel.jsx`**: ancho del panel cambió de `md:w-[373px]` fijo a `md:w-full max-w-[373px]` para mejor adaptación en breakpoints intermedios.

---

## [1.50.1] - 2026-05-26

### Corregido: el mapa base ya no se ve en blanco al usar "Centrar selección" sobre un feature tipo punto

Bug introducido en `1.47.0` con el botón "Centrar grupo" del `ActionsToolbar`. El handler `centerOnResults` hacía `view.fit(extent, { maxZoom: 18 })`. Cuando el feature es un único punto (`extent = [x, y, x, y]` con `width = height = 0`), `fit` llevaba al zoom máximo permitido (18). En ese nivel algunos basemaps no tienen tiles disponibles y el visor se veía completamente blanco como si el basemap se hubiera borrado.

Solución en `helpers/featureGeometry.js → centerOnResults`:
- Detecta si el extent es "tipo punto" (`width < 1 && height < 1` en metros de Web Mercator).
- **Punto**: usa `view.animate({ center, zoom: Math.max(currentZoom, 15) })` — preserva el zoom actual si ya estaba acercado, o sube a 15 (límite seguro con tiles en todos los basemaps).
- **Polígono/línea**: sigue usando `view.fit` pero con `maxZoom: 16` (antes 18). Más conservador.

#### Que cambio

- **`frontend/src/pages/maps/helpers/featureGeometry.js`**: `centerOnResults` detecta extent degenerado y conmuta entre `animate` y `fit` con `maxZoom` reducido.

---

## [1.50.0] - 2026-05-26

### Vista por municipio: filtrado CQL por capa con metadata configurable + UI inteligente

Evolución mayor del modo "Vista por municipio". Antes era puramente visual (máscara + zoom); ahora también inyecta filtros CQL por capa, reduciendo el dataset que GeoServer renderiza y permitiendo cache HTTP compartido entre usuarios viendo el mismo municipio.

#### Backend (`1.30.0`)

- **Migration alembic `0017_layer_municipio_field_type`** en dataengine: agrega `mapalab.layers.municipio_field_type varchar(20)` (`clave` | `nombre`). Aplicada vía `ALTER TABLE` directo.
- **`backend/app/services/layer_tree_service.py`**:
  - Nueva función `_inherit_municipio_meta` propaga `searchMeta.hasMunicipio + municipioField + municipioFieldType` desde ancestros hacia descendientes que no tengan su propia configuración. Permite configurar una sola vez en un `group` (ej. `establecimientos_salud`) y se aplica a todas las propiedades hijas (`cruz_roja_1`, etc.).
  - `_layer_to_search_meta` ahora incluye `municipioFieldType`.
- **`backend/app/repositories/municipios_repository.py`**: nueva función `get_union_bbox(claves, source)` que devuelve `[xmin, ymin, xmax, ymax]` en EPSG:6368 para el BBOX fallback.
- **`backend/app/routers/municipios.py`**: endpoint `/municipios/geometries` agrega `unionBbox` a la respuesta.
- **`backend/app/models/layer.py`**: nueva columna `municipio_field_type`.

#### Frontend (`1.50.0`)

- **`useMunicipioMode.js`**:
  - Expone `municipioContext: {active, claves, nombres, bbox, listLoading, allMunicipiosCount}` con datos crudos en vez de un CQL pre-construido.
  - Pre-carga `allMunicipios` al montar (sin esperar a activación) para que los nombres estén listos cuando el usuario active el modo.
  - Fix label `null` al recargar: `scopeLabel` ahora devuelve `'Municipios'` / `'Región'` cuando `scope.value` viene null en lugar de `String(null)='null'`.
  - Eliminado código muerto: `globalIntersectsCql`, `buildSpatialCql`, `DEFAULT_GEOM_FIELD`.
- **`useWMSLayerManager.js` + `useWMSFilterUpdater.js`**: ya no reciben `globalCqlFilter` (string); reciben `municipioContext` (objeto). Por cada wmsLayer, llaman `buildLayerMunicipioCql(searchMeta, ctx, layerId)` que decide:
  - Si capa tiene `hasMunicipio + municipioField`: genera `<field> IN ('14039',…)` o `<field> IN ('Guadalajara',…)` según `municipioFieldType`
  - Si no: fallback a `BBOX(geom, …)`
  - Si workspace es raster (`raster`, `lluvia`, `temperatura`): sin filtro espacial
- **`helpers/municipioCqlBuilder.js`** (nuevo): helper compartido con `warnOnce()` que avisa en consola cuando una capa no resuelve nombres (con sample de claves + count de allMunicipios para diagnóstico).
- **`useMunicipioMask.js`**: máscara cambió de `rgba(0,0,0,0.4)` (oscurece) a `rgba(0,0,0,0.85)` (tapa features fuera del polígono real para reforzar el foco visual).
- **`MapToolsPanel.jsx`**:
  - Ancho fijo del panel = `SIDER_EXPANDED_WIDTH` (340px) para coincidir visualmente con el sider izquierdo.
  - Botones internos `Download` y `MunicipioFilterButton` con `flex-1` reparten el espacio sobrante equitativamente.
  - Botón colapsar movido a flotante (`-mr-5`) fuera del panel, centrado vertical con `items-center` del flex parent; usa el nuevo `FloatingIconButton`.
  - Eliminado código muerto: `EXPANDED_WIDTH`, `COLLAPSED_WIDTH`, `shareLoadedOffset`.
- **`components/FloatingIconButton.jsx`** (nuevo): componente shared reutilizado por `SiderModeButton` y `MapToolsPanel` para botones con ícono + tooltip flotante.
- **`SiderModeButton.jsx`**: refactor para usar `FloatingIconButton`.
- **`Panel.jsx`**: soporta `position="static"` (no antepone `absolute`/`fixed`); usado por `MapToolsPanel` para que el panel viva dentro de un flex en lugar de fixed independiente.
- **`MunicipioFilterButton.jsx`**: label `null` al recargar fixed (`scope.value || 'Región'`).
- **`MapsProvider.jsx`**: fix del fit automático del zoom — ahora compara `selected` vs `geometries[].clave` antes de hacer fit. Antes hacía fit con geometrías antiguas y nunca alcanzaba las nuevas porque el `key` (basado en `selected`) ya estaba marcado como fitted.

#### Configuración inicial (vía SQL)

Tres capas configuradas como caso real:
- `salud:unidades_salud` → `municipio_field='municipio'`, type `nombre` (33 sub-capas)
- `educacion:centros_educativos` → `municipio_field='municipio'`, type `nombre` (8 sub-capas)
- `recursos:uso_de_suelo_serie_7` → `municipio_field='cvegeo'`, type `clave` (8 sub-capas)

Resto sigue con BBOX fallback. Las nuevas se configuran en mariachi UI.

#### Docs

- **`docs/municipio-mode.md`**: reescrito completo (estaba desactualizado, decía "sin filtros CQL"). Documenta los 3 mecanismos combinados (CQL por capa + BBOX fallback + máscara), arquitectura, configuración por capa, herencia, inventario actual, hotfix de controlflow.
- **`docs/planes/PLAN_CLAVE_MUNICIPIO_EN_TABLAS.md`** (nuevo): plan a futuro para estandarizar todas las tablas relevantes con columna `clave_municipio` indexada.

---

## [1.49.2] - 2026-05-26

### UX: panel de compartir homologado al patrón de los demás paneles del visor

Reemplazo del `ShareModal` (modal centrado) por un `SharePanel` anclado al botón Compartir, alineado con `MunicipioFilterButton` y `Download`. Refactor exclusivamente de UI; la lógica de serialización (`useShareSerializer`/`useShareDeserializer`/`useShareDirtiness`) y el `shareService` quedan intactos.

#### Cambios visuales

- **De Modal a Panel anclado**: el share ahora se despliega `bottom-end` del botón con `placement="bottom-end"` y `width="w-80"`, igual que el panel de municipios/descarga. `maxHeight` solo limita en mobile (`max-md:max-h-[calc(100dvh-6rem)]`); en desktop el panel se auto-ajusta al contenido.
- **Tokens homologados**: contenedor `bg-[#F9FBFF] rounded-[14px]`, tipografía `font-garet`, header `text-purple`, cards internas `bg-white rounded-[7px]`, input morado con botón de copiar acoplado (`rounded-r-lg`), botones primarios `h-10 rounded-[30px] bg-purple-deep`. Sustitución de `<input type="checkbox">` por el `<Checkbox>` compartido.
- **Tabs visibles desde el inicio**: eliminado el paso intermedio "Generar enlace" → tabs aparecen en la primera vista; cada tab muestra su descripción + checkbox de anotaciones (cuando aplica) + botón de generar. La tab `Insertar` lleva badge `BETA` (componente `Badge variant="pill" color="orange"`).
- **Indicadores de estado dirty/in-sync**: los pills "Usando link compartido" / "Regresar a" del `MapToolsPanel` se mantienen sin cambio. La alerta verde "Estás viendo un mapa compartido" y la naranja "Cambios sin guardar" se mueven al interior del panel.

#### Archivos

- **`frontend/src/pages/maps/components/SharePanel.jsx`** (nuevo): contenido del panel, basado en el patrón visual de `MunicipioFilterPanel`. Función interna `renderGenerateActions(label)` para no duplicar checkbox + botón entre tabs.
- **`frontend/src/pages/maps/components/ShareButton.jsx`**: ahora usa `Panel` anclado vía `anchorRef` en vez de `Modal`. Expone `onOpenChange` para que `MapToolsPanel` suba el z-index en mobile cuando el panel está abierto.
- **`frontend/src/pages/maps/components/ShareModal.jsx`**: eliminado.

---

## [1.49.1] - 2026-05-26

### UX: tooltip de hover sobre eventos externos + delays de hover más perdonadores

Dos mejoras de descubribilidad y tolerancia al uso accidental del mouse en el widget de eventos externos (los íconos a la derecha del sider).

#### Tooltip de hover sobre `EventoIconButton`

Antes el usuario no tenía señal explícita de qué iba a pasar al hacer clic en el ícono de un evento — solo veía la imagen expandida al hacer hover. Ahora `ExternalEventoItem` envuelve el `EventoIconButton` (dentro del `renderComponent` de `MenuItem`) con un `<Tooltip>` que muestra: `Da clic para descubrir todas las capas y detalles de "{titulo}"`. Configuración:

- **Variante**: `warning` (mismo look amarillo/naranja que el tooltip del item seleccionado en capas activas — consistencia visual)
- **Placement**: `bottom` en desktop, `right` en mobile (no estorba el panel que abre el menú)
- **Delay**: `600ms` — la expansión del ícono dura 500ms (`transition-all duration-500` en el wrapper); esperar 600ms garantiza que el Tooltip calcule su `boundingClientRect` sobre el ícono **ya expandido**, no el contraído (la flecha del tooltip apunta correcto)
- **Disabled cuando**: `isMenuOpen` (panel abierto, evita solapamiento) **o** `!externalHovered` (cinturón + tirantes: el `mouseLeave` propio del Tooltip lo oculta al salir del ícono, pero si por algún motivo no se dispara, `externalHovered=false` después del delay del widget fuerza el early return del Tooltip)

Componente del Tooltip sin modificar — toda la lógica vive en la composición de `ExternalEventoWidget`.

#### Delay de salida en hover (anti-accidente)

El widget se contraía instantáneamente al salir del cursor, y el sider tenía un delay corto de 200ms en su `useSiderHover`. Resultado: salidas accidentales (pasar por arriba sin querer mientras se mueve el mouse a otra cosa) cerraban el widget/sider y forzaban al usuario a repetir el hover.

**Cambios:**
- **`SIDER_HOVER_DELAY_LEAVE_DEFAULT`**: 200ms → **500ms**. Aplica al sider principal vía `useSiderHover` (`handleMouseLeave` en `SiderContext.jsx`). Los otros delays se mantienen (`LEAVE_WITH_MENU=500ms` ya estaba ahí, `LEAVE_WITH_TOOLS=300ms` para no estorbar herramientas activas).
- **`ExternalEventoWidget`**: nuevo `leaveTimerRef` + timeout de `SIDER_HOVER_DELAY_LEAVE_DEFAULT` (reusa la misma constante) en `onMouseLeave`/`onBlur`. Si el cursor vuelve a entrar antes de los 500ms, `clearLeaveTimer()` cancela el cierre. Cleanup en unmount.

Reusar la misma constante mantiene consistencia entre sider y widget — si en el futuro afinas el valor, ambos se mueven juntos.

---

## [No publicado]

## [1.49.0] - 2026-05-25

### Agregado: 2 tools MCP de municipios + `municipios` en `create_*_share` (12 → 14 tools)

El modo Vista por municipio del visor (beta) era una feature 100% frontend hasta ahora: el usuario tenía que abrir el panel manualmente y elegir los polígonos. Para que un agente conversacional (IGIBot) lo aproveche, el MCP necesita 1) consultar el catálogo de los 125 municipios y 2) poder activar el modo dentro de un share. Esta versión cierra ambos.

#### Nuevos tools MCP

- **`list_municipios()`** — devuelve los 125 municipios de Jalisco como `{items: [{clave, nombre, region, areaKm2, areaHa}], count}`. Wrapper de `MunicipiosRepository.list_all` (vista materializada `mapalab.municipios`).
- **`resolve_municipios(query, limit?)`** — búsqueda substring case-insensitive sobre nombre y clave. Mapea "guadalajara" → `[{clave:"14039", nombre:"Guadalajara", region:"Centro", ...}]`. Pensado para que el agente convierta "Guadalajara y Zapopan" → `["14039","14120"]` antes de pasar a los `create_*_share`.

#### Extensión de `create_*_share`

`create_single_share` y `create_swipe_share` ahora aceptan parámetro `municipios={source: "iieg"|"inegi", selected: ["14039","14120",...]}`. Al abrir el share, el visor activa el modo Vista por municipio: máscara visual oscura fuera de los polígonos seleccionados + filtro CQL `{municipioField} IN (...)` automático en capas que soporten el filtro. Para `create_swipe_share`, `municipios` vive en `payload.shared` y se aplica a ambos paneles (estado compartido, no por slot).

#### Bug latente arreglado: `version=2` del share

El frontend del visor llevaba semanas serializando shares con `version: 2` (introducida cuando se agregó `municipios` al payload), pero el validator backend tenía `CURRENT_SCHEMA_VERSION = 1` y rechazaba con 400 cualquier intento de crear un share desde el visor en modo municipio. **El botón "Compartir" estaba roto silenciosamente cuando había municipios activos.**

- **`backend/app/services/share_service.py`**: `CURRENT_SCHEMA_VERSION = 2`, `ALLOWED_VERSIONS = {1, 2}` (backward compat para shares ya creados sin `municipios`). Nuevo `_validate_municipios` con `ALLOWED_MUNICIPIO_SOURCES = {iieg, inegi}` y `MAX_MUNICIPIOS = 125`. `_validate_single_payload` lo invoca en root; `_validate_swipe_payload` lo invoca en `payload.shared`.
- **`servers/share_tools.py`**: `_normalize_municipios` (acepta dict o lista, normaliza a `{source, selected}`). `create_single_share`/`create_swipe_share` propagan a payload. `list_municipios` y `resolve_municipios` nuevos.
- **`servers/mapalab.py`**: 2 `@mcp.tool()` nuevos + parámetro `municipios: Optional[dict]` añadido a los dos `create_*_share` existentes.
- **`backend/test/test_share_service.py`**: 9 tests nuevos (`TestMunicipios` con 7 + `TestVersion` con 3). Total 31 tests, todos pasan.
- **`docs/mcp.md`**: tabla 12 → 14 con los 2 tools nuevos. Nueva sección "Modo Vista por municipio en shares" con el patrón típico de uso desde un agente.

#### Verificación e2e

```
POST /mapalab/mcp/  tools/call resolve_municipios  query="guadalajara"
  → [{"clave":"14039","nombre":"Guadalajara","region":"Centro","areaKm2":150.358,"areaHa":15035.796}]

POST /mapalab/mcp/  tools/call create_single_share
  layers=["tasa_homicidio_doloso"], municipios={"source":"iieg","selected":["14039","14120"]}
  → {id:"igjejs4i7b", url:"...", embed_html:"..."}

GET /api/shares/<id>
  → payload.version=2, payload.municipios={"source":"iieg","selected":["14039","14120"]}  ✅
```

Total tools del MCP: **14** (12 lectura + 2 writes idempotentes).

---

## [1.48.4] - 2026-05-25

### Documentación: `docs/mcp.md` y `docs/context.md` reflejan el modelo real del MCP

Limpieza de referencias obsoletas a `FastMCP.from_fastapi(...)` y al "MCP embebido en el backend" — modelo pre-1.35.0 que llevaba meses fuera pero seguía documentado.

- **`docs/mcp.md`** secciones reescritas:
  - **Intro:** ahora dice "Servidor MCP dedicado (`mapalab-mcp`)" y menciona **12 tools** (10 lectura + 2 writes idempotentes).
  - **§Por qué un container dedicado:** quita la referencia a `FastMCP.from_fastapi`, enfoca en las razones reales (tools manuales con control total de nombres/descripciones, aislamiento de pool, lifecycle propio).
  - **§Qué se expone y qué no:** tabla actualizada — distingue lectura, writes intencionales (`create_*_share` de 1.44.0) y por qué quedan fuera download, cache invalidation (1.48.1), shares admin (`pin_share` etc.) y endpoints internos.
  - **§Tools y su origen:** tabla nueva con 12 entries que mapea cada tool a su servicio/repositorio del backend (`LayersRepository`, `layer_metadata_service`, `PeriodicityService`, `share_tools`). Reemplaza la vieja tabla de 14 entries que mezclaba tools ficticios (`get_database_stats`, `pin_share`, etc.) que nunca estuvieron en el MCP actual o vivían en otra parte.
  - **§Cómo agregar / quitar un tool:** receta reescrita basada en `@mcp.tool()` en lugar de `mcp_source_app.include_router(...)`.
- **`docs/context.md` §MCP server:** una línea actualizada que refleja container dedicado + 12 tools + reuso de servicios del backend; quita el "Construido con FastMCP.from_fastapi…". También la tabla de rutas del backend ahora dice "Servidor MCP en container dedicado mapalab-mcp. 12 tools (10 lectura + 2 writes idempotentes)" en lugar del texto viejo.

Solo documentación. Cero cambios en código del MCP o del backend.

---

## [1.48.1] - 2026-05-25

### Cambiado: removidos del MCP los tools de invalidación de cache (14 → 12)

`refresh_layer_tree_cache` e `invalidate_layer_tree_memory_cache` quedaron expuestos por el MCP heredados de cuando el server se construía con `FastMCP.from_fastapi(...)` y exponía automáticamente todos los routers REST. Los endpoints REST subyacentes (`POST /layers/refresh-cache` y `POST /layers/invalidate-cache`) requieren `X-Internal-Token` desde 1.28.5, que el MCP no inyecta — así que cualquier agente que los llamara vía `tools/call` recibía 401 y los tools eran **ruido en `tools/list`**.

Mariachi sigue invocando los REST directamente desde `iieg-network` con el token interno (lo que ya hacía); ningún flujo operativo se ve afectado.

- **`servers/mapalab.py`**: removidos los 2 `@mcp.tool()` y el import de `refresh_cache`/`invalidate_memory_cache` (queda solo `get_cached_state`).
- **`docs/mcp.md`**: tabla de tools 14 → 12, columna `Tipo` que distingue Lectura / **Write** explícitamente. Nota explicativa de por qué los tools de cache quedaron fuera.
- **`mariachi/admin/src/features/documentacion/topics/McpTopic.jsx`** (admin 1.17.1): las 2 entradas removidas del array `TOOLS`. El `<Tag>` de la columna Router refleja 12.

Resultado: el MCP queda con **10 tools de lectura pura** + **2 writes intencionales y útiles** (`create_single_share`, `create_swipe_share`, ambos idempotentes vía hash determinista). Sin write con guarda inútil.

---

## [1.47.1] - 2026-05-25

### Agregado: soporte de color hex personalizado en el resaltado de feature

El hook `useFeatureHighlight` ahora acepta valores hex `#RRGGBB` en `node.highlightColor`. Si el valor matchea el patrón hex, genera el preset dinámicamente: stroke con ese color exacto y fill con alpha 15% (`${hex}26`). Los 3 presets nombrados (`morado`/`naranja`/`sombreado`) siguen funcionando.

Sin breaking changes — un admin puede dejar los valores `morado`/`naranja`/`sombreado` como estaban o pasar a hex desde el modal global en mariachi-admin.

`isValidColorValue` permite los 3 presets + hex válido en `resolveLayerHighlight`. Los valores inválidos caen al default `morado`.

#### Que cambio

- **`frontend/src/pages/maps/hooks/useFeatureHighlight.js`**: `HEX_PATTERN` regex, `presetForHex(hex)` función, `buildStyle` chequea hex antes de buscar en `COLOR_PRESETS`, `resolveLayerHighlight` valida hex también en la cadena de ancestros.

---

## [1.47.0] - 2026-05-25

### Agregado: InfoBox arrastrable con flecha dinámica + resaltado configurable por capa

#### Panel del InfoBox arrastrable (desktop)

Nuevo botón **Mover** en `ActionsToolbar` (ícono de 4 flechas en cruz) entre Cerrar y Descargar. Arrastrarlo reubica el panel a cualquier parte del viewport cuando estorba sobre un feature del mapa. El hook `useDraggablePanel` aplica `transform: translate(dx, dy)` directo al DOM durante el drag (sin re-renders por frame); al soltar hace un único `setState`. El `baseTransform` (`translate(-50%, -100%)` para single feature) llega como prop y se compone con el offset, evitando el bug del segundo drag explosivo.

`useViewportContainment` acepta nueva prop `paused` que `InfoBox.jsx` setea a `isDragging`. Mientras el usuario arrastra, el containment no toca `el.style.left/top`. Solo mobile mantiene el bottom-sheet sin drag.

#### Flecha dinámica que sigue al feature

El triángulo CSS estático fue reemplazado por `<InfoBoxArrow />`, un SVG `position: fixed` con `<polygon>` que se actualiza via `requestAnimationFrame`. Reacciona a tres movimientos:

1. Pan/zoom del mapa → el pixel del feature cambia, la flecha se reposiciona.
2. Drag manual del panel → la flecha decide automáticamente el lado del card más cercano al feature.
3. Reubicación por `useViewportContainment` → la flecha se reajusta desde el `getBoundingClientRect()`.

Detalles del cálculo:
- Lado por proporciones (`halfW/|dx|` vs `halfH/|dy|`).
- Anchor con clamp `CORNER_PADDING = ARROW_HALF_WIDTH + 6 = 24px` para no caer en esquinas.
- Ángulo siempre perpendicular al lado (0°/90°/180°/-90°) — más limpio que apuntar diagonal al feature exacto.
- Si el feature cae dentro del card (margen 8px), la flecha se oculta.

El polygon usa `cardRef` (el `<div w-[239px]>`), no el wrapper que incluye el `ActionsToolbar`. Así la flecha del lado derecho se pega al borde del card, no del toolbar.

Sombra direccional con `filter: drop-shadow(dx, dy, blur)` calculada desde `angleDeg` (`cos/sin * 3px`). SVG en `zIndex: 4` (debajo del card `z-5`) para que la sombra que difumina hacia el card quede tapada por el `bg-white` — solo se ve la sombra fuera del card.

Cuando el anchor cae sobre el área del header del card (`anchorY < top + 61px`), el polygon se rellena con `#EFF3FC` (gris del header) para verse continuo. En el cuerpo del card es blanco normal.

Offset inicial del panel: ahora usa `-ARROW_TIP` (= -28) en Y para single feature y `+ARROW_TIP` en X para multi feature, así la punta de la flecha cae exactamente sobre el pixel del feature al abrir el InfoBox.

#### Resaltado de feature seleccionado por capa (con propagación)

Nuevo hook `useFeatureHighlight` montado en `MapsProvider` que pinta un `VectorLayer` (`zIndex: 998`) con las geometrías de los features del InfoBox abierto. Dos dimensiones configurables desde mariachi-admin tab "Apariencia":

- **`highlightColor`**: `morado` (default), `naranja`, `sombreado`.
- **`highlightShape`**: `area` (default, área + línea), `linea` (solo contorno, fill transparente), `off` (sin resaltado).

**Propagación**: una leaf hereda los campos del primer ancestor (`group`/`category`/`label`/`tema`) que los defina. Nuevo helper `findAncestorChain(layerId, allLayers)` en `layers/utils/layerHelpers.js` retorna `[self, parent, ..., root]`. `resolveLayerHighlight` recorre la cadena buscando por cada dimensión independientemente — así puedes definir color en el `tema` y forma en el `group` y la leaf hereda ambos.

#### Centrar selección desde el InfoBox

Nuevo botón **Centrar grupo** en `ActionsToolbar` y como tool en mobile. Hace `view.fit` al bbox combinado de todos los features del InfoBox. En swipe usa el pane activo.

Helpers nuevos en `helpers/featureGeometry.js`: `parseResultsFeatures`, `computeFeaturesExtent`, `getExtentCenter`, `centerOnResults` (incluye reposicionamiento del `clickPosition` al centro tras el fit, para que la flecha siga apuntando).

#### Que cambio

- **`frontend/src/pages/maps/components/InfoBox/components/InfoBoxArrow.jsx`** (nuevo).
- **`frontend/src/pages/maps/components/InfoBox/hooks/useDraggablePanel.js`** (nuevo).
- **`frontend/src/pages/maps/hooks/useFeatureHighlight.js`** (nuevo).
- **`frontend/src/pages/maps/helpers/featureGeometry.js`** (nuevo).
- **`frontend/src/pages/maps/helpers/layers/utils/layerHelpers.js`**: `findAncestorChain`.
- **`frontend/src/components/Icon.jsx`**: nuevos inline icons `center_group` y `move_arrows` (renombrados para no colisionar con los external SVGs `fit_extent` y `move` del panel de capas activas).
- **`frontend/src/pages/maps/components/InfoBox/InfoBox.jsx`**: `cardRef` separado, drag, render `<InfoBoxArrow>`, `handleCenterGroup`.
- **`frontend/src/pages/maps/components/InfoBox/components/ActionsToolbar.jsx`**: botones nuevos.
- **`frontend/src/pages/maps/components/InfoBox/hooks/useViewportContainment.js`**: prop `paused`.
- **`frontend/src/providers/MapsProvider.jsx`**: monta `useFeatureHighlight`.
- **`backend/app/models/layer.py`**: columnas `highlight_color` y `highlight_shape`.
- **`backend/app/services/layer_tree_service.py`**: expone los campos en `/layers/tree`.

#### Compatibilidad

Requiere migration **0014** de dataengine (columnas `highlight_color` y `highlight_shape` en `mapalab.layers`). Asegurar que `make migrate` se ejecutó antes del deploy.

---

## [1.46.0] - 2026-05-25

### Botón global de dato curioso siempre visible en el sider

El `<EventoFunButton>` solo aparecía dentro del panel del evento (vía `<EventoActionsBar>`). Eso significa que el usuario no descubría la mecánica de "datos curiosos" hasta abrir un evento, perdiendo afordancia. Ahora hay un **botón global** anclado debajo del `<SiderModeButton>` (botón de control de lockMode del sider), siempre visible en desktop. Comparte componente con el del panel — sin duplicar lógica de animación, popover, bolas, ni telemetría.

#### Comportamiento

- **Panel del evento cerrado** (`!activeEvento`) → el botón aparece en el sider, debajo del SiderModeButton, tamaño compacto `size-8` (32×32) pegado al SiderModeButton sin gap. Usa el `funIcon` del **primer evento con facts** para el ícono estático (dinámico, configurado desde mariachi por evento).
- **Panel del evento abierto** (`activeEvento`) → el del sider se oculta automáticamente, y aparece el mismo componente dentro de `<EventoActionsBar>` con su tamaño original (`size-7`/`size-6` md) y el `funIcon` específico del evento abierto.

Resultado: un solo botón visible a la vez, sin solapamiento, con afordancia continua independientemente del estado del panel.

#### Cambios técnicos

- **`EventoFunButton.jsx`**: ahora acepta props `sizeClass` e `iconSize` (defaults `'w-7 h-7 md:w-6 md:h-6'` y `16` para preservar comportamiento previo dentro de `EventoActionsBar`).
- **`helpers/funFactPicker.js`**: nuevo export `aggregateFactsFromEventos(eventos)` que junta facts de todos los eventos preservando símbolos por fact (cada fact mantiene su `symbol`, con fallback al `funIcon` del evento padre). Las bolas animadas del botón global muestran el símbolo correcto por fact.
- **`MapSider.jsx`**:
  - Importa `useEventoContext` (ya estaba), extrae `activeEvento` del contexto.
  - Construye `globalFactsEvento = { id: 'sider-global-facts', facts, funIcon }` memoizado por `eventos`. `funIcon` toma del primer evento con facts.
  - Renderiza `<EventoFunButton evento={globalFactsEvento} sizeClass="size-8" iconSize={22} />` cuando `!activeEvento && facts.length > 0`, en un contenedor absoluto `right-0 bottom-0 translate-x-1/2 translate-y-[calc(50%+32px)]` (pegado directamente al SiderModeButton sin gap).
  - El `SiderModeButton` ahora está **siempre visible** (antes se desvanecía con `opacity-0` cuando `lockMode === 'auto'` y no había hover). Removida la state `showModeBtn` y los handlers `onMouseEnter`/`onMouseLeave` que la alimentaban (3 lugares).

#### Justificación de tamaño + posicionamiento

El SiderModeButton es 40×40 (`img className="size-10"`). El FunButton del sider quedó en 32×32 para verse visualmente "del mismo tamaño" que el ícono del SiderModeButton (que ocupa ~28-32px efectivos dentro de su PNG, no los 40 nominales) — match perceptual, no nominal. El offset vertical `calc(50%+32px)` deja el FunButton tocando la base del SiderModeButton sin gap.

---

## [1.45.1] - 2026-05-25

### Documentación: recetas end-to-end de los tools nuevos del MCP

Los snippets curl de §Cómo probar muestran cada tool aislado. Faltaba documentar el **flujo combinado** que un agente conversacional realmente ejecuta: medir → resaltar la zona → entregar el share. Tres recetas nuevas en `docs/mcp.md §Recetas`:

- **Receta 1 — Medir un polígono y crear un share con la zona resaltada:** `measure_geometry` para calcular el área, luego `create_single_share` con el **mismo** polígono dentro de `annotations[]` (preservando `value`/`unit` del paso 1) más un `Text` annotation con la etiqueta del análisis. El usuario ve la métrica en texto y el mapa interactivo en el chat.
- **Receta 2 — Comparación A|B con swipe:** `create_swipe_share` con `pane_a_layers` y `pane_b_layers`, `label_a`/`label_b` para la píldora inferior del visor. Caso típico: "compara homicidios vs población".
- **Receta 3 — Swipe con anotaciones compartidas:** `create_swipe_share` + `annotations[]` (Polygon + Emoji). Las anotaciones se pintan sobre **ambos** paneles porque son globales del mapa, no por slot — alineado con la decisión documentada en `docs/swipe.md §Pendientes`.

Cada receta incluye el `curl` exacto, el resultado esperado, y una descripción de qué ve el usuario final. Cierra con el patrón general `medición → annotation`: cuando el análisis del agente produce una geometría, reusa la **misma** `geometry` en el share para que el contexto del análisis se preserve.

Solo documentación.

---

## [1.45.0] - 2026-05-25

### Cambiado (BREAKING): URLs del MCP movidas de `/api/mcp` y `/mapalab/api/mcp` → `/mcp` y `/mapalab/mcp`

El MCP de mapalab vivía bajo `/api/mcp/` y `/mapalab/api/mcp/`, heredado de cuando se pensó como "una API más" del backend. Pero el MCP no es REST — es JSON-RPC sobre HTTP streamable, conceptualmente un protocolo distinto que convive con el API en lugar de "dentro" de él. La convención dominante en la industria (FastMCP default `path='/mcp'`, Cloudflare remote MCP servers, modelcontextprotocol.io examples) lo monta al nivel raíz del servicio sin prefijo `/api`.

Aprovechamos que los únicos clientes hoy son de prueba (admin playground en mariachi + curl manual) para hacer el corte limpio en lugar de mantener compat. Las URLs viejas devuelven 404 a partir de esta versión.

#### URLs

| Antes | Ahora |
|---|---|
| `https://<dominio>/api/mcp[/]` | `https://<dominio>/mcp[/]` |
| `https://<dominio>/mapalab/api/mcp[/]` | `https://<dominio>/mapalab/mcp[/]` |
| `http://mapalab-mcp:8000/mcp` (interna) | sin cambios |

#### Cambios concretos

- **`nginx/nginx.conf`**: removidas las cuatro locations `= /api/mcp[/]` y `= /mapalab/api/mcp[/]`. Agregadas `= /mcp[/]` y `= /mapalab/mcp[/]` con el mismo `proxy_buffering off` / `proxy_cache off` / timeouts de 600s. El upstream `mapalab_mcp` no cambia. La location general `= /mapalab/api/metrics { return 403 }` se mantiene.
- **`docs/mcp.md`**: §Rutas y §Configuración de nginx actualizadas. Todas las URLs de los ejemplos curl, Claude Desktop config, FastMCP client, LangChain adapter usan ahora `/mcp` y `/mapalab/mcp`. Nota explícita: "Sin prefijo `/api` — alineado con la convención industrial".
- **`docs/context.md`**: §MCP server refleja las URLs nuevas + nota histórica sobre el cambio.

#### Verificación e2e (todas con `mapalab-nginx`)

```
POST /mapalab/mcp[/]   → 200 SSE  ✅
POST /mcp[/]           → 200 SSE  ✅
POST /mapalab/api/mcp[/] → 404 {"detail":"Not Found"}  (correcto, ya no existe)
POST /api/mcp[/]         → 404
```

#### Para clientes existentes

- **Claude Desktop, IDEs MCP, IGIBot, langchain-mcp-adapters, etc.**: actualizar la URL en su config de `/mapalab/api/mcp/` a `/mapalab/mcp/`.
- **Playground del admin mariachi**: actualizado en `admin 1.15.3` (commit separado en `mariachi`).
- **Tests automáticos del MCP**: hardcodean URLs en su config — ajustar.

Sin cambios en `servers/mapalab.py` ni en los tools del MCP. El servidor sigue exponiendo el mismo conjunto de tools, solo cambia el path por donde nginx los expone al exterior.

---

## [1.44.1] - 2026-05-25

### Documentación: `docs/mcp.md` con ejemplos `curl tools/call` para los 3 tools nuevos

Faltaba en `docs/mcp.md §Cómo probar` la forma exacta de probar los tools nuevos de 1.44.0 desde la terminal sin levantar un cliente MCP completo. Útil para smoke-test post-deploy en GCP y para que el equipo de IGIBot tenga snippets copy-paste listos.

- **`docs/mcp.md`**: dos secciones nuevas en §Cómo probar:
  - `curl (tools/list)` — listar los 14 tools registrados
  - `curl (tools/call)` — 4 ejemplos completos (`measure_geometry` LineString, `measure_geometry` Polygon, `create_single_share` con annotation, `create_swipe_share`) con la respuesta esperada al lado
- Nota sobre el formato SSE de las respuestas (`event: message\ndata: {...}`) y cómo extraer el JSON con `sed`.
- Mención al playground de `/administrador/documentacion` en mariachi-admin como alternativa visual.

Solo documentación. Cero cambios en código del MCP.

---

## [1.44.0] - 2026-05-25

### Agregado: 3 tools MCP para que agentes conversacionales entreguen mapas interactivos

Hasta 1.43.x el MCP de mapalab era exclusivamente de lectura — un agente LLM podía buscar capas y leer metadata pero no había forma de devolver un mapa interactivo al usuario, solo descripciones de texto.

Tres tools nuevos cierran esa brecha:

- **`create_single_share(layers, view?, basemap?, selected?, annotations?)`**: arma un envelope `kind='single'`, lo valida con `share_service.validate_payload`, lo persiste con `ShareRepository.upsert` y devuelve `{id, kind, url, embed_html}`. El `embed_html` es un snippet `<script>...</script><iieg-mapalab share="...">` listo para pegar en cualquier sitio. El agente lo embebe en su respuesta markdown (renderizable con `react-markdown`/equivalente) y el navegador del usuario monta el widget. Acepta `annotations` para pre-pintar geometrías resultado del análisis.
- **`create_swipe_share(pane_a_layers, pane_b_layers, position?, ...)`**: análogo pero `kind='swipe'` para comparación A|B. Ideal cuando el bot detecta preguntas comparativas ("antes vs después", "salud vs seguridad").
- **`measure_geometry(geometry)`**: recibe geometría GeoJSON EPSG:4326 y devuelve longitud (LineString) o área (Polygon/MultiPolygon) geodésica usando PostGIS `ST_Length`/`ST_Area` sobre `::geography`. Resultado en metros/m² reales sobre el elipsoide WGS84, no aproximaciones planas.

#### Implementación

- **`servers/share_tools.py`** (módulo nuevo): `create_single_share`, `create_swipe_share`, `measure_geometry` como funciones puras. Construyen `embed_html` con `MAPALAB_PUBLIC_BASE_URL` (env opcional, default `https://iieg.gob.mx`). Reusan `share_service.validate_payload` (mismo validador del endpoint REST) y `ShareRepository.upsert` (mismo hash determinístico — crear dos veces el mismo payload no duplica).
- **`servers/mapalab.py`**: 3 `@mcp.tool()` que delegan al módulo. Descripciones largas en español para que clientes MCP (Claude Desktop, IGIBot, etc.) las muestren legibles.

#### Pruebas e2e

```
POST /api/mcp/  tools/call create_single_share
  layers=["tasa_homicidio_doloso"], annotations=[polygon]
→ {id:"qd6fj67ex3", url:"https://iieg.gob.mx/mapalab/mapa?s=qd6fj67ex3",
   embed_html:"<script>...<iieg-mapalab share='qd6fj67ex3'>..."}

POST /api/mcp/  tools/call measure_geometry  Polygon ~10x10 km
→ {value:115374443.16, unit:"m²", value_km2:115.374443}
```

#### Caso de uso

IGIBot puede ahora:

```
1. usuario: "muéstrame los homicidios en Guadalajara"
2. bot: search_layers(q="homicidio") → "tasa_homicidio_doloso"
3. bot: create_single_share(layers=[...], view={zoom:11, lat:20.6, lon:-103.4})
4. bot: responde con texto + embed_html
5. usuario ve el mapa embebido, interactúa con él, activa medición (1.43.0+)
```

Sin breaking changes en tools existentes. Total: 14 tools (era 11).

#### Documentación

- **`docs/mcp.md`**: tabla de tools actualizada (11 → 14). Nueva sección "Entrega de mapas a agentes conversacionales" con firma de cada tool y patrón de uso end-to-end.

---

## [1.43.0] - 2026-05-25

### Agregado: mediciones y anotaciones se incluyen en el share (single + swipe)

Hasta 1.42.x los dibujos del visor (líneas/polígonos de medición, textos, emojis, freehand) eran efímeros — vivían en el `vectorSource` del `useMapDrawing` y se perdían al recargar o al copiar el link de "Compartir". Quien abría un share solo veía las capas, no las anotaciones.

Ahora el envelope del share acepta opcionalmente `payload.annotations: [...]` con cada medición serializada como GeoJSON en EPSG:4326. Al cargar el share, las anotaciones se restauran al vectorSource del `useMapDrawing` y se ven igual que cuando se dibujaron. Funciona para `kind='single'` y `kind='swipe'` — las anotaciones son globales del mapa, no por pane (decisión alineada con `docs/swipe.md §Pendientes`).

#### Backend

- **`backend/app/services/share_service.py`**: `MAX_PAYLOAD_BYTES` sube a 256 KB (los polígonos reales no caben en 64 KB). Nuevo `_validate_annotations(payload.annotations)`: lista ≤ 200 items, cada uno con `id`, `type ∈ {LineString, Polygon, Freehand, Text, Emoji}`, `geometry` GeoJSON básico (`type ∈ {Point, LineString, Polygon, MultiPolygon}`, `coordinates ≤ 2000 puntos`), `rotation` numérico opcional. `_validate_single_payload` y `_validate_swipe_payload` lo invocan.
- **`backend/test/test_share_service.py`**: 9 tests nuevos para annotations (single y swipe, geometría inválida, type inválido, sin id, límite de 200, None y campo ausente). Total: 21 tests.

#### Frontend serializer / deserializer

- **`useShareSerializer.js`**: nuevo helper `serializeAnnotations(measurements)` que itera `measurements`, ignora items sin `feature` o de tipo `Select`, y convierte cada `feature.getGeometry()` a GeoJSON con `featureProjection:'EPSG:3857' → dataProjection:'EPSG:4326'`. Preserva `id`, `type`, `label`, `value`, `textLabel`, `rotation`, `visible`. Se invoca cuando `extra.includeAnnotations === true` (default `false`).
- **`useShareDeserializer.js`**: si `payload.annotations` existe, llama `restoreAnnotations(payload.annotations)` (expuesto por `useMapDrawing` vía `MapsProvider`). Lo hace tanto en la rama `single` como en la `swipe`.
- **`useMapDrawing.js`**: nuevo `restoreAnnotations(annotations)`. Reconstruye `ol.Feature` desde GeoJSON, recalcula `formatLength`/`formatArea` desde la geometría (no confía en el `value` recibido, defensa contra geometrías editadas externamente), setea `textLabel`/`rotation`/`annotationType` para Text/Emoji/Freehand, agrega al `vectorSource` y empuja al state `measurements`. Retry-polling de 100 ms hasta 5 s mientras `ensureVectorLayer()` falle — necesario porque los shares se aplican antes de que el mapa termine de montar.

#### UX

- **`ShareModal.jsx`**: si `measurements` tiene al menos 1 item con `feature` y `type !== 'Select'`, aparece un checkbox **"Incluir mis mediciones y anotaciones (N)"** marcado por default. El conteo es en vivo. El texto explica que quien abra el enlace verá las líneas, polígonos, textos y emojis dibujados.

#### Documentación

- **`docs/swipe.md`**: nueva sección "Annotations (mediciones persistidas en el share)". `payload.annotations` documentado en §Persistencia. Tabla de pendientes ajustada: "dibujar mediciones nuevas en swipe" sigue pendiente, pero las pre-existentes vía share ya se ven.

---

## [1.42.1] - 2026-05-25

### Corregido: backend de `shares` aceptaba `kind='compare'` (legacy) pero rechazaba `kind='swipe'` (actual)

`docs/swipe.md` afirmaba desde hace meses que "Compartir ✅ Envelope `kind: 'swipe'` con ambos snapshots", pero el backend tenía el modelo viejo con `kind IN ('single','compare')` y `_validate_compare_payload` (con `axis ∈ {date,filter,geo}` y `panes` con `value`). El botón "Compartir" del visor en modo swipe enviaba `kind='swipe'` y recibía `HTTP 400 {"detail":"kind invalido: swipe"}` silenciosamente — feature roto en producción.

El frontend (`useShareSerializer`, `useShareDeserializer`) ya manejaba `single | swipe` exclusivamente (sin fallback legacy). El backend se actualiza para alinearse con el contrato real documentado.

- **`backend/app/services/share_service.py`**: `ALLOWED_KINDS = {'single', 'swipe'}`. Nuevo `_validate_swipe_payload` que valida el shape documentado en `docs/swipe.md §Persistencia` (`shared.view`, `paneA.layers`, `paneB.layers`, `activeSlot ∈ {A,B}`, `position ∈ [0,1]`). Extraído `_validate_view` y `_validate_layer_entries` para reusar entre single/swipe. `_validate_compare_payload` removido.
- **`backend/app/models/share.py`**: `CheckConstraint("kind IN ('single','swipe')")`.
- **Migración Alembic en dataengine** `0013_map_shares_kind_swipe`: drop CHECK viejo, `DELETE FROM mapalab.map_shares WHERE kind='compare'` (solo afecta filas no alcanzables desde la UI actual), nuevo CHECK con `('single','swipe')`. Downgrade reversible.
- **`backend/test/test_share_service.py`**: 12 tests cubriendo single/swipe válidos, validaciones de cada campo, rechazo explícito de `compare` legacy.

Verificación end-to-end: `POST /api/shares` con `kind='swipe'` y el payload exacto que arma el serializer del visor devuelve `200 OK` con el `id` del share. El widget `<iieg-mapalab share="...">` ahora puede cargar swipes guardados.

---

## [1.41.0] - 2026-05-22

### Agregado: iconText soporta texto visible separado del campo URL + auto-href en icono `web`

El bloque `iconText` del InfoBox aceptaba `field` (valor a mostrar) y opcionalmente `href` (link literal). Faltaban dos cosas: poder mostrar un texto distinto al valor del campo (ej. "Sitio oficial" en vez de la URL larga del feature), y que el icono `web` resolviera automáticamente el link cuando el `field` apunta a una columna con la URL.

#### Qué cambió

- **`frontend/src/pages/maps/components/InfoBox/components/IconText.jsx`**: nueva prop `hrefValue` (defaults a `value`). `buildHref` ahora maneja `web` además de `celular`/`ubicacion`: si el valor parece URL absoluta la usa tal cual; si no, le antepone `https://`.
- **`frontend/src/pages/maps/components/InfoBox/utils/renderCard.jsx`**: `renderIconText` ahora computa `displayValue = item.label || item.value || properties[item.field]` (label gana sobre el valor del campo) y pasa `hrefValue = properties[item.field] || item.value || displayValue` para que `buildHref` use la fuente correcta. Cuando hay `item.href` explícito se resuelve con `resolveHref` (soporta tokens `{campo}`, mismo helper que `text`/`list`).

#### Ejemplos

- **Antes**: `{icon: 'web', field: 'sitio_web'}` mostraba la URL completa como texto, no clickeable.
- **Ahora**: `{icon: 'web', field: 'sitio_web', label: 'Sitio oficial'}` muestra "Sitio oficial" subrayado, link abre `properties.sitio_web` en pestaña nueva.
- **Token explícito**: `{icon: 'web', label: 'Catastro', href: 'https://catastro.gob.mx/{clave_catastral}'}` resuelve el token contra el feature.

Backward compat: items existentes sin `label` o `href` siguen comportándose igual (el icono `web` ahora también genera link auto, antes no lo hacía sin `href` explícito — diferencia leve pero deseada).

---

## [1.40.2] - 2026-05-22

### Corregido: menús flotantes con `bottom-start`/`bottom-end` no se adaptaban al viewport

`useSiderMenuPosition` ya calculaba `maxHeight` cuando el menú no cabía hacia la derecha (`right-start`), pero las variantes `bottom-start` y `bottom-end` retornaban `maxHeight: null` sin importar cuánto contenido tuvieran. Como el `Panel` con `variant="menu"` aplica `overflow-hidden` al contenedor, el contenido del menú se clipeaba cuando rebasaba el alto del viewport.

El único consumidor con `bottom-start` en modo `variant="menu"` era el botón flotante de eventos (`ExternalEventoWidget`), así que en eventos con muchas capas el panel se cortaba al final sin scroll.

#### Qué cambió

- **`frontend/src/hooks/useSiderMenuPosition.js`**: `bottom-start` y `bottom-end` calculan `availableHeight = window.innerHeight - top - 16` y pasan ese valor como `maxHeight` cuando `contentHeight` lo rebasa; si no, `null`. `ThemeMenu` ya envuelve el listado en `ScrollContainer` con `flex-1 overflow-y-auto`, así que el scroll interno se activa solo cuando el menú queda clampeado.

### Cambiado: eventos pausados en el panel del sider

Los eventos venían apareciendo en dos lugares: dentro del sider (entre capas base y temas) y en el widget flotante a la derecha del sider. Se elimina la entrada del sider — los eventos ahora solo se acceden desde el widget flotante.

Para restaurar la versión anterior basta con poner `SIDER_EVENTS_ENABLED = true` en `MapSider.jsx`.

#### Qué cambió

- **`frontend/src/pages/maps/components/MapSider.jsx`**: nuevo flag `SIDER_EVENTS_ENABLED` (default `false`) y `EMPTY_EVENTOS` (frozen array a nivel módulo para conservar la referencia estable en `useMemo`). `eventosForSider` se usa tanto para `createMenuItems` como para `eventCount`; el widget flotante (`ExternalEventoWidget`) sigue recibiendo el array completo desde `EventoContext`.

---

## [1.40.1] - 2026-05-22

### Corregido: tools MCP `get_metadata`, `resolve_layer_ref` y `get_periodicity` aceptan `Layer.id` del visor

El contrato entre tools era inconsistente: `search_layers` devuelve `id` con el formato del visor (p. ej. `tasa_homicidio_doloso`), pero los otros tools esperaban distintos identificadores derivados (geoserver_layer, slug/alias, schema en PostGIS). Un agente que encadenaba `search_layers → get_metadata` con el `id` recibido recibía `[]`; `resolve_layer_ref` siempre devolvía 404 porque `Layer.slug` y `LayerAlias` no están poblados; `get_periodicity` con el alias del workspace devolvía `null` porque la `layer_key` real usa el `db_schema` completo (`seguridad_y_proteccion_ciudadana`, no `seguridad`).

Los tres tools ahora resuelven el identificador antes de consultar, manteniendo compatibilidad si ya se pasaba el valor exacto.

- **`backend/app/services/layer_metadata_service.py`**: `_resolve_layer_key` extraído a `_resolve_workspace_name` + lookup en `mapalab.layers` por `(workspace_alias, id)`. Si la fila existe usa `Layer.geoserver_layer`, si no deja el `layer` tal cual recibido.
- **`backend/app/services/periodicity_service.py`**: nuevo `_resolve_layer_key` análogo (alias → `db_schema`, `Layer.id` → `geoserver_layer`). `get_periodicity` y `get_periodicities_batch` ahora lo invocan antes de consultar `public.layer_periodicity`; el batch deduplica las keys resueltas.
- **`backend/app/repositories/layers_repository.py`**: `find_layer_by_slug_or_alias` agrega fallback final `Layer.id == ref` para el caso esperable donde slug/alias no están poblados.
- **`docs/mcp.md`**: sección nueva "Identificadores aceptados" con la tabla del contrato.

Sin cambios de schema. Reutilizable desde REST también: los tres endpoints REST (`/metadata/`, `/layers/resolve`, `/periodicity/`) heredan la robustez al pasar por los mismos servicios.

---

## [1.38.3] - 2026-05-22

### Corregido: InfoBox quedaba debajo de los overlays del mapa con `z-0`

En `1.38.2` bajamos el InfoBox a `z-0`. Eso lo dejaba al mismo nivel que los overlays DOM del mapa (texto/emojis del editor en mapa, markers, anotaciones — `ol/Overlay` arranca con z-index `0`), así que dependiendo del orden del DOM el InfoBox podía quedar detrás de ellos. Lo subimos a `z-5`: queda por encima de los overlays del mapa y de `SwipeView` (`z-1`), y sigue por debajo de cualquier panel UI (`z-10` en adelante).

#### Qué cambió

- **`frontend/src/pages/maps/components/InfoBox/InfoBox.jsx`**: contenedor desktop pasa de `z-0` a `z-5`.
- **`docs/z-index.md`**: tabla y diagrama reflejan el nuevo nivel.

---

## [1.38.2] - 2026-05-22

### Corregido: InfoBox se anteponía a Capas Activas, MapSider y otros paneles

El `InfoBox` (panel flotante anclado a un feature del mapa) usaba `z-50`, el carril que el resto del proyecto reserva para modales (`Modal`, `MobileSheet`, `ConfirmDropdown`, `DownloadMenu`). Como no es un modal sino un overlay anclado al mapa, se colaba sobre paneles legítimos: lista de capas activas (`z-10`), `MapSider` (`z-20`), e incluso sobre el `LayerDetailModal` (que originalmente estaba en `z-30`).

En `1.37.3` lo habíamos resuelto subiendo el modal a `z-60`, pero el problema raíz era el InfoBox. Bajamos el InfoBox a `z-0` (sigue sobre el canvas del mapa, debajo de cualquier panel UI) y devolvemos el `LayerDetailModal` a su `z-30` original.

#### Qué cambió

- **`frontend/src/pages/maps/components/InfoBox/InfoBox.jsx`**: contenedor desktop pasa de `z-50` a `z-0`. El `MobileSheet` (variante mobile) mantiene su `z-50` propio porque ahí sí actúa como sheet modal.
- **`frontend/src/pages/maps/components/LayerDetailModal/LayerDetailModal.jsx`**: contenedor vuelve de `z-60` a `z-30`.
- **`docs/z-index.md`**: tabla y diagrama reflejan el nuevo orden (InfoBox al fondo del stack UI, modal en `z-30`).

---

## [1.38.0] - 2026-05-22

### Agregado: respeto del campo `z` por capa del evento + revert de iteración inversa

El editor de eventos en mariachi (`1.14.0`) ahora expone un campo `z` opcional por capa que define el orden Z explícito del mapa, desacoplado del orden visual del submenú. El visor lo consume al auto-activar las capas del evento.

#### Qué cambió

- **`frontend/src/pages/maps/components/EventoMenu.jsx`**: revertida la iteración inversa de `toActivate` que metí en `1.36.0` (asumía "primera fila del editor = al frente del mapa"). Ahora cada item se enriquece con `z` (`typeof c.z === 'number' ? c.z : null`), se ordena `toActivate` por `z` **ascendente** (`null` primero, luego z asc), y se procesa con `forEach` normal. Como `handleToggleLayer` hace unshift, las que se procesan más tarde quedan al frente: las con mayor Z terminan al inicio de `activeLayerIds` (= al frente del mapa) y las sin Z quedan al final (= al fondo).

#### Convención resultante (alineada con mariachi `1.14.0`)

| Caso | Z del mapa |
|---|---|
| Todas las capas sin `z` | Última fila del editor al frente, primera al fondo (comportamiento original anterior al fix erróneo de 1.36.0) |
| Una capa con `z=5`, el resto sin `z` | La de Z=5 al frente; las demás en su orden de tabla detrás |
| `A z=1`, `B z=3`, `C z=2` | B (Z=3) al frente, C (Z=2), A (Z=1) al fondo |
| Mezcla: `A` sin Z, `B z=2`, `C` sin Z | B al frente; A y C entre sí por posición de tabla |

Sort estable (`Array.prototype.sort` en V8/Node 12+) garantiza que dos capas con mismo `z` (o ambas sin `z`) preservan el orden del `walk(evento.capas)`.

Sin cambios en el cache, schema o endpoints. Eventos viejos sin `z` se comportan como antes del fix de 1.36.0.

---

## [1.37.3] - 2026-05-22

### Corregido: modal de detalle de capa queda debajo del InfoBox

El `LayerDetailModal` se renderizaba con `z-30`, mientras que el `InfoBox` (panel flotante de información de features) usa `z-50`. Cuando ambos estaban abiertos, el InfoBox tapaba parte del modal. Subimos el modal a `z-60` para que quede por encima del InfoBox; el InfoBox sigue funcionando igual sobre el resto de paneles del visor.

#### Que cambio

- **`frontend/src/pages/maps/components/LayerDetailModal/LayerDetailModal.jsx`**: contenedor pasa de `z-30` a `z-60`.
- **`docs/z-index.md`**: tabla y diagrama actualizados con el nuevo orden (LayerDetailModal `[60]` arriba de FeatureInfoPanel `[50]`).

---

## [1.37.2] - 2026-05-22

### Corregido: flechas y degradado del `ScrollContainer` en el panel de Capas Activas

Cuando un item del panel "Capas Activas" se selecciona, se vuelve `position: sticky` (vía `[data-sticky]` en `SortableList`) y crece con periodicidad, barra de acciones y leyenda (`GetLegendGraphic`, que además carga asíncrona). Antes el `ScrollContainer` usaba una constante `STICKY_SIZE = 52` (100 en mobile) para posicionar las flechas "ir al inicio / al final" y el degradado superior/inferior. El item expandido medía mucho más que 52 px, así que las flechas y el degradado caían **dentro** del item sticky: ocultos detrás de la leyenda y sin poder clickearse.

Ahora `useScrollOverflow` mide la altura real del elemento `[data-sticky]` con `getBoundingClientRect` y le monta un `ResizeObserver` dedicado para captar el crecimiento asíncrono cuando carga la imagen de la leyenda. El nuevo campo `stickyHeight` se propaga a `ScrollContainer`, que lo prefiere sobre la prop `stickySize` (que queda como fallback opcional).

#### Que cambio

- **`frontend/src/hooks/useScrollOverflow.js`**: nuevo `stickyHeight` en el estado, calculado desde `getBoundingClientRect` del `[data-sticky]`. `ResizeObserver` dedicado al sticky que se conecta/desconecta automáticamente cuando aparece o cambia.
- **`frontend/src/components/ScrollContainer.jsx`**: `topOffset` / `bottomOffset` usan `stickyHeight || stickySize`. Sin cambios para consumidores sin `[data-sticky]` interno.
- **`frontend/src/pages/maps/components/ActiveLayers/ActiveLayersList.jsx`**: removido el hardcode `STICKY_SIZE = 52` / `STICKY_SIZE_MOBILE = 100` y la prop `stickySize` que se pasaba al `ScrollContainer`. También se quitó el `useSider`/`isMobile` que ya no se usaba.

---

## [1.37.1] - 2026-05-22

### Cambiado: ocultar contador `1/1` en el header del InfoBox

Cuando una capa devuelve un único feature, el badge `1/1` ya no se renderiza en el header de la tarjeta (ni desktop ni mobile). La condición pasó de `total > 0` a `total > 1` en ambos headers. El layout no cambia: en desktop el badge está en `position: absolute` con el padding lateral (`px-12`) reservado, así que el título sigue centrado idéntico; en mobile el badge vive en un flex con el título en `flex-1`, así que al ocultarse el título solo absorbe el espacio liberado.

#### Que cambio

- **`frontend/src/pages/maps/components/InfoBox/components/Header.jsx`**: `showBadge` ahora exige `total > 1`.
- **`frontend/src/pages/maps/components/InfoBox/components/MobileFeatureHeader.jsx`**: misma condición.

---

## [1.37.0] - 2026-05-22

### Agregado: links clicables en InfoBox + múltiples bloques de texto por template

Dos extensiones al sistema de templates de InfoBox:

#### Hrefs en filas de lista y bloques de texto

`<List>` y `<Text>` aceptan ahora una prop `href` que renderiza el valor como `<a target="_blank" rel="noopener noreferrer">` con underline morado (`text-[#5C2472]`). Si `href` no se pasa, el valor sigue siendo texto plano.

En la configuración del template, cada `list[]` y cada item de `text[]` acepta un campo `href` con plantilla. La plantilla soporta tokens `{nombre_campo}` que `resolveHref` (en `infoBoxTextBlocks.js`) reemplaza por el valor del feature (URL-encoded). Si algún token queda sin resolver, el href se descarta y el valor se renderiza como texto. Solo se permiten hrefs con scheme `http:`, `https:`, `mailto:`, `tel:` o rutas absolutas (`/...`) — todo lo demás se descarta.

#### Múltiples bloques de texto independientes

Antes el template tenía un único `text: [...]` que se renderizaba como un bloque contiguo. Ahora `finalConfig.text` es un array de bloques con `{ id, items: [...] }`, lo que permite intercalar varios bloques de texto entre `labels`, `list`, `cards`, etc. via `blockOrder` usando claves `text:<id>`.

Se preserva retrocompatibilidad: `normalizeFinalConfig` detecta la forma legacy (`text: [{ label, value, field, ... }]` sin `items`) y la convierte a `text: [{ id: 't0', items: [...] }]`. Si el `blockOrder` legacy menciona `'text'`, se reescribe como `'text:t0'`. Templates existentes funcionan sin cambios.

#### Que cambio

- **`frontend/src/pages/maps/components/InfoBox/components/List.jsx`**: cada fila resuelve `href`; si existe, el valor formateado se envuelve en `<a>` con underline.
- **`frontend/src/pages/maps/components/InfoBox/components/Text.jsx`**: nueva prop `href`; mismo patrón de `<a>` cuando se pasa.
- **`frontend/src/pages/maps/components/InfoBox/utils/renderCard.jsx`**: `renderList` recibe `getValue` y resuelve `row.href`. `renderText` reemplazado por `renderTextBlock` (itera `block.items`). `resolveBodyOrder` expande la clave genérica `'text'` en N claves `'text:<id>'`, una por bloque presente, conservando la posición relativa. `renderCard` invoca `normalizeFinalConfig` al recibir el config.
- **`frontend/src/pages/maps/components/InfoBox/utils/infoBoxTextBlocks.js`** (nuevo): helpers `isTextKey` / `textIdOf` / `mkTextKey` para la clave compuesta; `resolveHref` con allowlist de schemes y reemplazo de tokens; `normalizeFinalConfig` para migrar configs legacy.

---

## [1.36.0] - 2026-05-22

### Cambiado: barra de acciones de eventos en producción + botón "Centrar evento"

`<EventoActionsBar>` ya no está gated por `IS_NON_PROD` — se renderiza siempre. En `dev`/`beta` mantiene el border `border-orange` + badge "beta"; en producción usa fondo neutro (`bg-[#F9FBFF]`) sin badge. El único elemento que sigue gated es el botón Colibri (`<ReportButton>` de "Reportar problema con este evento"), envuelto con `IS_NON_PROD && (...)` para que no se renderice ni ocupe espacio en producción.

Reemplazamos el botón de copiar enlace del evento por un botón "Centrar evento" (icono `fit_extent`). Llama al mismo `centerOnEvento` que dispara el primer mount del menú (bbox-fit con padding 8% del shortSide), por lo que el usuario puede recuperar el encuadre en cualquier momento aunque haya hecho pan/zoom. Solo se renderiza si `evento.bbox` está definido. Emite telemetría `evento_center` con `evento_id`. Eliminamos junto con esto el helper `buildEventoShareUrl`, sus 5 tests y el tracker `evento_share`.

### Cambiado: `EventoMenu` respeta el estado previo al re-abrir

Tanto el bbox-fit como el auto-activado de capas con `autoActivar !== false` ahora hacen skip al primer mount si ya existe al menos una capa del evento en `activeLayerIds`. Antes, cada cierre/apertura del menú desmontaba/montaba el componente, los `useRef` se reseteaban y volvía a re-encuadrar el mapa y a re-activar las capas que el usuario había apagado manualmente. Ahora:

- Primera apertura del evento (o tras apagar todas sus capas) → centra el mapa y activa las capas con `autoActivar !== false`.
- Reapertura con al menos una capa del evento ya activa → no se mueve el mapa ni se reactiva ninguna capa. El usuario puede recentrar manualmente con el botón "Centrar evento".

#### Que cambio (ambas secciones)

- **`frontend/src/pages/maps/components/EventoMenu.jsx`**: `centerOnEvento` extraído a `useCallback` y pasado a `<EventoActionsBar>` como `onCenterEvento`. Los dos efectos (bbox-fit y autoactivado) cortocircuitan cuando `eventoLayerIds` interseca `activeLayerIds`.
- **`frontend/src/pages/maps/components/EventoActionsBar.jsx`**: eliminado el early return `IS_NON_PROD`; eliminado el botón Compartir con su estado `copied`/timers; agregado botón "Centrar evento" con `Icon name="fit_extent"`; `<ReportButton>` envuelto con `IS_NON_PROD && (...)`; container con clases distintas por entorno.
- **`frontend/src/services/analyticsService.js`**: agregado `trackEventoCenter(eventoId)`; eliminado `trackEventoShare`.
- **`frontend/src/pages/maps/helpers/eventoHelpers.js`**: eliminado `buildEventoShareUrl` (sin uso).
- **`frontend/src/test/pages/maps/helpers/eventoHelpers.test.js`**: eliminados los 5 tests de `buildEventoShareUrl` y su import.
- **`docs/context.md`**: actualizado el bloque de `<EventoMenu>` / `<EventoActionsBar>`; agregado `evento_center` a la lista de eventos analytics; eliminada referencia a `buildEventoShareUrl` en helpers compartidos.
- **`docs/analytics.md`**: agregada fila para `evento_center`.

---

### Corregido: orden Z de capas auto-activadas del evento

Al abrir un evento, la primera capa del submenú (definida en mariachi `CapasField`) terminaba al final de `activeLayerIds` por el comportamiento de unshift de `handleToggleLayer` combinado con `forEach` en orden directo. Resultado: el orden Z del mapa quedaba invertido respecto al orden visual del submenú y del editor en mariachi, obligando a cada usuario a reordenar manualmente desde el panel de Capas Activas.

#### Que cambio

- **`frontend/src/pages/maps/components/EventoMenu.jsx`**: iteración inversa de `toActivate` en la auto-activación (`for` de `length-1` a `0`). Cada `onToggleLayer` sigue haciendo unshift, pero al procesar las capas en orden inverso, la primera del submenú termina en el índice 0 de `activeLayerIds` — al frente del mapa.

#### Convención resultante

| Posición en submenú/editor mariachi | Panel Capas Activas | Z del mapa |
|---|---|---|
| Arriba | Arriba | Al frente |
| Abajo | Abajo | Al fondo |

Para mandar una capa al fondo: en mariachi se arrastra al final del CapasField. Sin cambios en el panel de Capas Activas (ya soporta drag & drop genérico para reordenar después).

Solo afecta la auto-activación inicial. Activar manualmente una capa desde el submenú sigue trayendo la capa al frente (comportamiento estándar de `handleToggleLayer`).

---

## [1.35.1] - 2026-05-22

### Cambiado: path del MCP sin slash final para alinear con iieg-oficial/agent

Los 9 servers MCP de `iieg-oficial/agent` (sql, analytics, charts, rag, files, utils, summary, tavily, vision) montan todos con `http_app(path="/mcp", stateless_http=True)` — sin slash final. La 1.35.0 de mapalab uso slash (`path='/mcp/'`) porque era la forma mas directa de evitar el 307 redirect cuando nginx pegaba con slash al backend. Esto generaba ruido al integrar mapalab en IGIBot, donde todos los demas MCP servers usan sin slash.

#### Que cambio

- **`servers/mapalab.py`**: `mcp.http_app(path='/mcp', stateless_http=True)` (sin slash).
- **`nginx/nginx.conf`**: dos `location =` exactos (sin slash y con slash) que pegan ambos al backend en `/mcp` sin slash:
  ```nginx
  location = /api/mcp       { proxy_pass http://mapalab_mcp/mcp; ... }
  location = /api/mcp/      { proxy_pass http://mapalab_mcp/mcp; ... }
  location = /mapalab/api/mcp  { proxy_pass http://mapalab_mcp/mcp; ... }
  location = /mapalab/api/mcp/ { proxy_pass http://mapalab_mcp/mcp; ... }
  ```
- **`docs/mcp.md`** + **playground en mariachi-admin**: URL canonica `/api/mcp` (sin slash). La forma con slash sigue funcionando por compatibilidad con clientes que ya la usaban.

Sin cambios en el contrato de tools, telemetria, dashboard ni alertas.

---

## [1.35.0] - 2026-05-21

### Cambiado: servidor MCP movido a un container dedicado `mapalab-mcp`

Alineado con el patron de los servers MCP del ecosistema `agent` (IGIBot):
FastMCP con tools manuales (`@mcp.tool()`) + docstrings como descripcion,
`combined_app` con `health` y `/mcp/`, transporte `stateless_http=True`.

#### Por que

El MCP vivia embebido en el backend principal. Eso mezcla un servicio sin
estado (lectura del catalogo) con el backend monolitico que tiene scheduler,
embed proxy, downloads, etc. Sacarlo a un container propio permite:

- Escalar el MCP independientemente del backend (mas workers para el agente
  sin tocar el visor).
- Coherencia con `iieg-oficial/agent/servers/*.py` — un agente que ya consume
  `sql-agent`, `búsqueda-web`, etc. ve a mapalab como un servidor mas.
- Telemetria y metricas aisladas (etiqueta `service=mcp` separada de
  `service=backend` en Prometheus).

#### Que cambio

- **Nuevo: `servers/mapalab.py`** — FastMCP con 11 tools manuales decorados
  con `@mcp.tool()`. Reutiliza los servicios y repositorios existentes del
  backend (`app.services.*`, `app.repositories.*`) — cero duplicacion de
  logica de DB.
- **Nuevo: `servers/telemetry.py`** — middleware ASGI + flush loop +
  `flush_pending_sync()` para shutdown. El middleware ahora se aplica a la
  app combinada con filtro de path (`path_prefix='/mcp'`) en vez de a
  `mcp_app` directamente (que no se preservaba al combinar routes).
- **Nuevo: `servers/Dockerfile`** — base compartida con el backend
  (`backend/requirements.txt`) + el codigo de `backend/app` + `servers/`.
  Targets `development` (con `--reload`) y `production` (gunicorn 2 workers).
- **Nuevo service `mapalab-mcp` en `docker-compose.yml`** — pool de DB
  configurable via `MCP_DB_POOL_SIZE` / `MCP_DB_MAX_OVERFLOW` (default 2+2
  para minimizar conexiones). Compartido en `iieg-network`. Healthcheck
  contra `/health`.
- **`nginx/nginx.conf`** — upstream nuevo `mapalab_mcp`. Las dos locations
  `/mapalab/api/mcp/` y `/api/mcp/` apuntan ahora a `http://mapalab_mcp/mcp/`
  en vez de al backend.
- **`backend/app/server.py`** — limpiado: ya no importa `fastmcp`, no monta
  `/mcp`, no corre el flush loop del MCP. Lifespan reducido. El backend
  vuelve a ser solo REST + scheduler + embed.
- **Eliminado**: `backend/app/middleware/mcp_telemetry.py`,
  `backend/app/services/mcp_telemetry.py`. Su contenido vive ahora en
  `servers/telemetry.py`.

#### Tools expuestos (11)

`search_layers`, `resolve_layer_ref`, `get_layer_tree`, `get_initial_order`,
`get_workspaces`, `get_metadata`, `get_sources_batch`, `get_periodicity`,
`get_periodicities_batch`, `refresh_layer_tree_cache`,
`invalidate_layer_tree_memory_cache`.

`shares` y sus 5 tools (write) ya no se exponen al MCP — quedan disponibles
en REST si un cliente HTTP los necesita.

#### Observabilidad

- **Prometheus** — nuevo target en `huachicol/prometheus/targets/projects.json`
  con label `service=mcp project=mapalab`. La variable `MAPALAB_MCP_TARGET`
  se agrega a `huachicol/.env` y al script `generate-targets.sh`. Las
  metricas `mapalab_mcp_calls_total` y `mapalab_mcp_latency_ms` siguen
  iguales — solo cambia el job de origen.
- **Mariachi** — el endpoint interno `/api/administrador/internal/mapalab/mcp/events`
  y la tabla `mapalab_mcp_events` no cambian. El flush_loop ahora vive en
  el lifespan del MCP server.

#### Notas de migracion

- **Path con slash final**: `mcp.http_app(path='/mcp/')` (con slash) para
  evitar el 307 redirect que FastMCP emite cuando el cliente pide
  `/mcp/` y el mount es `/mcp` (sin slash).
- **Middleware location**: aplicar `MCPTelemetryMiddleware` al `mcp_app`
  antes de combinar routes NO funciona — los middlewares de Starlette no
  se preservan al hacer `routes=[*mcp_app.routes]`. Se aplica a la
  `combined_app` con `path_prefix='/mcp'`.
- **Pool de DB**: el MCP server abre su propio pool de SQLAlchemy. Default
  `pool_size=2, max_overflow=2` (4 conexiones max por worker, 8 totales
  con 2 workers de gunicorn). Se suma al pool del backend (8+8 = 16 por
  worker, 128 con 8 workers).

---

## [1.34.0] - 2026-05-21

### Agregado: descripciones, telemetría y dashboard del servidor MCP

- **Descripciones legibles para los 17 tools del MCP**. Cada endpoint expuesto al MCP (`metadata`, `periodicity`, `layers`, `shares`) ahora declara `operation_id`, `summary` y `description` en su decorador FastAPI. Los tools pasan de nombres largos heredados del routing (`get_layer_tree_layers_tree_get`) a nombres cortos (`get_layer_tree`) y cada uno trae descripción larga en español que orienta al LLM. Énfasis especial en `search_layers`, que documenta explícitamente que devuelve label + path jerárquico para que un agente pueda resolver el ID de una capa a partir del nombre que conoce el usuario.

- **Telemetría del MCP → mariachi**. Cada request HTTP al `/mcp/` pasa por un middleware ASGI puro (`backend/app/middleware/mcp_telemetry.py`) que parsea el JSON-RPC, mide duración + bytes de salida y bufferea el evento. Un loop async flushea cada 30 s a un endpoint interno nuevo en mariachi (`POST /api/administrador/internal/mapalab/mcp/events` con `X-Internal-Token`), mismo patrón que `access_logger` y `api_key_quota`.
  - **Campos**: `timestamp`, `dia`, `method`, `tool`, `status`, `error_code`, `duration_ms`, `bytes_out`, `session_hash`, `ip_hash`, `client_name`, `client_version`.
  - **Sin identidad**: `session_id` e IP del cliente se persisten como SHA-256 salteado por `MAPALAB_INTERNAL_TOKEN`. No hay ni IP en claro ni session id en claro.
  - **Middleware ASGI puro** (no `BaseHTTPMiddleware`) para no consumir el stream SSE del transport HTTP streamable.

- **Métricas Prometheus paralelas**:
  - `mapalab_mcp_calls_total{method, tool, status}` — counter por llamada.
  - `mapalab_mcp_latency_ms{tool}` — histograma de duración solo para `tools/call`.
  - Dos alertas nuevas en huachicol: `MapalabMcpHighErrorRate` (>10 % de 4xx/5xx en 10 min con tráfico sostenido) y `MapalabMcpHighLatency` (p95 > 5 s).

- **Panel de admin nuevo**: tab "MCP" dentro de `/administrador/mapalab/stats`. 4 vistas materializadas (`mapalab_mcp_stats_overview`, `mapalab_mcp_stats_tools`, `mapalab_mcp_stats_daily`, `mapalab_mcp_stats_clients`) alimentan tarjetas (llamadas 30d/7d/hoy, tasa de error, latencia media), gráfica de llamadas por día con stack de errores, tabla por tool (usos, errores, p95) y tabla de clientes MCP (Claude Desktop, IGIBot, otros). Se refrescan con el botón "Refrescar vistas" del tab Resumen — ya existían las del visor y se sumaron las del MCP a la misma lista.

- **Página de Documentación en mariachi-admin** (`/administrador/documentacion`): hub para guías técnicas con tabs verticales por tema; el primer tema es "Servidor MCP" con qué es, cómo usarlo (Claude Desktop + Python), tabla de los 17 tools agrupados por router, ejemplo de respuesta de `search_layers`, descripción de los campos persistidos en `mapalab_mcp_events` y un playground interactivo que llama los endpoints REST equivalentes y muestra HTTP status + latencia + JSON con copy-to-clipboard de la URL. El item del sider queda anclado al footer con `position: absolute; bottom: 0` para que sea siempre visible.

#### Migraciones de datos

- `mariachi/api/alembic/versions/mariachi/b9c0d1e2f3a5_add_mapalab_mcp_events.py` — tabla `mapalab_mcp_events` con 4 índices.
- `mariachi/api/alembic/versions/mariachi/c0d1e2f3a4b6_add_mapalab_mcp_stats_views.py` — 4 vistas materializadas con índices únicos para refresh CONCURRENTLY.

---

## [1.33.1] - 2026-05-21

### Fix: basemap del evento se revertía al hacer click en el mapa

Cuando un evento tenía `basemapId` configurado (1.32.0), el visor aplicaba el basemap al abrir el menú lateral del evento — correcto — pero al hacer click en cualquier parte del mapa el basemap se revertía al default ("voyager"). El usuario tenía que volver a abrir el menú para verlo, y se revertía otra vez al siguiente click.

#### Causa

El effect que aplicaba el basemap vivía en `frontend/src/pages/maps/components/EventoMenu.jsx`. Ese componente se renderiza dentro de `<Panel open={isMenuOpen}>` y el Panel hace `if (!open) return null` cuando se cierra. El Panel se cierra automáticamente al click fuera (handler `mousedown` document-level, comportamiento esperado de un menú). Al desmontarse `EventoMenu`, el cleanup del effect llamaba `setBaseMapId(previous)` restaurando el basemap previo — el usuario percibía esto como "el basemap se revierte al click".

La intención original del cleanup era restaurar el basemap "al cerrar el evento", pero el ciclo de vida del componente está atado a "abrir/cerrar el menú lateral", no a "evento activo". El click en el mapa cierra el menú pero el evento conceptualmente sigue activo (capas prendidas, banner visible).

#### Fix

- **`frontend/src/pages/maps/components/EventoMenu.jsx`**: se elimina el cleanup del effect del basemap. El effect ahora solo aplica `setBaseMapId(evento.basemapId)` al montar / cambiar de evento. El restore-al-cerrar se pierde — si el usuario quiere otro basemap, lo cambia desde el picker de basemaps. Eliminados `previousBasemapRef`, el effect de sincronización de `baseMapIdRef`, y `baseMapId` del destructure de `useMapsContext` (ya no se usaba).

#### Nota

El restore-al-cerrar "real" requiere mover el effect del basemap a `EventoProvider` (donde vive `activeEvento`) y limpiar `activeEvento` sólo cuando el evento deja de estar activo (capas apagadas o se abre otro evento). Queda como follow-up si lo piden.

---

## [1.33.0] - 2026-05-21

### Avisos y dato curioso: italic visible, popover de fact sin símbolo, render inline centralizado

Tres fixes pequeños sobre la integración del texto enriquecido del visor con la salida del editor de mariachi 1.9.0.

#### Corregido

- **Italic invisible en avisos y datos curiosos**. La fuente custom `Garet` (`frontend/src/index.css`) carga todas sus variantes con `font-style: normal` (Book, Regular, Medium, Bold, ExtraBold), y la regla global tiene `font-synthesis: none`, lo que impedía al navegador sintetizar el oblicuo cuando se usa `font-style: italic`. **Fix**: en `frontend/src/utils/inlineMarkdown.jsx` el `<em>` se renderiza con `style={{ fontStyle: 'italic', fontSynthesis: 'style' }}` inline — autoriza la síntesis sólo donde la necesitamos, sin tocar la regla global. Mismo enfoque defensivo: `<strong>`, `<s>` y `<a>` también pasan a `style` inline (`fontWeight: 700`, `textDecoration: 'line-through' | 'underline'`) en lugar de `className` (`font-bold`, `line-through`, `underline`) para no depender de que Tailwind aplique la clase con la specificity suficiente en el contexto donde se renderice.
- **Símbolo del fact aparecía dos veces**. `EventoFunButton.jsx` lo pintaba en la "pelota animada" que cae **y** dentro del `<Message>` del popover, arriba del texto. **Fix**: se elimina el `<SymbolGlyph>` del popover en `FactPopover` y `MobileFactBanner`; el símbolo queda únicamente en la pelota.

#### Cambiado

- **`frontend/src/utils/inlineMarkdown.jsx`**: regex `TOKEN_PATTERN` ahora se declara como pattern de sólo lectura; cada llamada a `renderInlineMarkdown(text)` instancia un `new RegExp(...)` propio para no acarrear `lastIndex` global entre invocaciones (bug latente: tras un primer render el `lastIndex` podía quedar en una posición intermedia y la segunda llamada del mismo string no encontraba matches al inicio).

#### Coordinación

- En paralelo, el admin (mariachi 1.9.0) sustituye su `Input.TextArea` por el `MarkdownTextArea` con toolbar de markdown inline (B/I/S/Link/Símbolo). Ver `mariachi/docs/CHANGELOG.md [1.9.0]`.

---

## [1.32.0] - 2026-05-21

### Eventos: barra de acciones del submenu (compartir, reportar, dato curioso) + apertura por URL + basemap por evento

El submenu de cada evento gana una barra de acciones bajo el título (gated por `IS_NON_PROD`, border naranja para indicar beta a nivel de barra completa). Reemplaza el botón ambiguo de papelera (que confundía "apagar capas externas" con "eliminar capas") y suma compartir, reportar y un botón lúdico con datos curiosos animados. En paralelo el evento soporta apertura directa por URL y selección de mapa base que se aplica al abrir y se restaura al cerrar.

#### Agregado

- **`<EventoActionsBar>`** (`frontend/src/pages/maps/components/EventoActionsBar.jsx`, nuevo): contenedor único con border `border-orange` y un único badge "beta" a la izquierda etiquetando toda la barra.
  - **Switch "Solo este evento"**: reutiliza `<Switch>` existente. Al activarse oculta las capas externas vía `setHiddenLayerIds` (no las apaga ni las elimina del panel de capas activas); `addedByUsRef` recuerda sólo las que el switch ocultó, así al desactivar el switch restaura únicamente esas — sin descongelar ocultamientos que el usuario hizo manualmente.
  - **Botón Compartir**: icono-only (estilo `ICON_BUTTON` consistente con el balón y Colibri). Copia al portapapeles `${origin}${BASE_URL}mapa?evento=${slug}` usando `import.meta.env.BASE_URL` (respeta `VITE_BASE_PATH=/mapalab/` en prod). Prioriza `evento.slug` del backend sobre `slugifyTitulo(titulo)`. Feedback con ícono `done` verde + label "Copiado" durante 1.5s. Telemetría `evento_share` (status `ok|error`).
  - **`<EventoFunButton>`** (`frontend/src/pages/maps/components/EventoFunButton.jsx`, nuevo): botón circular con el símbolo configurado del evento. Al click spawn de un balón animado que rebota (3 rebotes decrecientes 55%/80%/93% del recorrido, easing per-keyframe que simula gravedad, padding final 4px al ras del viewport, `BALL_SIZE_PX=28`) y, cuando se detiene (`BALL_STOP_DELAY_MS=3700ms`), aparece el popover con el dato curioso anclado a la posición final del balón (flecha hacia abajo apuntándole). Cap a 10 balones simultáneos. En mobile el popover pasa a banner top-center fijo (sin flecha, sin asociación al botón). Cierre por click afuera o autodismiss 10s. Honra `prefers-reduced-motion`. Telemetría `evento_fun_fact`.
  - **Botón Reportar**: `<ReportButton variant="floating">` con `extraContext` `{source: 'evento_actions_bar', evento_id, evento_titulo}` + nueva prop `onTrack` que dispara `trackEventoReport(eventoId)` antes de abrir Colibri.

- **Apertura por URL**: nuevo hook `frontend/src/pages/maps/hooks/useAutoOpenEventoFromUrl.js`. Lee `?evento=` del query string en `<MapSider>` y resuelve contra `evento.id`, `evento.slug` o `slugifyTitulo(evento.titulo)`; al match, `setIsHovered(true)` + `setAutoOpenMenuId('evento-{id}')` con 300ms de delay (mismo patrón que `shouldAutoOpenSearch`). Idempotente vía `processedRef`. Override `max-lines: 320` para `MapSider.jsx` siguiendo el patrón de otros archivos del repo.

- **Basemap por evento**: `<EventoMenu>` lee `evento.basemapId`; al montar guarda el `baseMapId` actual en `baseMapIdRef.current` y aplica el del evento. Al desmontar restaura. El effect sólo reacciona a `evento.id`/`evento.basemapId` (no a `baseMapId`), así un cambio manual del usuario durante la sesión del evento no se "corrige".

- **Datos curiosos por evento**: cada evento puede listar facts. Estructura `{text, symbol?}` donde `symbol` es un snapshot del catálogo MapaLab → Símbolos (`{symbolId, kind, value, imageUrl, name}`). `FactRef` Pydantic acepta strings legacy (`@model_validator(mode='before')`) para backwards-compat con facts capturados como strings sueltos. Shuffle bag por evento en `helpers/funFactPicker.js`: no repite hasta agotar el pool.

- **Símbolos del catálogo**: nuevo `<SymbolGlyph>` en `frontend/src/pages/maps/components/SymbolGlyph.jsx`. Renderiza el snapshot inline: `kind='emoji'` como texto con font emoji, `svg|image` como `<img>`. Fallback a ⚽ si no hay símbolo. El botón del balón usa el `funIcon` del evento; el balón rebotado usa `fact.symbol || evento.funIcon || ⚽`; el popover muestra **solo** `fact.symbol` cuando está explícitamente en mariachi (sin fallback al funIcon ni al default).

- **Telemetría**: `trackEventoShare(eventoId, status)`, `trackEventoReport(eventoId)`, `trackEventoFunFact(eventoId)` en `services/analyticsService.js`. Cada uno emite el evento específico + el `map_interaction` genérico vía `withMapInteraction` (mismo patrón que el resto del visor).

- **`<ThemeMenu>` con slot `actionsBar`**: nueva prop opcional que renderiza un nodo entre el header y el `<ScrollContainer>`. Backwards-compatible: los menús de tema normales no la pasan y siguen igual.

- **Keyframe CSS `evento-fun-bounce`** en `frontend/src/index.css`: animación de 5200ms con caída vertical pura, tres rebotes decrecientes y estancia ~1.5s antes del fade. `animation-timing-function` per keyframe (ease-in en caídas, ease-out en rebotes) para simular gravedad real. Media query `prefers-reduced-motion` colapsa a 200ms ease-out.

#### Coordinación

- **Backend mariachi**: nuevas columnas `eventos.facts JSONB DEFAULT '[]'`, `eventos.fun_icon JSONB`, `eventos.basemap_id VARCHAR(50)` (3 migraciones Alembic: `a8b9c0d1e2f4`, `a8b9c0d1e2f6`, `a8b9c0d1e2f7`). Schema `EventoBase`/`EventoUpdate` con `facts: list[FactRef]`, `funIcon: SymbolSnapshot | None`, `basemapId: str | None`. Cache server-side se invalida vía `notify_eventos_changed()` al publicar/editar el evento.
- **Admin mariachi**: tab "Diversión" en el editor de eventos con `<FactsField>` (usa `<MarkdownTextArea>` reutilizado de avisos para soportar markdown inline en el texto, toolbar combinada con subir/bajar/eliminar gracias a nueva prop `extraActions` en `MarkdownTextArea`); `<SymbolSnapshotField>` con `<SymbolPicker>` del catálogo en Popover. Selector de basemap (Carto Voyager / Carto Light / Sin mapa base) en tab "Apariencia". Detalles en `mariachi/docs/CHANGELOG.md [1.8.0]`.

## [1.31.0] - 2026-05-21

### Avisos de capas: cursivas, tachado y enlaces en el inline markdown

El render inline de los avisos sólo soportaba `**negritas**`. Se amplía para reconocer también `*cursivas*`, `~~tachado~~` y `[texto](url)`. El admin (mariachi) gana en paralelo una toolbar para escribir estos formatos sin teclear el markdown a mano.

- **`frontend/src/utils/inlineMarkdown.jsx`** (nuevo): helper `renderInlineMarkdown(text)` centralizado. Una sola expresión regular consume tokens (`[texto](url)`, `**bold**`, `~~strike~~`, `*italic*`) en orden de aparición para evitar el problema clásico de regex inestables al combinar varios formatos. Los enlaces requieren protocolo http(s), abren en pestaña nueva con `rel="noopener noreferrer"`. Los formatos no reconocidos quedan como texto plano.
- **`frontend/src/components/Message.jsx`** y **`frontend/src/pages/maps/components/LayerNotices/BannerNotice.jsx`**: eliminadas las dos copias locales de `renderInlineMarkdown` (que sólo manejaban bold); ambos archivos importan el helper común de `@utils/inlineMarkdown`.

## [1.30.0] - 2026-05-20

### Eventos sale de beta + saneamiento del bundle WMS

`Eventos` deja de mostrar el badge "BETA" en `EventoIconButton`. La feature flag `VITE_EVENTOS_BETA_BADGE` (introducida temporal en versiones anteriores) se elimina del código y de `.env.example`; el import de `Badge` también se quita del componente.

En paralelo se diagnosticó y limpió un `EncodingError: The source image cannot be decoded` que aparecía en consola al abrir cualquier evento. Causa raíz: `useWMSLayerFactory` agrupa todas las capas de workspace `eventos` (`baseUrl|wmsGroup` compartidos) en un único `GetMap`; 4 capas del catálogo (`limite_de_velocidad`, `paradas_tp`, `rutas_complementarias_tp`, `rutas_troncales_tp`) apuntaban a tablas PostGIS inexistentes en `dataengine-primary.iieg_gis.eventos`. GeoServer respondía `ServiceException` XML con `HTTP 200`, el browser intentaba decodificarlo como PNG y el bundle entero se caía.

#### Agregado

- **`useWMSLayerFactory`: log `imageloaderror`**: el listener ahora captura `event.image.getImage().src` y emite `console.warn('[WMS imageloaderror]', { layerId, src, baseUrl, params })` cuando `import.meta.env.DEV` está activo. Permite identificar exactamente qué capa genera la respuesta no decodificable la próxima vez que aparezca el síntoma. En producción no se ejecuta el warn ni se construye el payload — el `onLoadEnd?.(layerId)` sigue corriendo igual.

#### Corregido

- **`EventoIconButton`**: badge "BETA" y `SHOW_BETA_BADGE` removidos. El componente ya no necesita el gate de env var y queda más simple. `.env.example` actualizado para reflejar el cambio.
- **`LayerDetailModal`: scrollbar consistente con el resto del app**. El contenedor scrollable usaba `scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400`; ninguna de esas clases existe en `index.css` (Tailwind v4 sin plugin de scrollbar), así que caía al default del browser. Cambiado a `scrollbar-thin scrollbar-thumb-gray-400`, el mismo patrón que ya usa `Modal.jsx`.
- **Catálogo: 4 capas fantasma soft-deleted en `mapalab.layers`**. `auto-eventos-limite-de-velocidad`, `auto-eventos-paradas-tp`, `auto-eventos-rutas-complementarias-tp`, `auto-eventos-rutas-troncales-tp` marcadas con `deleted_at` y `deleted_by='cleanup-ghost-eventos'`. El filtro `Layer.deleted_at.is_(None)` en `LayersRepository.get_all_layers/get_max_updated_at/count_layers/search_layers` (soft-delete del modelo `Layer` introducido en esta misma versión) las excluye del árbol publicado. Cache de árbol regenerado vía `POST /layers/refresh-cache`.

#### Coordinación

- Las 4 capas siguen publicadas en GeoServer (`GetCapabilities` aún las lista). Limpieza completa requiere unpublish manual en GeoServer admin o restaurar las tablas faltantes en `dataengine-primary.iieg_gis.eventos`. Ver nuevo `Escenario 9` en `docs/runbook-layers.md`.

### Agregado

- **Eventos: soporte de categorías**: `<EventoMenu>` ahora acepta `tipo: 'categoria'` (además de `etiqueta` y capas) en `evento.capas`. Una categoría es un nodo con `alias` y un sub-array `capas` que se renderiza como carpeta expandible/colapsable (reutilizando `CategoryItem` de `ThemeMenu`). Profundidad limitada a un nivel (consistente con la jerarquía del árbol principal: tema → categoría → etiqueta/capa); las sub-categorías anidadas se descartan silenciosamente. `eventoHelpers.collectEventoLayerIds` y la auto-activación recorren recursivamente las categorías, así que el contador de "capas externas activas" y el `findEventoByLayerId` siguen funcionando para capas que viven dentro de categorías.

## [1.29.0] - 2026-05-19

### Aviso configurable por capa (notice)

Algunas capas necesitan comunicar al usuario un contexto que no cabe en su título ni en la tarjeta de detalle: datos preliminares, vigencia, cambios recientes, enlaces a la fuente. Hasta ahora la única vía era editar la descripción del feature type, que vive en otra sección y se ve solo al abrir el modal. La nueva característica permite mostrar un banner sobre el mapa, configurable desde mariachi, que aparece mientras la capa está activa y dentro de su rango de zoom.

#### Agregado

- **Columna `mapalab.layers.notice` (JSONB)**: nueva migración alembic `0009_layer_notice` en dataengine. Shape `{ enabled, title, description, icon, variant, position, dismissible, validFrom, validUntil, cta }`. Entra automáticamente vía `make prod-migration` (que ya corre `alembic upgrade head`).
- **Editor en mariachi**: nuevo tab "Aviso" en `LayerEditPage` (visible para `group` y `leaf`). Form con habilitar/deshabilitar, contenido (título, descripción, icono via `BucketFilePicker` apuntando al bucket `iieg`), presentación (variante info/warning/neutral, posición top-center/bottom-center, descartable, permanencia del cierre `permanent`/`reopen`), visibilidad por zoom opcional (hereda de la capa si se deja vacío), vigencia opcional con fechas (vacío = permanente) y enlace opcional (CTA). Preview en vivo con badges de metadata.
- **Iconos en Acervo**: set inicial subido a `iieg/iconos/` (alert, info, tiempo_alert, rendimiento "caracol", warning, aviso_privacidad, novedades). Convención global de iconos compartidos entre secciones. El admin puede agregar más vía media uploader.
- **Component `<Message>` extendido**: detecta automáticamente si `icon` es URL (`http(s)://`, `/acervo/`, `/api/`) y la renderiza como `<img>`; si es un nombre simple sigue usando `externalIcons`. Usable por cualquier consumer (slow_loading_warning, layer notices, futuros).
- **Backend mapalab**: el árbol publicado en `/layers/tree` incluye `notice` sólo cuando `enabled === true` (ahorra payload). Soportado tanto en el refresh job de dataengine (`run_refresh_layer_tree.py`) como en el constructor in-process del backend (`layer_tree_service.py`).
- **Frontend mapalab**:
  - `helpers/noticeHelpers.js` con utilidades puras: filtros por vigencia, rango de zoom, hash de contenido para dismiss persistente.
  - `hooks/useLayerNotices.js` con `useSyncExternalStore` sobre el zoom del mapa; reacciona a `change:resolution` del view OL.
  - `components/LayerNotices/` con contenedor por posición y tarjeta visual con CTA opcional.
  - En swipe: el aviso aparece **una sola vez** aunque la capa esté en ambos slots (unión deduplicada).
  - Dismiss persistente en `localStorage` con clave `mapalab.notice.dismissed.<layerId>.<hash>`. Si el editor cambia el contenido, el hash cambia y el aviso vuelve a mostrarse.
- **Telemetría** (GA4 + collector Mariachi): `layer_notice_view` (impresión), `layer_notice_dismiss` (cierre), `layer_notice_cta_click` (click en enlace).
- **Visor embebido**: atributo `notices="false"` en el web component `<iieg-mapalab>` para desactivar avisos en sitios anidados. Se propaga como query param `notices=false` al iframe.

## [1.28.5] - 2026-05-15

### Auth interna en `/layers/refresh-cache` e `/layers/invalidate-cache`

Hasta `1.28.4` ambos endpoints aceptaban requests anonimos. La unica defensa era el `return 403` que `gateway-hub` aplica en las rutas `/mapalab/api/layers/refresh-cache` e `/invalidate-cache`. Para servicios co-residentes en `iieg-network` (cualquier container que llegue directo a `mapalab-backend-1:8000`) eso no servia: podian invalidar el cache sin token y abusar del refresh para forzar carga sobre dataengine.

#### Agregado

- **`app/auth/internal_token.py::require_internal_token`**: dependency reusable que valida el header `X-Internal-Token` contra `settings.MAPALAB_INTERNAL_TOKEN`. Retorna `503` si el server no tiene el token configurado, `401` si el header esta ausente o es incorrecto. Mismo contrato que la funcion local `_require_internal_token` que existia en `shares.py` (no se refactoriza para mantener el cambio minimo).
- **`app/routers/layers.py`**: `dependencies=[Depends(require_internal_token)]` en `refresh_cache_endpoint` (linea 69) e `invalidate_cache_endpoint` (linea 80).
- **`test/test_smoke.py::TestLayersAdminAuth`**: 5 tests que cubren el contrato: rechazo sin token, con token incorrecto, 503 cuando el server no tiene token configurado, aceptacion con token correcto, e invalidate sin token.

#### Coordinacion

- Requiere `mariachi >= 1.0.3` (el notifier ya envia el header `X-Internal-Token`).
- `MAPALAB_INTERNAL_TOKEN` debe coincidir exactamente entre `mapalab/.env*` y `mariachi/.env*`.

#### Notas

- Si en algun entorno `MAPALAB_INTERNAL_TOKEN` queda vacio en mapalab, los endpoints devuelven `503` y los reintentos del notifier los marcan como fallidos. El `etag-check` de mem cache en cada request sigue resincronizando contra DB, asi que el tree no queda permanentemente stale; solo se pierde la actualizacion inmediata.

## [1.28.4] - 2026-05-15

### Loop temporal: default subido de 0.5 s a 1 s

`DEFAULT_LOOP_INTERVAL_MS` en `frontend/src/pages/maps/hooks/useDateLoop.js` cambiado de `500` a `1000`. A 0.5 s con GCP saturado o cold cache, el ojo no alcanza a "leer" el cambio entre frames raster y la animacion se siente como flicker mas que como evolucion temporal. Un segundo da tiempo suficiente para que el usuario perciba la transicion mes-a-mes y, de paso, alivia presion sobre GeoServer en el primer ciclo. El preset de 0.25 s y 0.5 s siguen disponibles para quien quiera tempo mas rapido; solo cambia el valor inicial cuando se da Play por primera vez.

Tests existentes (`useDateLoop.test.js`) pasan sin modificaciones porque referencian `DEFAULT_LOOP_INTERVAL_MS` por simbolo, no por valor literal.

## [1.28.3] - 2026-05-15

### Loop temporal: tope de reintentos alineado con `proxy_cache_lock_timeout`

`MAX_LOADING_RETRIES` en `frontend/src/pages/maps/hooks/useDateLoop.js` subido de `100` (~10 s) a `300` (~30 s). El valor anterior era mas estricto que el `proxy_cache_lock_timeout` que dejamos en gateway-hub (30 s), causando un caso degenerado en GCP saturado: el primer ciclo del loop muere en silencio antes de que GeoServer rinda y nginx cachee el primer frame. Tras alinear ambos topes, el primer ciclo puede tolerar frames lentos mientras se hidrata el cache, y los ciclos siguientes corren al tempo solicitado (0.5 s/2 s/etc.) sin problema. Si un frame realmente tarda mas de 30 s, el auto-stop sigue actuando.

---

## [1.28.2] - 2026-05-15

### Robustez del loop temporal de capas raster

Conjunto de correcciones en `frontend/src/pages/maps/hooks/useDateLoop.js` detectadas en una revisión a fondo del motor de animación del loop. Cinco bugs latentes, todos aislados a este hook; los 13 tests de `useDateLoop` siguen pasando sin modificaciones.

#### Fixed

- **Stale closures de `allLayers`**: `inferLoopConfig` (`useCallback([])`) y el effect de aplicación de filtros por defecto capturaban un `allLayers` posiblemente vacío al primer render. `LayersProvider` hidrata el árbol de forma asíncrona; para capas raster activadas antes de la hidratación esto rompía el inferido y dejaba sin aplicar el filtro `date` por defecto. Ahora `inferLoopConfig` lee `allLayers` vía `refs.current.allLayers` siempre fresco, y el effect lo incluye en sus deps para re-correr cuando el árbol se hidrata. Se eliminaron dos `// eslint-disable-next-line react-hooks/exhaustive-deps` que enmascaraban el problema.
- **Timers huérfanos al desmontar**: la cadena recursiva de `setTimeout` del tick seguía viva tras un unmount del provider, ejecutando `applyFilter` sobre un árbol desmontado. Nuevo `useEffect` con cleanup que vacía `timersRef` al desmontar.
- **Hang silencioso por loading perpetuo**: si una capa quedaba marcada como cargando indefinidamente (frame que erroniza al tile loader), el gate `loadingLayers.has(layerId)` reprogramaba un retry cada 100 ms sin tope, dejando el loop girando en vacío sin feedback. Se introdujo `MAX_LOADING_RETRIES = 100` (~10 s); al excederse, el loop se detiene y emite `trackRasterLoop(layerId, false)`. El contador se resetea en cada tick exitoso y al reanudar con `toggleLoop`.
- **Filtro `date` huérfano tras desactivar una capa raster**: cuando una capa recibía el filtro por defecto vía el effect inicial pero el usuario nunca daba Play, al desactivarla `cleanupLoop` no se invocaba (porque no había entrada en `dateLoops`), por lo que el filtro persistía en el estado de `useCQLFilter`. Ahora el bloque de cleanup de `appliedDefaultsRef` también llama `clearFilter(id, 'date')` para layers raster recién desactivadas. Los filtros restaurados desde share/URL se re-aplican en carga, así que no se pierden.

### Renombrado del repositorio `mapalab-dataengine` → `dataengine`

Se actualizaron las referencias al repo de infraestructura de datos, ahora llamado `dataengine`, en docs, `Makefile` y `backend/app/services/scheduler_service.py`.

## [1.28.0] - 2026-05-13

### Instrumentación HTTP del backend para Prometheus

El endpoint `/metrics` ya emitía counters de negocio (`mapalab_tree_requests_total`, `mapalab_download_requests_total`, etc.) pero no métricas HTTP estándar. Las reglas `HighLatency` y `HighErrorRate` de huachicol quedaban inactivas para mapalab porque dependen de `http_request_duration_seconds` y `http_requests_total{status}`. Se agrega `prometheus-fastapi-instrumentator` para emitirlas sin romper el render manual existente.

#### Agregado

- **`prometheus-fastapi-instrumentator`** en `backend/requirements.txt`. Sin pin de versión, resuelve a 7.x compatible con FastAPI 0.111+.
- **Hook en `backend/app/server.py`** justo después del `CORSMiddleware`: `Instrumentator(...).add(metrics.requests()).add(metrics.latency(...)).instrument(app)`. Buckets de latencia ajustados a `(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10)` para granularidad fina hasta 5ms. `excluded_handlers=["^/metrics$", "^/health$", "^/ontoy$", "^/$"]` para no auto-instrumentar el scrape ni los endpoints de plataforma.
- **`backend/app/metrics.py`** concatena `generate_latest(REGISTRY).decode('utf-8')` al final del render manual. El mismo endpoint `/metrics` expone counters de negocio + HTTP estándar en un solo scrape.

#### Seguridad

- **`nginx/nginx.conf`**: nuevo bloque `location = /mapalab/api/metrics { deny all; return 403; }` antes del proxy genérico `/mapalab/api/`. Defense-in-depth contra exposición pública vía `mapalab-nginx:3006` que bindea a `0.0.0.0`. El scrape interno desde Prometheus (a `mapalab-backend-1:8000` directo, sin pasar por nginx) sigue funcionando.

#### Notas

- **Cuidado con `excluded_handlers`**: usa `re.search`, no match exacto. Un patrón como `"/"` matchea cualquier path que contiene `/` (o sea, todos). Usar anclas `^...$`.
- Mapalab corre con 8 workers gunicorn. El instrumentator usa `prometheus_client` sin `multiprocess_mode`, por lo que cada worker mantiene sus propios counters y `/metrics` solo refleja el worker que sirvió el request. Aceptable porque Prometheus scrapea cada 15s y `sum/rate` consolidan. Si se requiere consolidación cross-worker, configurar `PROMETHEUS_MULTIPROC_DIR`.

## [1.27.0] - 2026-05-13

### Telemetría anónima del visor → Mariachi

Sistema de eventos de uso del visor para entender qué capas, herramientas y botones son los más usados, además de quién entra al swipe y cuánto dura una sesión típica. Anónimo, append-only y persistido en Mariachi para consumo desde el panel admin.

#### Agregado

- `services/telemetryService.js`: buffer en memoria con flush cada 30s o 50 eventos, `sendBeacon` en `pagehide` para no perder eventos al cerrar la pestaña. Session UUID en `sessionStorage` con expiración de 4h. Honra Do-Not-Track del navegador. Heartbeat cada 60s mientras la pestaña esté visible para calcular duración real de la sesión. Endpoint configurable vía `VITE_MARIACHI_PUBLIC_API_HOST`, toggle por `VITE_TELEMETRY_ENABLED`.
- `services/analyticsService.js`: inyectado el collector en el `trackEvent` central. Todos los trackers que ya existían (`trackLayerToggle`, `trackFeatureClick`, `trackMapZoomLevel`, `trackBasemapChange`, `trackDrawingTool`, `trackShareMap`, `trackInfoOpen`, `trackReportSubmitted`, `trackEventoOpen/Close`, etc.) ahora también emiten a Mariachi sin tocar cada componente.
- Trackers nuevos: `trackThemeChange`, `trackOpacityChange`, `trackLegendsToggle`, `trackSwipeEnter`, `trackSwipeExit`, `trackSwipeSlotChange`, `trackInfoBoxAction`, `trackHomeAction`, `trackContributeClick`, `trackLogoClick`, `trackLayerReorder`, `trackMeasurementTool`, `trackEmbedView`.

#### Instrumentación

- `hooks/useSwipeMode.js`: `swipe_enter` al activar el comparador con la orientación elegida, `swipe_exit` al salir con duración en segundos.
- `components/ActiveLayers/SlotBadge.jsx` (vía `LayerDateControls.jsx` y `ActiveLayerItem.jsx`): `swipe_slot_change` con `from`/`to`/`layer_id` al ciclar A → AB → B.
- `components/ActiveLayers/LayerOpacityPopover.jsx` (vía `LayerActionsBar.jsx`): `opacity_change` con debounce 500ms.
- `components/ActiveLayers/hooks/useLegendsVisibility.jsx`: `legends_toggle` al cambiar el switch global.
- `components/ActiveLayers/hooks/useLayerSorting.js`: `layer_reorder` con índice origen/destino al hacer drag & drop.
- `components/ThemeMenu.jsx`: `theme_change` al abrir el menú de un tema.
- `components/InfoBox/components/InfoBoxTools.jsx`: `infobox_action` con `action`/`layer_id` por cada botón del InfoBox.
- `components/MapSider.jsx`: `logo_click` al clickear el logo IIEG (el que abre el modal de novedades).
- `pages/home/components/Body.jsx` y `Card.jsx`: `home_action` para `section_open/close`, `faq_toggle`, `subtopic_click`.

#### Sin cambios para el usuario final

La telemetría es anónima. No se identifica a la persona — solo IP hasheada con salt diario y familia del User-Agent ("Chrome", "Mobile", etc.). El collector se silencia automáticamente si DNT está activo. GA4 sigue funcionando en paralelo, este sistema lo complementa con SQL libre desde el panel.

## [1.26.0] - 2026-05-13

### Resiliencia del WFS DescribeFeatureType y conteo coherente de capas en la tarjeta IIEG

Se elimina la tormenta de peticiones `DescribeFeatureType` que producía 429 al activar varias capas seguidas, y se alinea el contador "Capas disponibles" del marcador IIEG con la representación visual del panel de capas activas (un `forceGroup` con sus hijos = 1 unidad).

#### Rendimiento

- `utils/featureInfoUtils.js`: el caché de columnas/tipos de geometría ahora tiene tres mecanismos extra encima del LRU de 500 entradas existente:
  - **Cache negativo con TTL de 60 s** (`negativeCache`): si un `DescribeFeatureType` falla (red, 429, XML inválido) o si la respuesta no incluye el typename pedido, se anota la falla y `fetchGeometryColumns` no vuelve a reintentar hasta que expire. Resuelve los `429 Too Many Requests` repetidos contra `/geoserver/wfs` al activar varias capas seguidas.
  - **Dedupe in-flight** (`inflightByKey`): si `useAlwaysOnTopPinning` y `LayerDetailModal` piden la misma capa simultáneamente, sale una sola petición y ambos consumers comparten la promesa.
  - **Batch por microtask** (`pendingByUrl` + `resolversByKey`): las llamadas síncronas dentro del mismo tick (típico `Promise.all(idsToCheck.map(...))` en `useAlwaysOnTopPinning`) se agrupan en una sola petición WFS con `TYPENAME=a,b,c,...`. Activar 5 capas a la vez = 1 request, no 5.
- La firma pública (`fetchGeometryColumns`, `fetchGeometryType`) no cambió: los call sites (`useAlwaysOnTopPinning`, `LayerDetailModal`, `featureInfoService`) siguen funcionando sin tocarlos.

#### Cambiado

- `pages/maps/helpers/layers/utils/layerHelpers.js`: nuevo helper `collectCatalogUnits(layer)` que recorre el árbol y cuenta como **una sola unidad** cada nodo `forceGroup` (absorbiendo sus hijos), respeta `isLabel`/`isCategory` igual que `unifiedLayers` en `useActiveLayersLogic`, y cuenta como uno cada leaf con `wmsConfig`. `collectLayersWithWMS` se mantiene intacto porque `useFeatureInfo` necesita enumerar todos los descendientes activos al consultar features por click.
- `pages/maps/helpers/markerDefinitions.js`: `computeIiegStats` pasa de `collectLayersWithWMS` a `collectCatalogUnits` para `totalLayers`. La cifra "Capas disponibles" del marcador IIEG ahora coincide con cómo se ven los items en el panel de capas activas (un grupo + sus hijos = 1 entrada).

#### Documentacion

- `docs/cache.md`: actualizadas las entradas `geometryColumnCache`/`geometryTypeCache` con las nuevas constantes (`NEGATIVE_TTL_MS`, `inflightByKey`, `pendingByUrl`, `resolversByKey`) y se quita el comentario de deuda técnica al pie de la guía rápida.

## [1.24.0] - 2026-05-13

### Hardening del widget embebible: fallback, defense-in-depth, auditoría y Core Web Vitals

Ciclo de auditoría sobre el widget `<iieg-mapalab>` (DevOps + gobernanza). Se cubren los cuatro puntos técnicos: fallback con UX clara, defensa en profundidad contra clickjacking, auditoría de accesos con retención y captura de Core Web Vitals + errores JS desde sitios huésped.

#### Widget (`widget/`) — bump a `1.1.0`

- `src/element.js`: timeout configurable (`ready-timeout-ms`, default 8s) que dispara un overlay con botones "Reintentar" y "Abrir mapa en MapaLab" cuando el iframe no emite `mapalab:ready`. Manejo explícito de `mapalab:error` con el mismo overlay y mensaje específico del visor. Footer "Fuente: IIEG" en la esquina inferior derecha cuando el mapa carga. Nuevo evento `mapalab:timeout` para que el host externo pueda reaccionar (`{ ms, reason: 'no_ready_received' }`).
- Bundle pasa de ~19 KB a ~23 KB (8.4 KB gzip). Cero dependencias nuevas (sigue siendo solo Lit).

#### Visor embebido (`frontend/src/pages/embed/`) — bump a `1.24.0`

- `EmbedView.jsx`: validación cliente de `dominiosPermitidos` contra `document.referrer` (defense-in-depth contra clickjacking, complementa la validación server-side). Si el host externo no está en la allowlist, rinde `EmbedError` sin esperar a fallar el WMS proxy.
- `EmbedError.jsx`: botones "Reintentar" / "Abrir el visor completo" + atribución IIEG.
- `hooks/useEmbedTelemetry.js`: captura LCP, CLS, INP, FCP, TTFB con `web-vitals` + listeners de `error` y `unhandledrejection`. Envía via `navigator.sendBeacon` con fallback a `fetch keepalive`. Debounce 1.5s, máximo 8 vitales y 5 errores por flush. Marca `IFRAME_READY` cuando el visor monta para medir tiempo de arranque end-to-end.
- `hooks/useEmbedViewSync.js`: además de emitir `mapalab:viewchange`, ahora escucha `mapalab:setview` para que el admin pueda controlar el view del iframe sin recargar (necesario para "cargar vista guardada").
- `helpers/postMessage.js`: nuevo `postViewChange(payload)`.

#### Backend (`backend/app/`)

- `routers/embed.py`: nuevo endpoint `POST /embed/telemetry` (valida key, registra histograma + counters, sin contar para cuota). Validación de capas devuelve mensajes claros en español. `_validate_or_403` registra cada acceso (allowed/denied/quota_exceeded) en el access logger.
- `services/access_logger.py`: buffer in-memory + flush periódico cada 30s a Mariachi (`POST /internal/mapalab/keys/accesos`). Hash de IP con SHA-256 usando `MAPALAB_INTERNAL_TOKEN` como salt.
- `server.py`: `access_flush_loop` registrado en `lifespan` con flush final al apagar.
- `services/api_key_validator.py`: `ValidationResult.dominios_permitidos` agregado para que el visor lo use en defense-in-depth.
- `metrics.py`: API `observe()` para histogramas + serialización Prometheus completa con buckets. Nuevas métricas: `mapalab_embed_telemetry_total`, `mapalab_embed_vital_ms` (histograma con label `metric=LCP|CLS|INP|FCP|TTFB|IFRAME_READY`), `mapalab_embed_js_errors_total`.

#### UX del visor full (`frontend/src/pages/maps/components/ShareModal.jsx`)

- Lenguaje no técnico en español plano: "Estás viendo un mapa compartido" en vez de "Usando link compartido", "Hiciste cambios al mapa" en vez de "Estado modificado", botón "Generar enlace para compartir" en vez de "Crear enlace".
- Pestañas renombradas: "Compartir enlace" / "Insertar en otro sitio" (antes "Enlace" / "Embeber").
- Mensajes de error con caja roja y botón × para cerrar (antes era `<p>` sin descartar).

#### Notas

- Los pendientes de gobernanza (clasificación, T&C versionados, linaje, SLA visible, notificaciones de cambio) quedan documentados en `docs/planes/widget-pendientes.md` para retomar.
- El malentendido del auditor sobre "SIEEJ" se aclara: el widget vive en MapaLab; SIEEJ es solo uno de los sitios huésped.

---

## [1.23.0] - 2026-05-13

### Panel de mediciones consume catalogo remoto de simbolos

El catalogo hardcoded de emojis (`pages/maps/helpers/emojiCatalog.js`, 8 categorias y ~1000 emojis) se reemplazo por un fetch al endpoint publico de mariachi `GET /api/mapalab/symbols/catalog`. El admin puede agregar/quitar emojis, SVGs o imagenes desde `/mariachi/mapalab/simbolos` y los cambios se reflejan sin redeploy.

### Agregado

- `services/symbolsService.js`: fetch + cache en memoria del catalogo, con `invalidateSymbolCatalog()` para forzar recarga.
- `pages/maps/hooks/useSymbolCatalog.js`: hook React que carga el catalogo al montar el componente.
- `pages/maps/helpers/drawingStyles.js::createSymbolStyle(symbol, rotation, scale, selected)`: ruta segun `kind`:
  - `emoji` → reusa `createEmojiStyle` (TextStyle).
  - `svg` → IconStyle con data URL (`image/svg+xml;base64,...`).
  - `image` → IconStyle apuntando al URL del bucket Acervo.

### Cambiado

- `pages/maps/components/MeasurementTools/EmojiPanel.jsx`: consume el catalogo via hook. Renderiza el preview correcto segun el `kind` del item. Las clases CSS del panel quedan identicas (sin cambios visuales).
- `pages/maps/hooks/useEmojiTemplate.js`: el state ahora guarda el objeto `{kind, value, imageUrl, id}` en lugar de solo un string. Acepta entrada tipo string (legacy) o tipo objeto.
- `pages/maps/hooks/useMapDrawing.js`: al dibujar tipo `Emoji`, persiste `symbolPayload` en la feature y rutea por `createSymbolStyle` en lugar de `createEmojiStyle`.

### Eliminado

- `pages/maps/helpers/emojiCatalog.js`: el catalogo ya no vive hardcoded. La fuente de verdad es ahora `mapalab.symbols` en dataengine, administrado desde mariachi-admin.

---

## [1.22.0] - 2026-05-12

### Acople del panel de mediciones al sider restaurado

El panel de herramientas de medicion volvio a deslizarse con el ancho del sider y alinearse verticalmente con el boton "Herramientas", en lugar de quedar fijo en la esquina superior izquierda detras del sider.

#### Causa raiz

Desde `1.13.0` (`682da9f`), el item `tools` del menu lateral pasa de `hasMenu: false` (con `onClick`) a `hasMenu: true` (con submenu `ToolsMenu`). El item declara `ref: toolsButtonRef` esperando que `MenuItem` lo asigne al DOM, pero `MenuItem` solo propagaba `item.ref` en la rama `!item.hasMenu`. En la rama de items con submenu, el `<button>` usaba unicamente un `buttonRef` local (anchor del `<Panel>` desplegable), por lo que `toolsButtonRef.current` quedaba en `null` permanentemente.

`useSiderAdaptivePosition({ anchorRef: 'tools' })` en `ToolsPanel.jsx` lee ese ref para calcular `topPosition = anchorRect.top` y `leftPosition = width + siderOffset`. Con el ref vacio caia al `else` final que no setea `topPosition` y deja `leftPosition = leftOffset(16)`, colocando el div `fixed z-10` en la misma esquina que el sider (`z-20`) y por debajo en z-index.

#### Fix

`src/pages/maps/components/MenuItem.jsx`: el `<button>` de la rama `hasMenu: true` ahora usa un callback ref que asigna el nodo tanto al `buttonRef` local (que sigue siendo el anchor del `<Panel>`) como a `item.ref` cuando esta presente, soportando refs tipo objeto y funcion. Con esto `toolsButtonRef` apunta al DOM real y el `ResizeObserver` del sider re-dispara el calculo al expandir/colapsar.

## [1.21.1] - 2026-05-12

### Pin de capas-borde sobre poligonos

Las capas de limite (`limite_iieg`, `limite_municipal`, `regiones`, `limite_inegi`, `limite_municipal_inegi`) se fijan automaticamente arriba del mapa cuando hay otra capa de tipo poligono activa, para que sus etiquetas no queden tapadas por coropletas tematicas.

#### Frontend

**Nuevos:**
- `src/pages/maps/hooks/useAlwaysOnTopPinning.js`: hook que detecta poligonos no-borde via `fetchGeometryType` (WFS `DescribeFeatureType`). Devuelve `Set<pinnedIds>` con las capas-borde activas a pinear. Excluye capas de fondo via `BACKGROUND_POLYGON_LAYER_NAMES` (`general:cuerpos_de_agua_50k`, `economia:cultivos`, `recursos:areas_naturales_protegidas`). Regla desactivada en swipe AB. Exporta `PIN_Z_OFFSET=9000` y `sortItemsWithPinnedFirst(items, pinnedSet, initialOrder)`.
- `src/assets/icons/ico_pin_normal.svg` + `ico_pin_hover.svg`: thumbtack 24x24 siguiendo estilo `ico_*` (gris `#465055` / morado `#70308A`).

**Refactorizados:**
- `src/pages/maps/hooks/useWMSLayerManager.js`: acepta `pinnedLayerIds` + `initialOrder`. Override de `maxZIndex = PIN_Z_OFFSET + (order.length - effectiveIdx)` cuando el grupo esta pin-eado, respetando `initialOrder` entre multiples pin-eadas. Nuevo effect que dispara re-update cuando cambian estos.
- `src/pages/maps/components/MapView.jsx`: instancia `useAlwaysOnTopPinning` con `compareModeActive` apropiado por pane (live vs swipe) y pasa `pinnedLayerIds`+`initialOrder` al manager.
- `src/pages/maps/components/ActiveLayers/ActiveLayersList.jsx`: aplica `sortItemsWithPinnedFirst` para que el panel quede WYSIWYG con el mapa.
- `src/pages/maps/components/ActiveLayers/ActiveLayerItem.jsx`: acepta prop `isPinned`. Cuando es true oculta `DragHandle` y renderiza `PinBadge`.
- `src/pages/maps/components/ActiveLayers/LayerItemHeader.jsx`: nuevo export `PinBadge` con tooltip explicativo.

**Tests:**
- `src/test/pages/maps/hooks/useWMSLayerManager.test.js`: 4 casos nuevos (z-index normal sin pin, override con pin, no afecta no-pin-eadas, respeta `initialOrder` entre multiples).

#### Documentacion
- `docs/planes/PLAN_BACKGROUND_POLYGON_EDITABLE.md` (nuevo): plan para mover la lista de fondos a un flag `es_fondo_visual` editable desde mariachi (migracion, backend, UI, cleanup frontend).

#### Operacional
- `Makefile`: `make deploy` ahora purga `/var/cache/nginx/mapalab_assets/*` en el gateway-hub antes del reload, para evitar servir `index.html` viejo tras un deploy.

## [1.21.0] - 2026-05-08

### Reportes: migrar a widget Colibri

Reemplaza el sistema propio de reportes (`ReportModal` + `feedbackService`) por el widget embebible de Colibri (`/colibri/widget/colibri-widget.v1.js`) para centralizar reportes del ecosistema IIEG en un solo backend con stats, dedupe, fan-out a Discord/Slack y form dinamico.

#### Frontend

**Componentes nuevos:**
- `src/hooks/useColibriOpen.js`: hook que dispara el panel global de Colibri. Construye `auto`/`user`/`sourceContext` con snapshot del mapa (basemap, capas activas, view, compare mode), llama `window.colibri.identify()` con datos del usuario logueado y `setContext()` con el resto.

**Refactorizados:**
- `src/components/ReportButton.jsx`: pasa de envolver `ReportModal` propio a un `<button>` HTML con tailwind matching el lenguaje visual del mapa (bg blanco, text gris hover morado, w-7 h-7 md:w-6 md:h-6, rounded-full, shadow sutil). Variant `inline` mantiene estilo link-with-icon.
- `src/pages/maps/components/MapAttribution.jsx`: el boton se monta como hermano del pill de Contribuciones en el mismo flex container (`gap-2`). Mismo alto, alineado a la izquierda.
- `src/pages/maps/components/InfoBox/InfoBox.jsx`: el handler `action='report'` del marker IIEG ahora llama `useColibriOpen({ source: 'iieg_marker' })`.
- `src/pages/home/components/Footer.jsx`: el boton se envuelve en `<div className="fixed bottom-4 right-4 z-50">` para que flote sobre el home.

**Eliminados:**
- `src/components/ReportModal.jsx`, `src/services/feedbackService.js`, `src/test/services/feedbackService.test.js`, `src/pages/maps/components/MapReportButton.jsx`.

#### Infraestructura

- `frontend/index.html`: `<script src="/colibri/widget/colibri-widget.v1.js" defer>` antes de `</head>`. CSP `script-src 'self'` lo permite (path relativo).
- `frontend/vite.config.js`: nuevo proxy `/colibri` -> `MARIACHI_DEV_TARGET`.
- `frontend/Dockerfile` + `docker-compose.yml`: ARGs y env vars `VITE_COLIBRI_SOURCE_APP=mapalab` y `VITE_COLIBRI_API_KEY` (en frontend dev y frontend-build args).
- `.env.example`: documenta las dos vars.

#### Compatibilidad

El endpoint publico (`POST /api/public/reportes`) es el mismo. Los reportes anteriores se conservan en la BD. El widget agrega header `X-Colibri-Key` para autenticar como `source_app=mapalab` con CORS dinamico, rate limit por huesped, dedupe y fan-out.

#### Pendiente

Recuperar el `captureFn` del mapa (screenshot pre-renderizado) requiere un metodo nuevo `attachScreenshot(blob)` en el widget de mariachi.

## [1.20.3] - 2026-05-07

### Corregido
- **Panel de capas activas: ya no se traslapa con la atribución del mapa**: cuando el panel crecía a la altura completa del viewport, su borde inferior chocaba con `<MapAttribution>` (badge "Contribuciones ©" + `ReportButton` flotante en la esquina inferior derecha). Se aumenta la reserva inferior del `Panel` que envuelve `<ActiveLayersList>` (en `MapLayersPanels.jsx`) de `7.5rem`/`8rem` a `9.5rem`/`10rem` para desktop/mobile. Pierde ~32 px de altura útil del panel a cambio de mantener la atribución visible (requisito legal de OSM/Carto).

## [1.20.2] - 2026-05-07

### Corregido
- **Eventos: revertir persistencia por sesión de bbox-fit y auto-activación de capas**: en v1.20.0 se introdujo un flag en `sessionStorage` (`evento:zoomed:{id}` y `evento:auto-activated:{id}`) para que cerrar y reabrir el menú del evento no volviera a centrar el mapa ni a prender las capas con `autoActivar=true`. La interacción con el editor (cambios de capas, redeploys, ediciones) podía dejar el flag obsoleto y bloquear la auto-activación de capas legítimas. Se elimina el `sessionStorage` y se vuelve al comportamiento original: cada apertura del menú dispara bbox-fit y auto-activa las capas marcadas. Si en el futuro se quiere reintroducir la persistencia, debe versionarse con un hash de las capas del evento o moverse a un toggle de configuración del usuario.

### Documentación
- `docs/cache.md`: removidas las filas de `evento:zoomed:*` y `evento:auto-activated:*` (ya no aplican).
- `docs/context.md`: actualizado el comportamiento de `<EventoMenu>` (sin persistencia).

## [1.20.1] - 2026-05-07

### Corregido
- **Swipe — preservar `defaultDate` al activar capas durante swipe**: `setLayerSlotMembership` ahora hereda opacidades y filtros del live state cuando la capa no está en ningún slot previo (antes el snapshot recién creado sobreescribía el filtro de fecha aplicado por `applyDefaultDate`, dejando rasters mensuales sin TIME activo).
- **Swipe — shape completo al deserializar**: `useShareSerializer`/`useShareDeserializer` arman `compareMode` partiendo de `initialCompareMode()` y reconstruyen `globalOrder` desde paneA+paneB. Así `exitCompareMode` siempre encuentra `originalSnapshot` y los reorden cross-slot conservan el orden del share.
- **Swipe — `reorderInSlots` aplica el snapshot al live**: el orden visual y el live state ya no divergen tras un drag entre slots.
- **Swipe — `useSymbology` reactivo a cambios de `compareMode`**: antes recibía un ref con identidad estable, así que el efecto que recalcula `selectedLayerForSymbology` no corría al cambiar membership de slots.

### Cambiado
- **Persistencia segura del comparador**: `helpers/swipeMode.js` agrega `safeStructuredClone` (con fallback `JSON.parse(JSON.stringify(...))`), `isValidStoredSnapshot` (validación de shape) y `SNAPSHOT_MAX_BYTES` (100 KB). `enterCompareMode` limpia el snapshot anterior antes de escribir uno nuevo, y solo escribe si el payload está bajo el límite. `useInitializeFromUrl` rechaza `sessionStorage` con tamaño mayor a 200 KB y valida `version`/`kind`/`payload` antes de invocar el deserializer.
- **Comparador — orientación persistida**: la orientación del swipe (`vertical`/`horizontal`) se guarda en `localStorage.mapalab.swipe.orientation` y se restaura al entrar a swipe. Antes siempre arrancaba en vertical.
- **Naming homologado**: `enterSwipeMode` → `enterCompareMode` (simétrico con `exitCompareMode`). El gesto táctil para descartar tarjetas del InfoBox `SwipeToRemove` se renombra a `DismissGesture` para evitar la colisión semántica con el modo comparador.
- **Tema visual centralizado**: nuevo `helpers/swipeTheme.js` con `SLOT_COLORS = { A, B }` y `SWIPE_HANDLE_COLOR`. `<SwipeView>`, `<SlotBadge>` y `swipeComposition.js` consumen del tema en lugar de literales `#5C2472`/`#FF8300`/`#F0EAF3`/`#FFF2E5` repartidos.
- **Helpers puros del comparador**: `purgePane`, `addIdsToPane`, `computeGlobalOrder`, `snapshotFromLive` extraídos a `helpers/swipeMode.js` (testables sin React). `useSwipeMode` queda como orquestador.
- **Constantes nombradas**: `SWIPE_POS_MIN/MAX`, `SWIPE_HANDLE_MIN/MAX`, `SWIPE_KEYBOARD_STEP`, `SWIPE_DEBOUNCE_MS`, `SWIPE_POS_THRESHOLD`, `SWIPE_POS_JITTER` reemplazan magic numbers en `<SwipeView>` y `useSwipeMode`.
- **Accesibilidad del comparador**: el handle del `<SwipeView>` pasa de `role="separator"` no-interactivo a `role="slider"` con `aria-label`, `tabIndex={0}` y soporte de teclado (←/→ vertical, ↑/↓ horizontal, paso 5%, `Home`/`End` para extremos). Overlays "A"/"B" gigantes marcados `aria-hidden="true"`. `<SlotBadge>` recibe `aria-label` con la oración completa del tooltip.

### Rendimiento
- **Swipe — mapas reactivos eliminan polling**: nuevo `paneMapInstances` (state) en `MapsContext` poblado por `<MapView>` cuando `useMapInitialization` retorna su instancia. `useViewSync` reescrito para reaccionar al state (antes hacía hasta 50 timeouts × 50 ms al entrar a swipe). `useScaleLineControl` detiene el `setInterval` (250 ms) en cuanto encuentra un map; el polling permanente cada 100 ms quedó eliminado.
- **`MapView` — `useMemo` del `paneSnapshot` con dep refinada**: ahora depende solo del pane relevante (`paneIndex === 0 ? paneA : paneB`); cambios en B ya no re-evalúan el memo del pane A y viceversa.
- **`SwipeView` — flag `externallySetRef`**: distingue cambios externos de `swipePosition` de cambios locales del drag para no re-emitir `setSwipePosition` en respuesta a un set externo.
- **`MapsProvider` — `liveStateRef` en `useLayoutEffect`**: la asignación queda comprometida después del render committed, segura con StrictMode/Concurrent. Antes se reasignaba en cuerpo del render.
- **`MapView` — cleanup de `paneMapRefs` valida identidad**: solo elimina la entrada si todavía es la propia, evitando que un mount nuevo durante StrictMode borre la entrada del segundo render.

### Documentación
- `docs/swipe.md` actualizado: nueva sección **Invariantes**, tabla de **Constantes**, sección **Accesibilidad**, descripción del par `paneMapRefs`/`paneMapInstances`, mención del `SNAPSHOT_MAX_BYTES`.
- `context.md` refleja la nueva arquitectura del comparador (helpers puros, theme, paneMapInstances, persistencia de orientación, naming `enterCompareMode`).

### Tests
- Nuevo `useSwipeMode.test.js` con 13 casos: enter/exit, ciclo `A → AB → B → A`, herencia de filtros desde live, reorden, set/clear filter por slot, visibility por slot, clamps de `setSwipePosition` y persistencia de orientación.

## [1.20.0] - 2026-05-07

### Agregado
- **`EventoContext` separado del `MapsContext`**: nuevo provider en `providers/EventoProvider.jsx` que envuelve los children dentro de `MapsProvider` y expone `{ eventos, loading, error, activeEvento, setActiveEvento, findEventoByLayerId, getLayerIdsByEvento }`. Hook de acceso `useEventoContext` en `hooks/useEvento.js`. Reduce el rerender del árbol del visor cuando cambia el evento activo o cuando llega refresh de eventos por el watcher de versiones. `MapsProvider` deja de exponer `activeEvento`/`setActiveEvento`; consumidores (`EventoMenu`, `LayerDetailModal`, `LayerDetailHeader`, `MapSider`) leen del nuevo contexto.
- **Persistencia por sesión de la apertura de evento**: `EventoMenu` ahora marca en `sessionStorage` (`evento:zoomed:{id}`, `evento:auto-activated:{id}`) que ya disparó el bbox-fit y la auto-activación de capas. Cerrar y reabrir el mismo evento dentro de la sesión ya no hace re-zoom ni vuelve a prender capas que el usuario haya apagado manualmente. Se resetea automáticamente al cerrar la pestaña.
- **Telemetría de eventos**: nuevos `evento_open` y `evento_close` (con `withMapInteraction`) en `analyticsService.js`; `EventoMenu` los dispara en mount/unmount con `evento_id` y `titulo` (sólo en open).

### Cambiado
- **`useEventos` ahora expone `{ eventos, loading, error }`**: contrato homologado con el resto de hooks de datos del proyecto. Inicial `loading=true` para que los consumidores puedan diferenciar "todavía no llegaron" de "no hay eventos".
- **`eventoHelpers` con index plano O(1)**: nueva `buildLayerIndex` aplana el árbol a un `Map` de claves `workspace|layer → node` y `buildEventoIndex` produce `{ eventoByLayerId, layerIdsByEvento }` reutilizable. `findLayerByWorkspaceLayer`, `getEventoLayerIds` y `findEventoByLayerId` siguen exportados pero ahora delegan al index. `LayerDetailHeader` usa el lookup centralizado en lugar de recorrer el árbol cada apertura del modal.
- **`ExternalEventoWidget` con item por evento aislado**: nuevo sub-componente interno `ExternalEventoItem` que tiene su propio `useMemo` por evento. Al togglear capas ya no se reconstruye el array completo de items: cada `MenuItem` recibe la misma referencia mientras su evento no cambie.
- **Polling de `cache-version` se pausa con la pestaña oculta**: `eventosService.startMapalabCacheVersionWatcher` ahora `clearInterval` en `visibilitychange→hidden` y reinicia con `setInterval` + `checkVersions` inmediato en `→visible`. Antes el `setInterval` seguía vivo aunque la pestaña no fuera visible.
- **Naming homologado en eventos**: `EventoIconButton` recibe `iconoUrl`, `imagenUrl`, `titulo` (alineado con la API). Se elimina el mapping inglés (`iconUrl`, `imageUrl`, `title`) en `ExternalEventoWidget` y `menuItems`. `LayerThemeAvatar` se mantiene genérico (`imageUrl`).
- **Tokens Tailwind para colores recurrentes de eventos**: nuevos `--color-purple-soft` (#F0E6F6), `--color-purple-deep` (#703088) y `--color-graphite` (#465055) en `index.css`. `EventoMenu`, `EventoIconButton` y `LayerDetailHeader` usan los tokens en lugar de literales `bg-[#...]`.
- **Imágenes de eventos con `loading="lazy" decoding="async"`** en `EventoIconButton` y `LayerThemeAvatar` para evitar bloqueo del render al abrir el sider.
- **Deps estables en `EventoMenu` para `setActiveEvento`**: en lugar de depender de la referencia del `Set` de `eventoLayerIds` (que cambiaba aunque el contenido fuera idéntico), se deriva una clave string ordenada (`Array.from(...).sort().join('|')`) y se usa esa como dep.

### Rendimiento
- **`EventoMenu` ya no causa re-set redundante del contexto** cuando se rebuilda el `Set` con el mismo contenido (gracias a la dep estable).
- **`LayerDetailHeader` con lookup O(1)** del evento por `selectedLayerId` (antes recorría todos los eventos × capas × árbol de capas en cada cambio).
- **`useEventos` y `useEventoLayerIndex` centralizados en el provider**: `MapSider` y `LayerDetailHeader` ya no llaman `useEventos()` por separado, comparten una sola suscripción a través del contexto.

### Documentación
- `context.md` actualizado con la nueva jerarquía de providers (`EventoProvider`), la sección de Modal de detalle ahora referencia `EventoContext` en lugar de `MapsContext`, y la lista de eventos de Analytics incluye `evento_open` / `evento_close`.
- `analytics.md` agrega filas para `evento_open` y `evento_close`.
- `cache.md` documenta las claves `evento:zoomed:*` y `evento:auto-activated:*` de sessionStorage y la pausa del watcher de versiones.

## [1.19.0] - 2026-05-06

### Agregado
- **Modal de detalle: identidad del evento**: cuando la capa abierta en `<LayerDetailModal>` pertenece a un evento (configurado en mariachi), el header reemplaza el avatar/título del tema por el ícono y nombre del evento. Prioriza el evento activo en el menú lateral; si el menú está cerrado (por refresh u otra navegación), recorre la lista de eventos y resuelve por la primera coincidencia. Nuevo `<LayerDetailHeader>`. `<LayerThemeAvatar>` extendido con prop `imageUrl`. `MapsContext` expone `activeEvento` (`{ id, titulo, iconoUrl, imagenUrl, layerIds }`) que `<EventoMenu>` setea/limpia mientras está montado. Helpers compartidos en `pages/maps/helpers/eventoHelpers.js` (`findLayerByWorkspaceLayer`, `getEventoLayerIds`, `findEventoByLayerId`); `<EventoMenu>` deja de duplicar la lógica.

## [1.18.1] - 2026-05-06

### Cambiado
- **Sidebar de mapas**: `createCategoryItems` ahora filtra los temas raíz con `hiddenInMenu=true`. Antes el filtro solo aplicaba a los hijos dentro de un tema, no a los temas mismos. Esto permite que mariachi cree temas-contenedor ocultos (como `eventos-auto`, padre de las capas auto-creadas para eventos) sin que aparezcan como botón de categoría en el sidebar; las capas siguen siendo encendibles desde el menú del evento o por la búsqueda global.

## [1.18.0] - 2026-05-06

### Agregado
- **Marker IIEG con stats dinámicas**: Muestra tarjetas con capas activas, registros totales y líneas de código. Estadísticas cargadas vía backend `/metadata/database-stats` con caché de 1h y asíncronas al click del logo. Soporte para el comparador en paneles swipe.
- **Loop controls visibles en panel**: Los controles de bucle temporal ahora son visibles directamente desde el panel de capas activas cuando `canPlayLoop` es verdadero, con nuevos layouts. Nuevo tamaño `lg` para DatePill y ajustes visuales en SlotBadge.
- **Mejoras SEO**: Etiqueta canonical, JSON-LD estructurado enriquecido (@graph con Organization, Place, WebSite), tags de verificación y noscript expandido en `index.html`. H1 ocultos por página con keywords en `Home.jsx` y `Maps.jsx`. `sitemap.xml` y `robots.txt` eliminados de la carpeta public (servidos por gateway).
- **Home UI**: El logo de Mapalab se muestra siempre extendido en móviles. Reorganización de columnas a una sola hasta el breakpoint `lg`.

### Cambiado
- **Fix Swipe**: El zoom, centrado, locate y clicks ahora activan correctamente el slot del pane correspondiente (A/B) utilizando `getActiveMap()`. Se introdujo `useViewSync` para compartir la vista de manera más eficiente entre paneles.
- **Refactor InfoBox**: Se removió el botón "Reportar" inline del InfoBox para limpiar la interfaz.

### Documentación
- `swipe.md` reescrito para clarificar el flujo de paneles.
- `periodicidad.md` actualizado incluyendo la lógica de backend y caché.
- `context.md` actualizado con ajustes de redacción leader-follower.

## [1.17.0] - 2026-05-04

### Agregado
- **MCP server montado en `/mcp`** del backend (expuesto al exterior bajo `/api/mcp/`). Construido con FastMCP a partir de un sub-app FastAPI que registra los routers `metadata`, `periodicity`, `layers` y `shares` (se excluyen `download` por su tamaño/streaming y `metrics` por ser interno de Prometheus). El `lifespan` del backend se compone con el de FastMCP via `combine_lifespans` para preservar el warmup del pool, el leader election y el scheduler. `nginx/nginx.conf` agrega `location /api/mcp/` con `proxy_buffering off`, `proxy_cache off` y timeouts de 600s para soportar el transporte HTTP streamable de MCP. Por ahora el endpoint queda público (mismo perfil que el resto del API); restringir a futuro vía gateway si se requiere.
- **`GET /ontoy`** en mapalab-backend: devuelve `{slug, label, version}` para que mariachi-admin pueda detectar la versión y healthy del backend desde el dashboard `/inicio`. La versión se lee de `app/__version__.py` (nuevo archivo) que se mantiene sincronizado con `frontend/package.json` al bumpear el repo. Convención del ecosistema IIEG: cada repo expone su `/ontoy` para que se descubra.
- **Sistema de reportes ciudadanos**: nuevo botón "Reportar" (icono `bug`) en cuatro puntos del visor — flotante junto a `MapAttribution`, inline en la columna de acciones del `InfoBox` cuando hay feature seleccionada (con `feature_id`/`layer_id`/`feature_properties` en el contexto), entrada en el `iconText` del marker IIEG (`action: 'report'`), e icono flotante en la esquina inferior derecha del footer de Home. Modal con tipo (problema/solicitud/sugerencia/duda/datos incorrectos/bug), mensaje (max 2000), email opcional (queda anónimo si se omite) y captura de pantalla opcional reutilizando `captureElement` de `useMapCapture` (`html2canvas-pro`, `scale: 0.7`). Honeypot oculto y rate limit del lado de mariachi. Los reportes viajan a `POST /api/public/reportes` de mariachi y se administran desde la nueva sección "Reportes" del admin.
- **`useReportContext` + `feedbackService`**: hook que arma `source_app`/`source_route`/`source_context` (app_version, user_agent, screen, basemap, capas activas, vista del mapa, swipe) y servicio que postea como `multipart/form-data` con manejo de 429 (`code: 'rate_limited'`).
- **Evento de analytics `report_submitted`** con `tipo` y `source_route`.
- **Icono `bug`** inline en `Icon.jsx`.
- **Proxy `/api/public` → mariachi en Vite** (dev): nueva regla en `vite.config.js` para rutear el endpoint público de reportes al `MARIACHI_DEV_TARGET` (mismo target que `/api/mapalab`).

## [1.16.0] - 2026-05-04

### Agregado — Acciones del item activo y mejoras al swipe
- **`<CloseButton>` reutilizable** (`@components/CloseButton`): extraído del antiguo `MeasurementTools/CloseButton`. Acepta `tooltip`, `confirmTitle`, `confirmDescription`, `confirmText`, `confirmPlacement` (`top`/`bottom`), `confirmClassName`, `size`, `iconSize`. Mantiene los estilos rosa/cerrar (`bg-[#FFE6EC]` → `bg-[#FF577D]` activo) y el `<ConfirmDropdown>` de aviso. Lo usan ahora `MeasurementTools/ToolsPanel` y `SwipeSlotControls`.
- **`<ConfirmDropdown>` con prop `placement`** (`top` | `bottom`, default `bottom`): permite que el dropdown se abra hacia arriba para botones que viven al pie de la pantalla (e.g. el cerrar del comparador).
- **Botón Descargar inline en panel de capas activas** (`<LayerActionsBar>`): junto al de opacidad. Click abre el `<DownloadMenu>` existente (mismo flujo que el modal de detalles, no descarga directa). Durante descarga muestra un spinner y permite cancelar. Sólo aparece si `metadata.capa_descargable !== false`. Reutiliza `useLayerMetadata`, `useLayerDownload` y `<DownloadMenu>`. Sólo carga metadata cuando el item está expandido.
- **Spinner Lottie en leyenda inline** (`<LayerLegendInline>`): mientras la imagen WMS GetLegendGraphic carga, se muestra el `<Logo name="mapalab" isLoading />` (mismo Lottie del modal de detalles). El contenedor sólo aplica `min-h-[40px]` mientras `!isLoaded`; al cargar la imagen toma altura `auto`.
- **Tooltips dinámicos por slot en swipe** (`<LayerActionsBar>` y `<LayerInlineActions>`): visible/ocultar/opacidad/descargar/leyendas anexan `del lado A` o `del lado B` según `slotMembership`. Para acciones destructivas en `AB` (ocultar) se agrega `(seguirá en el lado X)`.
- **`globalOrder` en `compareMode`**: nuevo array que dicta el orden de la unión `paneA + paneB` en `effectiveActiveLayerIds`. `setLayerSlotMembership` lo extiende con IDs nuevos al final, `removeLayerFromSlot` lo limpia, `reorderInSlots` lo sobreescribe. Permite reordenar items en swipe aunque las capas estén en slots distintos (antes la unión siempre concatenaba paneA primero y el reorden cross-slot se "regresaba").
- **`reorderInSlots(newGlobalOrder)`** en `useSwipeMode`: actualiza `paneA.activeLayerIds`, `paneB.activeLayerIds` (preservando solo los IDs que cada pane tiene en el nuevo orden) y `globalOrder`. `ActiveLayersList` lo usa via `handleReorder` cuando `compareMode.active`.

### Cambiado
- **Botón Cerrar del comparador** (`<SwipeSlotControls>`): ahora es un `<CloseButton>` separado. Si hay periodicidad seleccionada (`showA || showB`) sale arriba de la barra, alineado verticalmente con el botón de orientación; si no hay periodicidad, queda dentro de la barra a un lado del orientation. Confirma el cierre con dropdown `(¿Cerrar la comparación? Se descartará la comparación actual y volverás al estado original del mapa.)`.
- **Layout de la barra de acciones del comparador**: vuelve a `flex` simple cuando hay date pills, dejando que el `bg-white rounded-full` se ajuste al contenido. `<DatePill>` acepta `autoWidth` para que en este contexto los pills no apliquen ancho fijo (el ancho fijo sigue activo en el panel de capas activas para evitar saltos durante loops).
- **Estado activo del botón de leyendas** (`<LayerActionsBar>`): cuando `legendsVisible=true` el botón usa `bg-white border border-[#70308A]` (estilo discreto tipo "selected", consistente con el botón Copiar) en vez del estilo `BUTTON_BASE` con fondo `#F9FBFF`. La flecha sigue morada.
- **Botón Eliminar en swipe**: ahora siempre quita la capa de **ambos** slots (`paneA` y `paneB`). Para mover entre lados se usa la pildora A|B; el botón eliminar es para sacar la capa por completo del comparador. Tooltip vuelve a `"Eliminar capa"` simple.
- **`useWMSLegend` resuelve hijos de grupos**: nuevo helper interno `resolveWMSId(layer)` que si el `layer.id` no tiene `wmsConfig` propio busca en `layer.childIds` el primer descendiente con WMS. Aplica a `hasLegend`, `getLegendUrl` y `getLegendJson`. Antes el botón de leyendas no aparecía para grupos `forceGroup` cuando el panel mostraba el ancestor sin WMS propio.
- **`useActiveLayersLogic.visible` y `useSymbology.toggleLayerVisibility` consideran children activos**: el cálculo de visibilidad de un grupo `forceGroup` considera los hijos que están en `activeLayerIds` (no todos los descendientes del árbol). El toggle detecta correctamente el estado "currently hidden" para evitar que después de un restore con sólo los hijos en `hiddenLayerIds` el click invertido oculte todo en lugar de mostrar.
- **`ScaleLineControl` funciona en swipe**: `useScaleLineControl` ahora recibe un getter `getMapInstance` y polea cambios cada 100ms. En swipe usa `paneMapRefs.current[0].current` (paneA — los dos mapas están sincronizados via `useViewSync`); fuera de swipe usa `ctx.mapRef.current`. Cuando cambia, remueve el `ScaleLine` del mapa anterior (try/catch por si fue destruido) y lo añade al nuevo.
- **Badges del header del panel de capas activas** ahora cuentan items unificados (`unifiedLayers.length`) en lugar de IDs internos. Antes activar una capa de un grupo `forceGroup` con 3 hijos mostraba `4` en los badges aunque visualmente sólo había 1 item en el panel.

### Corregido
- **Periodicidad no se mostraba en el modal de detalles para la primera capa activada**: `useLayerPeriodicity` ahora dispara fetch on-demand vía `ensureFetched(layerId)` cuando el modal abre con un `layerId`, sin depender del `useEffect` global de `activeLayerIds`. Si el fetch falla se quita del `fetchedRef` para permitir reintentos.
- **Bug del ciclo `A → AB → B → A` deseleccionaba el item del panel**: `useSymbology` ahora considera la unión `paneA + paneB` (vía `compareModeRef`) además del live state al validar `stillActive` y al construir candidatos para fallback. Antes el live state perdía la capa al cambiar de slot y el effect deseleccionaba aunque la capa siguiera en el otro pane.
- **Visibilidad y opacidad no se persistían entre refrescos para grupos `forceGroup`**: el `useEffect` cleanup de `useLayerOpacity` corría en mount con `activeLayerIds=[]` y encolaba un updater functional con closure stale. React procesaba el `setLayerOpacities(new Map(...))` del deserialize antes que el updater stale, que veía `prev={4 entries}` y filtraba contra `allActiveIds=[]` borrando todo. Fix: el cleanup-effect skip cuando `activeLayerIds` está vacío. Para visibilidad, `useActiveLayersLogic` y `useSymbology.toggleLayerVisibility` ahora usan `activeChildIds` (children que están en `activeLayerIds`) en lugar de todos los descendientes del árbol.
- **`slotMembership` no detectaba grupos `forceGroup`** cuando el `layer.id` era el ancestor pero los IDs reales en `paneA`/`paneB` eran los hijos. Ahora valida contra `[layer.id, ...layer.childIds]`. Esto destrabó el botón eliminar y los tooltips dinámicos en swipe para grupos.
- **Modal de descarga (`DownloadMenu`) activaba el tooltip warning del item**: el `<Tooltip>` de "Al seleccionar un punto..." ahora se deshabilita mientras `download.menuOpen=true`.
- **`SymbologyPanel` viejo deshabilitado** con flag `SYMBOLOGY_PANEL_ENABLED = false` en `MapLayersPanels.jsx` (archivo y código intactos para reactivar después).

## [1.14.0] - 2026-04-30

### Agregado — Item de capa activa rediseñado a layout vertical
- **`<ActiveLayerItem>` reorganizado en filas verticales** (sin más despliegue lateral en hover desktop): Fila 1 con drag handle (solo en seleccionado o hover) + título; Fila 2 con periodicidad + loop + `<SlotBadge>` centrado matemáticamente al medio del item via CSS Grid `grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]`; Fila 3 con barra de acciones; Fila 4 con leyenda WMS inline. Las filas 2-4 sólo aparecen cuando el item está seleccionado; en hover de no-activo siguen apareciendo los botones inline a un lado del título (`<LayerInlineActions>`).
- **Sub-componentes nuevos** en `ActiveLayers/`: `LayerActionsBar`, `LayerInlineActions`, `LayerLegendInline`, `LayerOpacityPopover`. `LayerItemHeader` se separó en `DragHandle` + `LayerTitle` para permitir reordenar elementos en el header.
- **Botón de opacidad inline** (`<LayerActionsBar>`): por defecto muestra el icono `opacity` (SVG inline nuevo en `Icon.jsx`); cuando la opacidad ≠ 100 % muestra el porcentaje (`75%`, `40%`, etc.). Click abre `<LayerOpacityPopover>` (portal a `document.body` + `position: fixed` calculado desde `getBoundingClientRect()` del botón) que envuelve el slider `<Bar>` reusado del `OpacityControl`. Click outside, Escape o cambio de scroll cierran/reposicionan.
- **Leyenda WMS inline** (`<LayerLegendInline>`): GetLegendGraphic lazy (sólo se monta el `<img>` cuando el item está expandido). Wrapper `bg-white rounded-[10px] shadow` replica las dimensiones del `<SymbologyPanel>` y la imagen va a `dpi: 200` para nitidez retina, limitada visualmente con `max-w-[220px]`. En swipe AB respeta el `activeSlot` (una sola leyenda con el filtro del slot que estás editando).
- **Toggle global "Mostrar/ocultar leyendas"** persistido en `localStorage` (`mapalab.activeLayers.legendsVisible`, default `true`). Hook + provider `useLegendsVisibility` viven en `ActiveLayers/hooks/`. El botón está dentro de `<LayerActionsBar>` por capa (sólo aparece si la capa tiene leyenda WMS): icono `simbologia` cuando off, `upArrow` cuando on. Para el icono off agregamos `ico_simbologia_gray.svg` con el gris `#465055` (mismo que el resto de iconos `*_gray`).
- **Highlight de slot al cambiar `activeSlot` desde el `<Switch>` A-B**: en `<LayerActionsBar>`, click en el switch llama `setHighlightedSlots(target)` y un `setTimeout(() => setHighlightedSlots(null), 1500)` para destacar el panel correspondiente del swipe sin necesidad de hover.

### Cambiado
- **Loop controls sólo visibles cuando `isLooping`** (panel de capas activas): los botones de play/intervalo/dirección dentro del item ya no aparecen como invitación a iniciar el loop. Para arrancar el loop, se usa el "VER ANIMACIÓN" del `<LayerDetailModal>`. Una vez corriendo, los controles aparecen en el panel para pausar/ajustar.
- **`<Tooltip>` global** acepta nuevas props opcionales `triggerBlock` (cambia el wrapper de `inline-flex` a `block`) y `triggerClassName` para que el contenedor pueda expandirse al ancho del padre. Se usa en el warning del item activo (`triggerBlock + w-full`) para que las filas 2-4 ocupen todo el ancho del item.
- **`useWMSLegend.getLegendUrl`** acepta `dateValue` opcional para sobreescribir el filter de fecha; si no se pasa, sigue usando `getFilter(layerId)` (compatible con todos los consumidores existentes).
- **Swipe Intro: modal → tooltip enriquecido**: la info clave (slots vacíos, capas se guardan, agregar una por una) ahora vive en el tooltip del botón "Barra divisora" del `<ToolsMenu>`. Click directo entra a swipe sin paso intermedio.

### Corregido
- **`<SlotBadge>` tooltip atorado al ciclar membership**: agregado `key={membership}` al `<Tooltip>` interno y removido `e.stopPropagation()` de los handlers de mouseEnter/mouseLeave del button — el `<Tooltip>` se desmonta y vuelve a montar al cambiar A → AB → B y el `mouseLeave` del wrapper del Tooltip ya recibe los eventos correctamente.
- **Item activo se "encogía" al ser seleccionado**: el `<Tooltip>` warning del item envolvía el contenido en `display: inline-flex` y colapsaba el ancho. Resuelto con la prop `triggerBlock` nueva.

### Eliminado
- `frontend/src/pages/maps/components/SwipeIntroModal.jsx` y `frontend/src/pages/maps/helpers/swipeIntroStorage.js` — la info pasó al tooltip del `<ToolsMenu>`.
- `frontend/src/pages/maps/components/SwipeSlotFlash.jsx` — el flash centrado tipo "círculo morado/naranja con A o B" al cambiar `activeSlot`. Se reemplaza por el highlight del overlay del panel correspondiente (mucho menos invasivo).

## [1.13.1] - 2026-04-28

### Agregado
- **Click en label de padre activa/desactiva todos los hijos** (`<LayerItem>`): antes el click en el texto del nodo padre solo expandía/colapsaba — el toggle del subárbol estaba escondido detrás del `<Switch>` lateral. Ahora el click en label calcula `isOn = activeLayerIds.includes(layer.id) || allChildrenActive` (la misma señal que ya usaba el switch), llama `onToggle(layer.id, !isOn)` y se apoya en la propagación recursiva existente de `useLayerToggle.handleToggleLayer` (líneas 117-129) que añade/quita `[layerId, ...getAllChildLayerIds(layerId)]`. Si el resultado es activar, fuerza `setIsManuallyExpanded(true)` para que el subárbol quede abierto y se vean los checks marcados; si es desactivar, respeta la expansión actual. Hojas (sin hijos) no cambian. El switch lateral queda intacto.

### Cambiado
- `renderCard.jsx`: refactor del cuerpo del infobox para soportar `blockOrder` (opcional, persistido en `infobox_config`). Cada bloque body (`labels`, `labelGroups`, `list`, `iconText`, `text`, `cards`) extraído a su propia función pura. Si el config trae `blockOrder` con keys válidas, se usa ese orden + remaining defaults al final. Si no trae `blockOrder`, mantiene el orden hardcoded actual (backwards-compatible — los 250 configs existentes siguen renderizando idénticos).

## [1.13.0] - 2026-04-27

### Agregado — Comparador Fase 3
- **`<CompareView>` (split lado-a-lado)**: dos `<MapView>` independientes con sus propios `mapRef`/`targetRef` locales. Header por panel con la etiqueta de la fecha. Layout `flex` 50/50 con borde divisor blanco.
- **`<SwipeView>` (barra divisora)**: dos `<MapView>` superpuestos, el de la derecha con `clip-path: inset(0 0 0 ${pos}%)`. Barra naranja vertical draggable (rango 5%–95%) con handle circular, posicion persistida via debounce 200ms. Cursor `ew-resize`, `touch-none` para mobile. Pan/zoom sincronizados.
- **`useViewSync(paneMapRefs, active)`**: engancha listeners `change:center`/`change:resolution`/`change:rotation` en ambos `View` de OL con flag anti-loop. Polling de mount con backoff hasta que ambos `mapRef.current` estén poblados.
- **`useDateOverride` via `dateOverride` prop**: `<MapView paneIndex dateOverride>` propaga el valor al `useWMSFilterUpdater`, que lo usa como `TIME` en lugar de `getFilter(sub.id)` para capas con `wmsConfig.timeEnabled`. Capas vectoriales con CQL `date` quedan fuera de scope v1 (renderizan idénticas en ambos lados).
- **`<CompareDateModal>`**: dos `<input type="date">` + etiquetas opcionales ("Antes"/"Después"). Validación YYYY-MM-DD + dos fechas distintas. Acepta prop `layout: 'split' | 'swipe'` para diferenciar el flujo.
- **`compareMode` en `MapsProvider`**: `{ active, axis: 'date', panes, layout, swipePosition }`. Setter `setCompareMode`, `exitCompareMode`, `setSwipePosition` (debounced en SwipeView). `paneMapRefs` registry indexado por `paneIndex` para que `useViewSync` acceda a cada `Map`.

### Agregado — Submenu de Herramientas
- **Reorganizacion del item `tools`** en el sider de `hasMenu: false` con `onClick: toggleMeasurementTools` directo a `hasMenu: true` con `<ToolsMenu>` como `menuContent`.
- **`<ToolsMenu>`**: grid 2x2 de tres iconos en el patron de `<BaseMapList>`: **Mediciones** (dispara el toggle existente que abre `<MeasurementTools>`), **Comparar fechas** (abre `CompareDateModal` con `layout='split'`), **Barra divisora** (abre `CompareDateModal` con `layout='swipe'`). Estado activo por icono: Mediciones se muestra activo si `areMeasurementToolsVisible`; Comparar/Swipe segun `compareMode.layout`.
- **Iconos SVG inline**: una regla con punto para Mediciones, dos paneles juntos para Comparar fechas, mapa con linea naranja vertical y flechas para Swipe. Estilo por hover/active siguiendo el patron del basemap.

### Agregado — Persistencia compartida del comparador
- **`kind: 'swipe'`** en serializer/deserializer: estructura igual a `kind: 'compare'` pero con `payload.position` (0..1). Bumpea share, recarga estado completo (capas + filtros + fechas + posicion del divisor) al abrir el link.
- **`kind: 'compare'`** ya soportado: hidrata `compareMode` con `axis` + `panes` desde el envelope. Default `layout: 'split'` cuando no viene. Tests actualizados (`useShareDeserializer.test.js`, nuevo `useShareSerializer.test.js`).

### Agregado — URL viva limpia + persistencia local
- **Refactor URL strategy**: removidos `useUrlSync`, `useMapViewUrlSync` y test asociado. La URL viva ya no muta con cada cambio de capa/filtro. Solo se modifica al pulsar "Compartir": queda `?s=<hash>`. Deeplinks por capa via `?layer=<slug>` siguen funcionando para invitar a una capa unica.
- **`useSessionPersistence`**: serializa el estado actual (mismo envelope que el share) a `sessionStorage` con debounce. Sobrevive un refresh, se pierde al cerrar la pestaña. `hasBeenPopulatedRef` evita borrar el storage durante el primer mount cuando aun no hay capas cargadas (corner case que perdia el estado previo).
- **`useInitializeFromUrl`**: orden de precedencia `?s=` → `?layer=` → `?layers=` (legacy) → sessionStorage → `BASE_INITIAL_ORDER`. Valida `layers.length > 0` antes de deserializar el sessionStorage para que un envelope vacio caiga al fallback.

### Agregado — Indicadores de estado del share
- **`useShareDirtiness`**: detecta si el estado vivo divergio del share cargado. Trackea `activeLayerIds`, `filters`, `layerOpacities`, `hiddenLayerIds`, `selectedLayerForSymbology`, `baseMapId`. **No** rastrea pan/zoom (decision: el share guarda el encuadre como starting view, no como invariante; explorar zonas vecinas no debe marcar dirty).
- **Badge "Usando link compartido: hash"** (verde, no interactivo) en `<MapToolsPanel>` cuando `inSyncWithShare`.
- **Boton "Regresar a: hash"** (gris, clickeable, hace `window.location.reload()`) cuando el estado fue modificado tras cargar el link.
- **Badge "Comparando: A vs B ×"** (azul) en compare mode, click sale.
- **`<ShareButton>` con tres estados**: verde claro + icono `done` cuando sincronizado, gris cuando modificado, lavanda/morado normal. SVG `done` usa `currentColor` para que el check tome el color del texto.

### Cambiado — InfoBox y feature info
- **Filter por id en `useFeatureInfo.handleRemoveFeature`**: cuando se borra una card del cluster, el `cachedFeatures` se filtra por id (con fallback a referencia). Counter pasa de `1/482` → `1/481` y el download CSV refleja el set actual.
- **Re-poblacion al borrar la ultima visible**: si la cache aun tiene items, se restauran `features` con un slice — antes destruia el resultEntry y la card desaparecia con cache disponible.
- **`useLoadMoreFeatures` recibe `selectedFeatureInfo` por argumento** en lugar de leer state via setter. Test nuevo (`useLoadMoreFeatures.test.js`).
- **`useDateLoop` no pisa filtros del share**: chequea `getSpecificFilter(layerId, 'date')` antes del default-date apply, skipea si ya hay filtro (tipico de share-loaded).

### Eliminado
- `frontend/src/pages/maps/components/CompareButton.jsx`: el scaffold de v1.10.0 ya no se usa, su funcionalidad vive en `<ToolsMenu>`.
- `frontend/src/pages/maps/hooks/useUrlSync.js`, `useMapViewUrlSync.js`: reemplazados por inicializacion via `?s=`/`?layer=` + `useSessionPersistence`.
- `frontend/src/services/featureInfoPagination.js`: doble-fetch WMS + cache local hizo innecesaria la paginacion WFS.
- `frontend/src/test/pages/maps/hooks/useUrlSync.test.js`: cubria los hooks borrados.

### Corregido
- **EPSG:3857 vs WGS84 en serializer**: `view.getCenter()` devuelve coordenadas en `EPSG:3857`. El serializer las pasaba directo y el deserializer hacia `fromLonLat([lon, lat])` asumiendo WGS84 → centro del mapa al espacio sideral, OL retry-loop infinito al abrir el share. Fix: `toLonLat(center)` en el serializer.
- **`selectedLayerForSymbology` en serializer**: leia `selectedLayer` (modal) en lugar de `selectedLayerForSymbology` (sider). El deserializer setea el segundo, asi que round-trip no respetaba la simbología.
- **`Modal isOpen vs open`**: `<ShareModal>` pasaba `open={open}` cuando `<Modal>` espera `isOpen`. El modal nunca aparecia visiblemente.

### Backend
- `backend/app/routers/shares.py`: ajustes menores en validacion del envelope.
- `backend/app/services/layer_tree_service.py`: pequeño tweak.

## [1.11.0] - 2026-04-26

### Agregado
- **Lazy load infinito en InfoBox** (caso click multi-feature): muestra 50 cards inicial y carga 50 mas conforme scrolleas hasta el fondo. Implementado con `IntersectionObserver` que auto-detecta el contenedor scrolleable ancestro (`overflow-y: auto/scroll`), funciona idéntico en mobile (dentro de `MobileSheet`/`ScrollContainer`) y desktop (dentro del nuevo `ScrollContainer` que reemplazo al `<div max-h-[60vh]>` plano).
- **Total real desde el primer click**: doble fetch WMS GetFeatureInfo en paralelo — el primero con `FEATURE_COUNT=50` para paint inicial rápido, el segundo con `FEATURE_COUNT=2000` para conocer el total real. El segundo se cachea localmente (`cachedFeatures`) y lazy load slicea desde memoria — cero requests adicionales al scrollear. Reemplaza el intento previo de WFS `resultType=hits` que era frágil (CORS/version mismatches en algunos GeoServers).
- **Counter por card con total real**: cada card muestra `1/482` directo en lugar de `1/50` del display cap. El total refleja todos los features del cluster, no los visibles.
- **Decremento al eliminar card con X**: `handleRemoveFeature` ahora filtra del `cachedFeatures` (por referencia + fallback por id), bajando `totalAvailable`. Counter pasa de `1/482` → `1/481` y el download CSV ya no incluye el eliminado.
- **Badge de count en botón Descargar (desktop)**: pill naranja en bottom-right del botón con el total real (ej. `482`). Tooltip muestra "Descargar 482 de 482 tarjetas". Para clusters > 2000 muestra `2000+`.
- **`ScrollContainer` propagado a desktop**: el InfoBox de desktop ahora usa el mismo `<ScrollContainer>` que mobile (con flechas, fade, click-arrows). Cuando hay 1 sola card, render plano sin scroll.
- **Header del card con título centrado siempre**: counter y X cambian a `position: absolute` (top-left y top-right). El `<h3>` toma `w-full` con `text-center` y se centra respecto al header completo, sin importar el ancho del counter (ej. `999/9999` ya no comprime el título). Padding lateral `px-12` reserva espacio para los flotantes; `my-3` separa título verticalmente del counter+X.

### Cambiado
- **`FEATURE_COUNT_CAP`**: 50 (display inicial). El counter muestra el total real desde el primer paint, así no necesitamos cargar 200 desde el inicio.
- **`FEATURE_COUNT_TOTAL`**: 2000 (cap del segundo fetch en paralelo, fuente de `cachedFeatures` y `totalAvailable`).
- **`enrichResultsForDownload`** consume directo del `cachedFeatures` (cap 5000) — antes paginaba via WFS GetFeature, ahora slicing local instantáneo.
- **`useFeatureInfo`** crea `features` como `cachedFeatures.slice(0, visible)` para garantizar que ambos arrays compartan referencias (fix de bug donde el filter por id no decrementaba el total porque las dos fetches devolvían objetos distintos).

### Corregido
- **LayerDetailModal: tema y avatar correctos** — el campo `tema` derivado del backend (`layer_name_usuario.split(':')[0]`) no funciona con la migración v1.4.0 si el formato `Tema:Nombre` ya no se respeta. Fix: nuevo helper `findLayerTheme(layerId, layerTree)` en `wmsConfig.js` que recorre el árbol y devuelve el ancestro `nodeType: 'tema'`. `LayerDetailModal` ahora prefiere ese valor (con fallback a `metadata.tema` y `'General'`). El avatar e icono se resuelven automáticamente.
- **mariachi admin: redirect 401 ya no manda a `/administrador/login`** (path legacy roto post-v0.21.0). `api.js` usa `import.meta.env.BASE_URL` para construir el URL → `${BASE_URL}/administrador/login` con basename `/mariachi/`.

### Arquitectura interna (no visible al usuario)
- **`useInfoBoxLazyLoad`** (nuevo hook): encapsula `IntersectionObserver`, totales agregados, contexto de carga y `enrichResultsForDownload`. Auto-detecta scroll root ancestor para que el observer funcione en cualquier wrapper.
- **`useLoadMoreFeatures`** (nuevo hook): mutador puro de `selectedFeatureInfo.results` que extiende `features` slicing del `cachedFeatures` (sin red, instantáneo).
- **`featureInfoPagination.js`**: helpers WFS para `fetchTotalsForClick` (legacy WFS hits, ya no usado en main flow) y `fetchMoreFeaturesForLayer` (paginación WFS por si en el futuro se quiere fetch incremental real).
- **eslint override** para `InfoBox.jsx` con `max-lines: 400` siguiendo el patrón existente de `useMapDrawing.js`.

## [1.10.0] - 2026-04-24

### Agregado
- **Componente `<Tag>`** (`@components/Tag`) para etiquetas semanticas: `state` = `beta` | `dev` | `nueva` | `test`, `size` = `xs` | `sm` | `md`. Estilos por estado.
- **Componente `<CompareButton>`** con tag BETA: scaffold visual del comparador por fecha. Hoy se monta `disabled` dentro de `<ShareModal>` como teaser; la funcionalidad de split-view + `useDateOverride(paneIndex)` viene en una version posterior.

## [1.9.0] - 2026-04-24

### Agregado
- **Snapshots persistidos del mapa** (`mapalab.map_shares`): `POST /shares` guarda el estado completo (capas, orden, visibilidad, opacidad, filtros, periodicidad, loop, basemap, vista) en DB y devuelve un hash corto. `GET /shares/{id}` lo restaura. URL: `?s=k3jx9p2m`.
- **Pinning de shares por 1 ano** (`POST /shares/{id}/pin`). Default: retencion sliding window 30 dias desde ultimo acceso.
- **Modal "Compartir mapa"**: reemplaza al `ShareButton` legacy. Crear enlace, copiar, fijar 1 ano. Detecta `?s=hash` en `useInitializeFromUrl` y restaura el estado completo al cargar.
- **Hash determinista** (SHA-256 del JSON canonicalizado, base32 truncado a 10 chars): dos usuarios que arman el mismo mapa comparten el mismo hash → deduplicacion automatica.
- **Rate limiting in-memory** en `POST /shares` (10 req/min por IP-hash) + tamano max payload 64KB.
- **Métricas Prometheus** nuevas en `/metrics`: `mapalab_shares_created_total{kind}`, `mapalab_shares_accessed_total{kind}`, `mapalab_shares_pinned_total`. `incr()` ahora soporta labels.
- **Cron diario `run_cleanup_shares.py`** (04:45 en `dataengine-jobs`): elimina shares no-pinned con `last_accessed_at > 30 dias` y pinned-expirados.
- **Migracion Alembic 0005** en `mapalab-dataengine/jobs/alembic/versions/`: tabla `mapalab.map_shares` con índices condicionales (sliding-window y pinned).

### Cambiado
- **`ShareButton`**: ya no copia el URL viva al portapapeles; ahora abre el `<ShareModal>` que mintea un share persistente. El componente `helpers/handleShare.jsx` legacy se elimina.

## [1.8.0] - 2026-04-24

### Agregado
- **Slugs publicos por capa** (`mapalab.layers.slug`): identificadores legibles tipo `establecimientos-salud` que reemplazan los IDs internos de GeoServer en URLs publicas. Configurables desde mariachi admin con auto-suggest desde el label.
- **Aliases de capa** (`mapalab.layer_aliases`): atajos cortos opcionales (ej: `esalud`) que tambien resuelven a la capa. CRUD via `GET/POST/DELETE /layers/{id}/aliases` en mariachi y nueva tab "Aliases" en `LayerEditPage`.
- **Endpoint `/layers/resolve?ref=<slug-or-alias>`** en mapalab backend para resolucion publica.
- **Deeplink por capa** via `?layer=<slug>`: aterriza con esa capa unica activa + su `defaultDate`.
- **URL viva con slugs** en lugar de IDs: `useUrlSync` y `useInitializeFromUrl` operan en slugs con fallback automatico a id legacy durante 2 releases.
- **Migracion Alembic 0004** en `mapalab-dataengine/jobs/alembic/versions/`: slug + aliases.

### Cambiado
- **Ownership de migraciones del schema `mapalab.*`** revisado (ecosystem.md §7.3 v2): movido de mariachi a mapalab-dataengine. Razon: en prod mariachi y dataengine corren en servidores distintos. Ahora `make prod-migration` y `make migrate` aplican migraciones desde el container `dataengine-jobs` sin depender de mariachi.
- **`bootstrap-v14.sh`** corre `alembic upgrade head` automaticamente al final del bootstrap (idempotente; aplica solo lo nuevo si ya estaba stamped).
- **`prod-migration.sh`** ahora idempotente y re-ejecutable. Default cambia a `--skip-etl` (ETL legacy del Sheet desactivado); para incluirlo `--with-etl` opcional.
- **Container `dataengine-jobs`** incluye `alembic==1.13.3` en sus deps.
- **Targets `make migrate` y `make migrate-status`** en `mapalab-dataengine/Makefile`.
- **`run_refresh_layer_tree.py`**: incluye `slug` y `aliases` en cada nodo del JSON cacheado.
- **Mariachi**: removida la rama `dataengine` de su Alembic (`alembic.ini`, `env.py`, `versions/dataengine/`); `init_db.py` ya no la invoca. Mariachi solo gestiona schema `public.*`/`mariachi.*`.

### Corregido
- `layer_tree_service.get_cached_state()` revalida contra DB via etag check en cada llamada. Cierra la ventana de staleness cross-workers: cuando mariachi (o el cron nocturno) actualiza `mapalab.layer_tree_cache`, los N workers Gunicorn se autosincronizan en su siguiente request sin necesidad de restart ni pub/sub.
- `.env.development`: `DB_HOST=localhost` → `host.docker.internal` para que el backend en container alcance el Postgres de dataengine.

### Documentacion
- `docs/context.md`, `docs/layers.md`, `docs/runbook-layers.md` actualizados para reflejar `make prod-migration` como entrypoint unico de bootstrap en dataengine.
- `docs/planes/PLAN_URL_SHARES_SLUGS.md` agregado: plan completo del feature (slugs + aliases + shares + comparador).
- `mariachi/docs/ALEMBIC_MULTI_ENV.md`: reescrito como single-env con pointer a mapalab-dataengine.
- `gateway-hub/docs/ecosystem.md §7.3` revisado con la nueva politica de ownership de schema.

## [1.7.0] - 2026-04-22

### Agregado
- **Drag & drop de reorden** en el árbol del editor (Ant Design `Tree.draggable`). Solo admin, solo entre hermanos del mismo padre. Llama `PATCH /layers/reorder` y recarga
- **Preview InfoBox con datos dummy** en el drawer: muestra `headerField`, badges (municipio / característica), listas, iconText, stats y texto adicional según el preset seleccionado
- **Formularios dinámicos por preset InfoBox**: `municipio`, `punto`, `punto_municipio`, `punto_ubicacion`, `punto_completo` exponen sólo los campos que aplican. `caracteristicas`, `list`, `iconTexts` usan `Select mode="tags"`
- **Editor JSON para `infobox_config` custom**: textarea monospace + validación en vivo + remount por `key={layer.id}` para evitar contaminación entre capas
- **Endpoint `/metrics` Prometheus** en mariachi (`app/api/metrics.py`) con contadores in-memory: `mariachi_rate_limit_hits_total`, `mariachi_tree_notify_total`, `mariachi_geoserver_calls_total`. Formato `text/plain; version=0.0.4`. Sin deps nuevas (defaultdict + threading.Lock)
- **Endpoint `/metrics` Prometheus** en mapalab backend (`app/metrics.py`): `mapalab_tree_requests_total`, `mapalab_tree_cache_hits_total`, `mapalab_tree_refresh_total`, `mapalab_search_requests_total`, `mapalab_download_requests_total`
- **Integración huachicol**: `MARIACHI_BACKEND_TARGET` en `.env.example` y `scripts/generate-targets.sh`. `docs/agregar-proyecto.md` actualizado
- **Code-split admin mariachi**: `React.lazy()` + `Suspense` en `Users`, `MenuManager`, `PageEditor`, `Media`, `RevisionQueue`, `MapalabLayers`. Chunks separados por página (MapalabLayers: 43 kB gzip 15 kB). Bundle inicial ya no carga editor rico ni tree
- **Tests integración cruzada mariachi → mapalab** (`test_integration_notify.py`): notifier skip sin URL, POST correcto con mock transport, debounce consolida 5 calls en 1, /metrics Prometheus format, thread-safety del contador (10 threads × 1000 incr = 10_000)
- **Documentación de API de Taiga**: Agregada la guía `docs/taiga.md` con referencias de autenticación y flujos automatizados en Bash/Python para proyectos, épicas, historias, tareas y Wiki.
- **Tests `/metrics`** en mapalab (`test_smoke.py::TestMetrics`): response plaintext, increment en `/layers/tree`, increment de cache hits en 304

### Cambiado
- `useLayerTreeAdmin` expone `reorderLayers(parentId, orderedIds)`
- `LayerEditDrawer` usa `Form.useWatch` en `workspaceAlias` / `geoserverLayer` / `infoboxTemplate` / `infoboxParams` / `infoboxConfig` (elimina state paralelo)

### Eliminado / Deuda legacy
- **`public.mapalab_card` deprecado** en el backend mapalab:
    - `MapalabRepository` borrado (`app/repositories/mapalab_repository.py`)
    - `Mapalab_Card` model borrado (`app/models/mapalab.py`)
    - `routers/metadata.py` eliminó fallback legacy: lee solo de `mapalab.layer_metadata`/`layer_stats`
    - `download_repository.resolve_db_name` ahora consulta `mapalab.layer_metadata.layer_name_db`
- **ETL Google Sheet eliminado en dataengine-jobs**:
    - Borrados: `jobs/run_bootstrap.py`, `jobs/core/mapalab_card/*`, `jobs/core/schemas/mapalab_card.py`, `jobs/alembic/mapalab_card/*`
    - Borradas deps de runtime: `pandas`, `gspread`, `google-auth`, `alembic` en `requirements.txt`
    - Credenciales Google (`iieg2025-cloud-*.json`) purgadas del container
    - **Preservado:** `jobs/bootstrap/run_migrate_mapalab_card.py` (migración 1-shot self-contained) + target `make migrate-mapalab-card`
- Env vars `MAPALAB_CARD_DB_*` renombradas a `DATAENGINE_DB_*` en los jobs y Makefile de dataengine

### Notas de despliegue
- En producción la tabla `public.mapalab_card` todavía existe. Secuencia obligatoria antes del pull del backend mapalab:
    1. `cd /IIEG/mapalab-dataengine && git pull && make up`
    2. `make bootstrap-v14 LAYERS_JSON=...` (idempotente: crea schema + seed + migra `mapalab_card` → `layer_metadata`/`layer_stats`)
    3. Verificar counts en `mapalab.layer_metadata` (esperado ~107) y `mapalab.layer_stats` (~102)
    4. `cd /IIEG/mapalab && git pull && make up`
- Documentada en `mapalab-dataengine/docs/bootstrap-v14.md` sección "Despliegue en produccion (primera vez)"

## [1.6.0] - 2026-04-22

### Agregado
- **Selector GeoServer en `LayerEditDrawer`**: los campos `workspaceAlias`, `geoserverLayer` y `styles` se poblan desde `/geoserver/workspaces` y `/geoserver/workspaces/{alias}/layers/{layer}/styles`, reemplazando inputs libres por `Select` + `AutoComplete`. Evita errores de captura manual y deriva `layers` por workspace
- **Edición masiva de tags** (`BulkTagsDrawer` + `PATCH /layers/bulk-tags`): drawer con textarea que acepta paste-from-Excel (TSV). Parsea filas `layer_id [TAB] tag1, tag2`, muestra preview en tabla y aplica hasta 500 capas por request. Reporta `not_found` por capa inexistente
- **Rate limiter en memoria** (`app/api/rate_limit.py`) con sliding window per user_id: `60 req/min` en writes de `layers.py` + `layer_metadata.py`, `120 req/min` en reads de `geoserver.py` (protege llamadas a GeoServer REST). Responde `429` con `Retry-After`
- `useLayerTreeAdmin` expone `listGeoserverWorkspaces`, `listGeoserverFields`, `listGeoserverStyles`, `bulkUpdateTags`

### Cambiado
- Endpoints write de `layers.py` (`POST`, `PUT`, `DELETE`, `PATCH /reorder`, `PATCH /initial-order`, `PATCH /bulk-tags`, `POST /duplicate`) añaden dependencia `_write_rate_limit`
- Endpoints write de `layer_metadata.py` (`PUT /{layer_key}`, `PUT /{layer_key}/stats`) añaden dependencia `_write_rate_limit`

## [1.5.1] - 2026-04-22

### Agregado
- **Workflow editora → borrador → admin aprueba**: UI del editor diferencia role. Editora ve "Guardar borrador" y "Enviar a revisión"; admin ve "Guardar" directo. Usa `PUT /borradores/layer/{id}` + `POST /borradores/layer/{id}/solicitar-revision` (endpoints genéricos existentes). Admin aprueba con `/borradores/por-id/{id}/aprobar` que materializa en DataEngine
- `useLayerTreeAdmin.js` expone `saveLayerDraft`, `requestReview`, `getLayerDraft`
- `LayerEditDrawer.jsx` recibe prop `isAdmin` y ajusta botones
- **Tests smoke mapalab backend** (8 tests): `/health`, `/layers/tree` con ETag + 304, `/layers/initial-order`, `/layers/workspaces`, validación `/search`. Primer test backend del repo (antes: 0)
- **Tests unit mariachi** (18 nuevos): `test_stats_templates.py` cubre validación de SQL injection, identificadores, positions duplicadas, todas las operaciones + `build_query` con placeholders
- **`docs/runbook-layers.md`** con 8 escenarios de recuperación: cache corrupta, layers vacío, stats desactualizadas, permisos mariachi, cron parado, ETag stale, rollback, Alembic roto

### Cambiado
- mapalab backend: primer `test/` directory con `conftest.py` que mockea DB + SchedulerService

## [1.5.0] - 2026-04-22

### Seguridad
- **Template catalog reemplaza SQL libre en `stats_config`**: eliminada la capacidad de escribir SQL arbitrario. Ahora 8 operaciones validadas: `count`, `count_distinct`, `count_where`, `sum`, `avg`, `min`, `max`, `latest`. `schema`, `table`, `field`, `where_field`, `order_field` validados como identificadores (`[A-Za-z0-9_]{1,100}`). Valores interpolados por `:param` (no concatenados)
- **Debounce de `notify_tree_changed()` en mariachi** (5s): múltiples writes disparan solo 1 refresh del tree cache
- `WORKSPACE_SCHEMA_MAP` hardcoded eliminado en mapalab backend: `resolve_schema()` ahora hace lookup cacheado a `mapalab.workspaces`

### Agregado
- `app/services/stats_templates.py` en mariachi con `validate_stats_config`
- Diagrama de secuencia Mermaid en `docs/layers.md` (flujo editora → admin → visor)

### Cambiado
- `run_refresh_layer_stats.py` en dataengine-jobs usa el mismo template catalog

### Breaking (MINOR bump)
- `stats_config` en `mapalab.layer_stats` cambió de shape: antes `{query, format}`, ahora `{operation, schema, table, field, ...}`. Rows con el viejo shape se marcan como inválidas en el refresh job (skipped). Admin debe reconfigurar desde el editor.

## [1.4.8] - 2026-04-22

### Corregido
- **Búsqueda no encontraba leaves** tras migración: `processLayerTree` en `searchConfig.js` usaba `if (child.children)` pero el backend devuelve `children: []` consistentemente, marcando los leaves como "no-leaf" y saltando su indexación
- Cambio: usar `Array.isArray(children) && children.length > 0` como chequeo

### Agregado
- `docs/search.md` (reescrito) describe el flujo completo: scoring, edición de tags, ejemplos prácticos

## [1.4.7] - 2026-04-22

### Corregido
- **Búsqueda de capas no encontraba resultados** tras el refactor de v1.4.3: `searchConfig.js` construía `SEARCH_CONFIG` al importarse desde el barrel `layers` (ya eliminado), quedándose vacío
- Ahora `SEARCH_CONFIG` es mutable y se construye via `rebuildSearchConfig(tree)` invocado en `LayersProvider` tras el fetch
- Mantiene el scoring sofisticado del cliente (Levenshtein, normalización de plurales, pesos por label/tag) — cero round-trips por keystroke

### Notas de arquitectura
- La búsqueda de **nombres de capas** sigue siendo 100% client-side (latencia cero)
- El endpoint `GET /mapalab/api/layers/search` se mantiene para otros consumidores (links compartidos, API pública futura)
- Para que una capa sea encontrada por palabras clave sinónimas (ej. "IMSS" cuando se busca "hospital"), usar el campo `search_tags` en el editor mariachi (`mapalab.layers.search_tags TEXT[]`). El scoring ya asigna hasta +25 puntos por tag match

## [1.4.6] - 2026-04-22

### Corregido
- **InfoBox no mostraba información de features** y **descargas WFS fallaban**: los servicios `featureInfoService.js` y `downloadService.js` importaban `layers` del barrel obsoleto (v1.4.3 eliminó esa exportación)
- `featureInfoService.js`: `getFeatureInfoForActiveLayers` y `getFeaturesInPolygonForActiveLayers` reciben `allLayers` como parámetro; los callers en `useFeatureInfo.js` lo pasan desde `MapsContext.allLayers`
- `downloadService.js`: setter module-level `setLayersForDownloadService(layers)` (mismo patrón que `layerMetadataService`), invocado en `LayersProvider` tras el fetch

### Cambiado
- Tests de `downloadService.test.js` actualizados al nuevo shape de mocks

## [1.4.5] - 2026-04-22

### Corregido
- **Capas WMS no se renderizaban**: el backend devuelve `wmsConfig` con campos estructurales (`geoserverWorkspace`, `geoserverLayer`, etc.) pero el frontend esperaba `baseUrl` + `layerName` completos para OpenLayers
- `hydrateLayerTree(tree)` en `helpers/wmsConfig.js` construye `baseUrl` y `layerName` en cliente usando `VITE_GEOSERVER_URL`, aplicado en `LayersProvider` justo después del fetch
- Consumidores (`useWMSLayerFactory`, `useWMSLayerManager`, `useWMSLegend`) no cambian — siguen leyendo `wmsConfig.baseUrl` y `wmsConfig.layerName` transparentemente

### Cambiado
- Backend permanece agnóstico de la URL pública del GeoServer; si cambia el dominio no hay que redeployar backend
- Tests: 9 nuevos en `wmsConfig.test.js` (477 → 478); `createWMSConfig` (eliminado en v1.4.3) reemplazado por `hydrateWmsConfig` + `hydrateLayerTree`

## [1.4.4] - 2026-04-22

### Agregado
- `docs/layers.md` con arquitectura completa del sistema de capas v1.4.x
- Script idempotente de bootstrap para DataEngine (`mapalab-dataengine/scripts/bootstrap-v14.sh`) que orquesta rol, schema, migraciones y seed en un solo comando
- `make bootstrap-v14 LAYERS_JSON=...` en `mapalab-dataengine`

### Eliminado
- `docs/planes/PLAN_MIGRACION_CAPAS.md` y `docs/planes/ADR_001_capas_architecture.md` (ya implementados)
- Flag `VITE_LAYERS_FROM_BACKEND` (siempre on)

## [1.4.3] - 2026-04-22

### Cambiado
- **Refactor total del sistema de capas**: eliminados los 9 archivos `frontend/src/pages/maps/helpers/layers/definitions/*.js` (~1590 líneas), `rasterHelpers.js` y `layerFactory.js`
- Nuevo `LayersContext` + `LayersProvider` + hook `useLayers()` como fuente única del árbol
- Los 20 consumidores migrados a consumir vía `useLayers()` o `MapsContext.allLayers`
- `layerMetadataService` usa setter module-level (`setLayersForMetadataService`) inyectado por `LayersProvider`
- `layers/index.js` reducido a 1 línea (re-export de `findLayerById`)

### Eliminado
- `frontend/src/hooks/useLayerTree.js` (reemplazado por `useLayers`)
- `frontend/scripts/export_layers_to_json.mjs` (ya no hay JS que bundlear)

## [1.4.2] - 2026-04-22

### Agregado
- **Metadata de capas en DataEngine**: tablas nuevas `mapalab.layer_metadata` (descriptiva) y `mapalab.layer_stats` (numeralia + `stats_config` con queries SQL)
- Endpoints CRUD en mariachi: `/api/administrador/layer-metadata/{layer_key}` + `/stats`
- Script 1-shot `mariachi/api/scripts/migrate_mapalab_card.py` que copia `public.mapalab_card` → `mapalab.layer_metadata` + `mapalab.layer_stats` (idempotente)
- Job diario `run_refresh_layer_stats.py` en `dataengine-jobs` que ejecuta `stats_config` (whitelist SELECT-only) y popula `values`
- `make refresh-layer-stats` y `make refresh-all` (incluye stats)

### Cambiado
- `mapalab/backend/app/routers/metadata.py` lee de `mapalab.layer_metadata` primero, fallback a `public.mapalab_card` legacy
- `jobs/run_bootstrap.py` (ETL Google Sheet) emite deprecation warning; requiere `FORCE_LEGACY_ETL=1` para correr

## [1.4.1] - 2026-04-22

### Agregado
- **Tree materializado** en tabla `mapalab.layer_tree_cache` (singleton JSONB). `GET /mapalab/api/layers/tree` sirve desde DB + caché en memoria del proceso
- Container `dataengine-jobs` (renombrado de `dataengine-mapalab-card`) ahora corre cron con tres tareas diarias: `refresh_periodicity` (03:00), `refresh_layer_tree` (04:00), `refresh_layer_stats` (04:30)
- `make refresh-layer-tree`, `make refresh-periodicity`, `make refresh-all` en `mapalab-dataengine`
- Endpoint `POST /mapalab/api/layers/refresh-cache` para trigger HTTP desde mariachi
- `mariachi/api/app/services/mapalab_notifier.py` invoca el refresh tras cada write

### Cambiado
- `mapalab/backend/app/services/scheduler_service.py` vaciado — los jobs periódicos viven ahora en DataEngine
- Carpeta `mapalab-dataengine/mapalab_card/` → `jobs/` (git mv)

## [1.4.0] - 2026-04-22

### Agregado
- **Arquitectura de capas dinámica**: definiciones ya no se leen de archivos JS hardcodeados. Tablas en DataEngine schema `mapalab`: `layers` (250 nodos seed), `workspaces` (11), `initial_layer_order` (6)
- **Editor de capas** en mariachi `/administrador/mapalab/layers` con Ant Design Tree + drawer de edición (Collapse: Identidad, Visibilidad, WMS, Descarga, InfoBox template)
- **Borradores polimórficos**: `editora` crea borrador via `/borradores/layer/{id}`, admin aprueba con endpoint nuevo `/borradores/por-id/{id}/aprobar` que materializa en DataEngine
- Backend mapalab: `GET /layers/{tree, initial-order, workspaces, search}` con ETag `W/"..."` (304 si coincide)
- Backend mariachi: CRUD `/api/administrador/layers/*` + introspección GeoServer REST (`/geoserver/workspaces`, `.../fields`, `.../styles`)
- `GeoServerClient` con `httpx` para listar workspaces, capas, campos y estilos desde GeoServer REST
- Frontend: `layerTreeService.js` con fetch + ETag/If-None-Match + dedup de in-flight requests
- Templates InfoBox: `municipio`, `punto`, `punto_municipio`, `punto_ubicacion`, `punto_completo`, `custom` (expanden `infobox_params` a `infobox_config` JSON al guardar)
- Tests: 8 nuevos en `layerTreeService.test.js` (469 → 477 totales); 14 en `test_layer_service.py` mariachi

### Infraestructura
- Alembic multi-env en mariachi: `-x db=mariachi` (iieg_portal) y `-x db=dataengine` (schema `mapalab`)
- Rol `mariachi_layers` owner del schema `mapalab` en DataEngine
- `httpx` movido de dev a prod deps de mariachi

## [1.3.0] - 2026-04-21

### Agregado
- `Badge` component extendido: props `color` (`orange`/`purple`/`pink`/`violet`), `size` (`sm`/`md`), `variant` (`count`/`pill`), `text`, `onClick`. Default retrocompatible (orange, md, count)
- Sistema de "nueva característica" en `Badge` via prop `featureKey`: marca visualmente un feature nuevo, al hacer click se persiste en `localStorage` (`mapalab:feature-seen:<key>`) y no vuelve a aparecer hasta que otra key diferente active un nuevo feature
- Hook `useFeatureSeen(key)` en `@hooks/useFeatureSeen` — retorna `[seen, markSeen]`, tolera errores de localStorage (modo privado, quota)
- Auto-pausa de loops temporales al ocultar una capa: `useDateLoop` recibe `hiddenLayerIds` y detiene cualquier loop activo cuya capa pase a estado oculto (evita tile requests WMS desperdiciados)
- **Chunk splitting en Vite**: `build.rollupOptions.output.manualChunks` separa `vendor-react`, `vendor-router`, `vendor-ol`, `vendor-dnd`, `vendor-lottie` y `vendor-export`. El chunk de entrada baja de 678 kB → 105 kB (gzip 205 → 30 kB)
- `rollup-plugin-visualizer` detrás de `VITE_ANALYZE=1` para treemap y JSON de stats (`dist/stats.html`, `dist/stats.json`)
- Regla ESLint `no-restricted-imports` que bloquea todo import `.png` con mensaje explicando la alternativa (WebP/SVG). Rompe el build si se intenta meter un PNG sin `eslint-disable-next-line` justificado
- `knip` (dead-code checker) + scripts `check:dead-code` (informativo) y `check:dead-code:strict` (bloqueante). Config en `frontend/knip.json`
- `lint-staged` corriendo ESLint solo sobre archivos staged en el pre-commit hook
- `.githooks/pre-commit` agrega `npx lint-staged` tras el sync-version
- `.githooks/pre-push` agrega `npm run check:dead-code:strict` después de lint y tests
- CI (`.github/workflows/test-frontend.yml`) agrega los pasos `Dead code check` y `Build` al final del pipeline
- **Sentry** (`@sentry/react` + `@sentry/vite-plugin`) para error tracking en producción. Init en `main.jsx` gated por `VITE_SENTRY_DSN` (sin DSN, SDK no se activa — zero impacto en dev). `<Sentry.ErrorBoundary>` envuelve el `RouterProvider`. Sourcemap upload automático en CI si `SENTRY_AUTH_TOKEN` está configurado. Filtros anti-ruido: GTM, Google Analytics, YouTube embed (que genera `ERR_BLOCKED_BY_CLIENT` en navegadores con adblocker)
- Plugin **jsx-a11y** de ESLint con `flatConfigs.recommended`. Reglas noisy (`click-events-have-key-events`, `no-static-element-interactions`) en `off` por ahora — migrar `<div onClick>` → `<button>` queda como follow-up. El resto (labels, autofocus, non-interactive handlers) enforced desde ahora
- **Coverage thresholds** en `vitest.config.js`: lines 60%, functions 65%, branches 40%, statements 55%. CI corre `npm run test:coverage` en lugar de `npm test` para enforzarlos
- **Dependabot** configurado (`.github/dependabot.yml`): scan semanal de deps npm + GitHub Actions, agrupado por familias (eslint, testing, sentry, openlayers, react) para reducir ruido de PRs
- Chunk `vendor-sentry` separado en `manualChunks` (14 kB gz, se carga solo si `VITE_SENTRY_DSN` está seteado)
- Plan `docs/planes/PLAN_GLITCHTIP.md` para migrar a GlitchTip self-hosted sobre huachicol cuando haya capacidad (evitar datos de errores en SaaS externo)
- **Sentry Python SDK en backend**: `sentry-sdk[fastapi]` en requirements, init gated por `SENTRY_DSN` en `server.py`. Instrumentación automática de FastAPI. Variables `SENTRY_DSN` y `SENTRY_TRACES_SAMPLE_RATE` en `.env.example`
- **Dependabot para pip** (backend): scan semanal, grupos `fastapi-stack` y `sqlalchemy`
- **Security headers conservadores** en `nginx/nginx.conf`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (geolocation=self, microphone/camera=none). CSP queda como follow-up (requiere inventario completo de orígenes)
- Util `@utils/a11y.js` con `handleKeyActivate(callback)` para agregar soporte de teclado (Enter/Space) a elementos interactivos
- Alias `@utils` en `vite.config.js` (ya estaba en vitest)
- Tests: `LottieSpinner.test.jsx` (2 tests), `useFeatureSeen.test.js` (7 tests), `layerExtentService.test.js` (8 tests) — 452 → 469 tests
- **Servicio `layerExtentService.js`** con `fetchLayerExtent(layer)`: hace WFS `GetFeature` en `EPSG:3857`, parsea GeoJSON con `ol/format/GeoJSON` + `ol/source/Vector`, retorna `source.getExtent()`. Cachea por `baseUrl|layerName|cqlFilter` (LRU max 50), timeout 10s, tolera errores retornando `null`. Exporta `clearExtentCache()` para tests/reset
- **Modo dinámico `defaultZoom: 'fit'`** (también `{ fit: true }`) en `applyDefaultZoom` (`useLayerToggle.js`): hace fetch del extent real de las features y llama `view.fit(extent, { padding: [40,40,40,40], maxZoom: 18, duration: 500 })`. Alternativa al extent hardcoded para capas donde el bbox es incierto o cambia en GeoServer. Documentado en `docs/zoom.md`
- **3 capas Primavera** (`bosque_de_la_primavera`, `agave_primavera`, `parcelas_primavera`) usan `defaultZoom: 'fit'` — encuadran al extent real del ANP dinámicamente
- Constantes `FIT_PADDING`, `FIT_MAX_ZOOM`, `FIT_DURATION` en `useLayerToggle.js` para unificar los parámetros de `view.fit` / `view.animate`
- `role="region"` en carrusel de opciones en Home para etiquetado semántico
- `aria-pressed` en `ActiveLayerItem` para indicar estado seleccionado
- `aria-expanded` en cards de FAQ en Home para indicar estado colapsado/expandido

### Cambiado
- Labels de los botones del header de `ActiveLayersList` (Mostrar/Ocultar, Eliminar, Pausar animaciones) ahora son visibles siempre cuando hay ≤ 2 botones; se ocultan automáticamente cuando hay > 2 (ej. cuando aparece el de pausa global). Lógica a prueba de futuros botones via `visibleHeaderButtons`
- 3 badges hardcodeados en `ActiveLayersList` (conteo de visibles, eliminar, loops activos) y el pill `index/total` de `MobileFeatureHeader` migrados al componente `Badge` con sus props semánticos
- Controles de periodicidad en `ActiveLayerItem` (label de fecha, play/pause, velocidad, dirección) se ocultan cuando `layer.visible === false` — un solo guard en el contenedor padre
- Botón play/pause en `ActiveLayerItem` siempre se renderiza junto a velocidad/dirección (antes desaparecía cuando `canPlayLoop === false`). Si no hay config inferible de loop, se renderiza `disabled` con `opacity-50 cursor-not-allowed`
- `gap-3` → `gap-2 md:gap-3` en el row de botones del header de `ActiveLayersList` para mejor ajuste en viewports angostos
- `SwipeToRemove`: al confirmar el swipe, la card eliminada ahora colapsa su `max-height` y `margin-top` a `0` en paralelo con el `translateX` (transición 220ms ease-out). Las cards restantes se deslizan hacia arriba suavemente en vez de saltar al desaparecer la eliminada
- **Mobile — paneles de capas ya no bloquean clicks del mapa**: `MapLayersPanels` añade `max-md:pointer-events-none` al contenedor `Panel` (transparente), y los paneles internos (`ActiveLayersList`, `SymbologyPanel`, wrapper del `Message`) añaden `max-md:pointer-events-auto`. En mobile los clicks pasan por las zonas vacías/gap del panel al mapa, permitiendo mediciones a la altura de Simbología/Capas Activas
- **Home — scroll**: `min-h-screen` root con `overflow-x-hidden` (previene overflow horizontal residual de `mx-[3%]` / `ml-[3%]` + cards del carrusel). Carrusel de opciones con `[&::-webkit-scrollbar]:hidden [scrollbar-width:none]` (antes usaba `scrollbar-thin scrollbar-hidden`, clases inexistentes)
- **Scrollbar vertical global personalizado** en `index.css`: `html { scrollbar-width: thin; scrollbar-color: rgb(156 163 175 / 0.5) transparent }` + `html::-webkit-scrollbar { width: 6px }` con thumb gris translúcido y hover más oscuro. Aplica a toda la app
- **11 assets PNG → WebP** (lossless `cwebp -lossless`): `ico_preguntas`, `bannerHeader`, `img_info_banner`, `img_descargada_banner`, `img_herramientas_banner`, y los 6 `minimap_{estatal,federal}_{voyager,positron,sin_mapa}`. Ahorro ~170 kB sobre la optimización previa con `oxipng`. Imports actualizados en `selectConfig.js`, `bannerConfig.js`, `suportConfig.js`, `minimapImages.js`
- Imports dinámicos de OpenLayers (`ol/style`, `ol/layer/Vector`, etc.) en `useMapMarker.js` y `MapControls.jsx` convertidos a estáticos (ya estaban en el bundle; el `import()` no lograba code-split)
- Barrel `pages/maps/helpers/layers/index.js` reducido a solo re-exportar `findLayerById` y `layers`. Los consumidores (`useLayerManagement`, `useActiveLayersLogic`, `useFeatureInfo`) importan directo desde `utils/layerHelpers`
- Barrel `pages/maps/components/ActiveLayers/index.js` reducido a solo `ActiveLayersList`
- **Lottie lazy-loaded**: extraído `LottieSpinner.jsx` como componente dedicado, cargado via `React.lazy` + `Suspense` en `Logo.jsx`. El chunk `vendor-lottie` (82 kB gz) ya no está en el path inicial — se carga solo cuando Logo monta, en paralelo al resto
- **`vendor-export` dividido** en dos chunks: `vendor-download` (jszip + pako + fast-png + fflate + iobuffer, 46 kB gz — solo para descargas) y `vendor-export` (jspdf + html2canvas + deps, 220 kB gz — solo para MapExport). Usuarios que solo descargan ya no cargan las libs de PDF
- CI usa `npm run test:coverage -- --run` en lugar de `npm run test -- --run` para que los thresholds rompan el build si la cobertura baja
- **Lottie condicionado a `isLoading`**: `LottieSpinner` ya no se renderiza si el usuario nunca ha disparado un estado de carga — el chunk `vendor-lottie` (82 kB gz) se descarga solo bajo demanda real. Estado `lottieNeeded` se activa en el primer `isLoading=true` y se mantiene para permitir fade-outs subsecuentes
- **A11y: `<div onClick>` refactorizados a `<button type="button">` o con `role="button" tabIndex={0} onKeyDown`** en:
  - `Badge`, `Icon`: span clickeable ahora condicionalmente `<button>` cuando hay onClick
  - `MobileSheet`: backdrop como `<button aria-label="Cerrar">` con fondo full-bleed
  - `Body.jsx`: FAQ cards con `role=button`, `aria-expanded`, `onKeyDown` para teclado
  - `ActiveLayerItem`: capa clickeable con `role=button`, `tabIndex=0`, `aria-pressed`
  - `ActiveLayersList`: 3 toggles del header (visibilidad, eliminar, pausar) convertidos a `<button>` con `disabled` apropiado
  - `LayerItem`, `LayerDetailModal`, `QualitySelector`, `MenuItem`: span/div con click → `<button>`
  - Reglas ESLint `click-events-have-key-events` y `no-static-element-interactions` reactivadas

### Corregido
- Import no usado `openDataImg` en `MapAttribution.jsx` — limpia el error de lint preexistente
- **Swipe-to-remove en InfoBox mobile**: bug de "index as key" que causaba que los estilos inline del card eliminado (translateX, maxHeight: 0) se aplicaran al siguiente card que tomaba su slot en el array. Fix: `key={feature.id ?? \`${result.layerId}-${featureIdx}\`}` para que React desmonte el card correcto y las animaciones queden aisladas

### Eliminado
- 4 PNGs huérfanos en `src/assets/images/`: `img_link_share.png` (el OG image vive en `public/`), `testBG.png`, `search.png`, `80x15_open_data.png`
- 9 componentes `.jsx` detectados por knip como muertos: `components/ConfirmModal.jsx`, `components/HamburgerMenu.jsx`, `components/Navigation.jsx`, `components/MenuItem.jsx`, `pages/home/components/PrimaryButton.jsx`, `pages/maps/components/NavigationButton.jsx`, `pages/maps/components/InfoBox/components/LabelGroup.jsx`, `pages/maps/components/MapExport/ExportMapFooter.jsx`, `pages/maps/components/MapExport/utils/layoutHeader.jsx`
- Funciones sin usar: `getLayersWithWMS`, `loadLayerSymbology`, `loadMultipleLayersSymbology` (`layerHelpers.js`); `isCategoryLayer` (`symbologyHelpers.js`); `getSearchConfigByTheme` (`searchConfig.js`); hook `useSiderAnchoredPosition` (`SiderContext.jsx`)
- Constantes sin usar: `SIDER_TRANSITION_LEFT`, `SIDER_TRANSITION_BOTH` (`constants/sider.js`)
- `export default` sin consumir en `SiderContext.jsx`, `SearchContext.jsx`, `useFeatureSeen.js`
- Exports degradados a locales (usados solo internamente): `createBaseItems`/`createCategoryItems` (`menuItems.jsx`), `getWMSLayerName` (`symbologyHelpers.js`), `fetchWithProgress` (`downloadService.js`), `SEARCH_CONFIG` (`searchConfig.js`), `isMobileViewport` (`defaultView.js`), `FEATURE_SEEN_PREFIX` (`useFeatureSeen.js`)

### Rendimiento
- Bundle inicial menor y chunks con hash estable: los `vendor-*` cambian solo cuando se actualiza la librería, mientras el código de app cambia seguido. Mejor cacheo en navegadores y gateway-hub
- Assets estáticos (imágenes de branding y minimaps) ~170 kB totales menos tras migración a WebP

## [1.2.0] - 2026-04-17

### Agregado
- **Sistema de loop de fechas generalizado** (`useDateLoop`, renombrado desde `useRasterLoop`): soporta modo `year` y `month` tanto para capas raster como vectoriales (CQL_FILTER). Helpers nuevos en `dateLoopHelpers.js` (`describeDateFilter`, `formatLoopLabel`, `buildLoopValues`, `computeSelectorInitialState`). El loop infiere modo segun vista del selector (`expandedYear`) o filtro activo
- Controles de loop en header "Periodicidad:" del LayerDetailModal: `PlayPauseButton`, `LoopIntervalButton` (morado, cicla 250/500/1000/2000/3000 ms), `LoopDirectionButton` (morado, toggle LTR/RTL), boton eliminar filtro
- Componentes extraidos a `SimpleDateSelectorParts.jsx`: `BackButton`, `YearBadge`, `PlayPauseButton`, `CarouselArrow`, `LoopIntervalButton`, `LoopDirectionButton`
- Etiqueta de fecha activa en `ActiveLayerItem` con formatos `"2024"` / `"JUN 2024"` / `"3 MESES 2024"` / `"N AÑOS"`. Anchos fijos por tipo (static vs loop) para evitar rebote. Click: toggle loop si es posible, si no abre modal
- Badge morado de intervalo (`"1s"`, `"2s"`) junto al label en `ActiveLayerItem` cuando `loopIntervalMs !== DEFAULT_LOOP_INTERVAL_MS` y el loop corre
- Auto-scroll del carrusel de años al valor current del loop durante mode `year` (si queda fuera del viewport, scroll suave para centrarlo)
- Prop `onExpandedYearChange` en `SimpleDateSelector` para que el modal conozca la vista (año vs mes) y decida el modo del loop
- Edicion en-mapa de Emoji/Texto colocados: click para seleccionar (halo morado), drag para mover, sliders de rotacion y escala 50-300%, boton eliminar. Toolbar flotante posicionado via `ol.Overlay` que sigue pan/zoom. Escape o cambio de herramienta deseleccionan. Ver `docs/draw.md`
- `useMapEditing` hook con `ol.interaction.Translate` + `editingClickedRef` (evita conflicto con el query de InfoBox)
- `FeatureEditToolbar` componente reutilizable para controles de transformacion
- `createEmojiStyle` / `createTextStyle` extendidos con `scale` y `selected`
- Flag `openOnShow` en definiciones de marker para abrir automaticamente la InfoBox al aparecer (opt-in, activo en marker del IIEG)
- Helper `openMarkerCard(feature)` exportado de `useMapMarker` y reutilizado en el click handler
- Componente primitivo `MobileSheet` (`components/MobileSheet.jsx`) con portal, backdrop, translateY, Escape, click-fuera y body lock configurables
- Rama mobile en InfoBox: bottom-sheet con indicadores "hay mas arriba/abajo" (via `useScrollOverflow`) y seccion de herramientas (`InfoBoxTools`) extensible en el header
- Componente `InfoBoxTools` con API `tools=[{ id, icon, label, tooltip, onClick, disabled }]` para crecer con mas acciones a futuro
- `MobileFeatureHeader` — header alternativo para cards en mobile: barra lateral morada + titulo tipografico, sin bloque `#EFF3FC` fijo
- `renderCard(variant)` acepta `'desktop'` (default) o `'mobile'` y elige el header correspondiente
- `SwipeToRemove` — wrapper que permite eliminar cards deslizando horizontalmente (solo mobile) con etiqueta guia "Desliza para eliminar"/"Eliminando…"
- `LicenseTooltipContent` — extraido de `DownloadButton` a `@components/` para reuso (tooltip legal de descarga)
- Tipografias aumentadas en `Text`, `List`, `Cards`, `IconText`, `Label` cuando `variant='mobile'` (de 10px a 12px, y de `text-sm` a `text-[15px]` en valores de cards)
- Grid de `Cards` fuerza `grid-cols-2` en mobile aunque el template indique 1 columna
- `ScrollContainer` reemplaza el scroll manual de InfoBox mobile — incluye flechas bounce arriba/abajo y fade gradient nativos
- `InfoCard` — wrapper compartido con shell `bg-white rounded-[10px] shadow-[...]` y header adaptativo (`desktop`/`mobile`). Unifica renderCard, `EmptySuggestions`, `SummaryCard` y el estado "sin capa seleccionada", elimina duplicacion de la cascara y los 3 estilos de header
- Cache de `alternativeResults` en `selectedFeatureInfo` — al tapar una capa sugerida se filtra en memoria sin re-consultar GeoServer. Limpieza proactiva por cambio de `activeLayerIds` o `filters`. Ver `docs/cache.md`
- `docs/cache.md` — inventario centralizado de todos los caches del proyecto (frontend memoria/storage, backend, nginx, assets)
- `getDefaultMapView()` y `getMinZoom()` en `helpers/defaultView.js` — centralizan la vista inicial y minZoom del mapa
- Capa de salud con `defaultDate: 'latest'`
- Icon `done` en `Icon.jsx`

### Corregido
- Vectoriales tambien pueden animar periodo (antes solo raster). Al iterar, el `ActiveLayerItem` mantiene visible el boton de detalle durante el loop (antes desaparecia por `isLoading`)
- En polígonos, regresar a "todos los años" mantiene el año seleccionado en naranja (antes se perdía la selección visual al volver). Re-click del mismo año preserva la selección del mes
- Sincronización con filter externo: al limpiar el filtro desde el header, el selector vuelve a la vista de años limpia (antes quedaba el state local desincronizado)
- Al tapar una capa alternativa en EmptySuggestions ahora se muestran sus features en el punto clickeado (antes solo cerraba el panel sin mostrar nada)
- Documentacion `docs/mobile-sheet.md` y `docs/infobox.md`

### Cambiado
- Etiqueta de fecha en `ActiveLayerItem` no muestra el ícono play estático (solo pause cuando corre el loop)
- Padding reducido en etiqueta (`p-1.5` → `p-1`, `rounded-[12px]` → `rounded-[10px]`), fuente 9px → 10px
- Años ordenados descendente en `buildLoopValues` para matchear el orden visual del carrusel
- Cuando el loop corre, el año/mes actual se pinta en naranja institucional (no morado) para indicar el tick
- En vista de meses el tick del loop no muestra borde naranja (más sutil), manteniendo `border-transparent` para no rebotar
- Click en el logo IIEG del sider colapsa el sider en mobile (`closeSider`) ademas de mostrar el marker
- `showMarker` llama a `openMarkerCard` como callback de `view.animate`, garantizando que la InfoBox quede centrada sobre el icono al terminar la animacion
- `MobileMenu` refactorizado como wrapper delgado de `MobileSheet` conservando `registerInSider`
- `Header` y `EmptySuggestions` del InfoBox usan `w-full` en lugar de `w-[239px]` fijo, el ancho lo determina el contenedor padre
- `useMapInitialization` respeta `layers` en URL para decidir si aplicar `lat/lon/zoom` (evita centrar en coordenadas sin capas)
- `SymbologyPanel` boton siempre clickeable (abre panel aunque no haya capa)
- `iturConfig` cards con `decimals: 2` para métricas proporcionales
- ActiveLayersList: boton de modo base también activa capas si no hay ninguna activa

## [1.1.4] - 2026-04-15

### Agregado
- Tooltip de licencia IIEG en botones de descarga de capas y visualizacion con link clickeable al PDF
- Prop `interactive` en componente Tooltip para permitir clicks en contenido (links, botones)
- Constantes `LICENCIA_URL` y `LICENCIA_TEXTO` en `@constants/app`
- LittleCard especifica para capa ANP Jalisco con campos nombre, jurisdiccion, tipo, area_ha

### Cambiado
- CI/CD optimizado: tests corren 1 vez (en auto-merge) en lugar de 3, cache de npm en CI, deploy con `git reset --hard` para evitar conflictos
- Emojis: eliminada categoria Banderas y emoji 💩

### Corregido
- ID de capa ANP colisionaba con ID de categoria (fix en v1.1.3 incompleto)
- Panel de emojis aparecia detras del boton cerrar herramientas en mobile (z-index)

## [1.1.3] - 2026-04-15

### Agregado
- Capa "Areas Naturales Protegidas" en Recursos > Areas Protegidas
- Catalogo completo de emojis con 9 categorias y tabs en herramienta de mediciones
- Video de YouTube en pagina de inicio despues de la guia
- Meta tags Open Graph y Twitter Card para compartir enlaces con imagen y descripcion
- Plugin Vite `htmlMetaPlugin` para inyectar URL del sitio en meta tags en build time

### Cambiado
- Licencia Creative Commons BY 4.0 reemplazada por Licencia IIEG 2026 en atribucion del mapa
- Titulo de guia en home: "¿Que puedes hacer en MapaLab?" en lugar de "¿Como navegar en MapaLab?"
- Titulo de la pagina: "MapaLab — IIEG"
- Meses en fechas de ultima actualizacion en minusculas
- Boton centrar Jalisco usa `view.fit()` con padding proporcional al viewport (responsive)
- Panel de emojis homologado al ancho de Mis Mediciones (334px)

### Corregido
- ID de capa `areas_naturales_protegidas` colisionaba con ID de categoria, renombrado a `anp_jalisco`
- InfoBox: links no se activan accidentalmente al aparecer (200ms delay de pointer-events)
- Modal: scroll en mobile no cierra el modal (stopPropagation en touchstart/mousedown)
- Modal: backdrop solo cierra con tap, no con swipe (deteccion de movimiento < 5px)
- Boton centrar Jalisco ahora aparece correctamente en mobile (fix mouseLeave en touch devices)
- useOutsideClick ignora eventos dentro de elementos con role="dialog"

## [1.1.2] - 2026-04-15

### Agregado
- Control de SEO por entorno: `SEO_ENABLED` en Nginx bloquea robots.txt, sitemap.xml y agrega `X-Robots-Tag: noindex` en staging. Produccion lo habilita con `SEO_ENABLED=true`
- Retry con 3 intentos en workflow de auto-merge para PR inestables

### Cambiado
- Descripcion del proyecto actualizada en package.json y marker IIEG

## [1.1.1] - 2026-04-14

### Cambiado
- InfoBox del marker IIEG: tecnologias como etiquetas individuales, nombre del instituto como campo "Organismo"
- Retry con 3 intentos en workflow de auto-merge para PR inestables
- Instrucciones de versionado en context.md incluyen actualizacion de release notes

### Corregido
- Orden de renderizado en renderCard restaurado al original (list → iconText → text → cards) para no afectar otros InfoBox
- Label opcional en componente List del InfoBox

## [1.1.0] - 2026-04-14

### Agregado
- Propiedad `defaultZoom` en definiciones de capas: zoom automatico al activar (3 formatos: numero, zoom+center, extent)
- Propiedad `zoomRange` en definiciones de capas: rango de zoom para visibilidad via `minZoom`/`maxZoom` de OpenLayers
- Boton "Centrar en Jalisco" en controles del mapa: aparece al hacer hover sobre zoom-in, resetea vista a bounds de Jalisco
- Hook `useMapMarker`: marcadores temporales reutilizables con icono, zoom, fondo circular, `minZoom`/`maxZoom` y auto-hide
- InfoBox para markers: click en marcadores muestra InfoBox con datos estaticos via propiedad `infoBox` en definiciones
- Prioridad de click en markers: si el click cae sobre un marker visible, bloquea el query WFS de capas
- Click en logo IIEG del sider muestra marcador de MapaLab sobre el instituto con InfoBox (version, contacto, tecnologias)
- Constante global `APP_VERSION` inyectada desde `package.json` via `define` en Vite
- Archivo centralizado `markerDefinitions.js` para definiciones de markers reutilizables
- Script `scripts/sync-version.sh` y pre-commit hook para sincronizar version en README y package-lock
- Documentacion: `docs/zoom.md`, `docs/markers.md`
- Iconos `fit_extent` (normal/hover) para boton de centrar vista

### Cambiado
- Color del punto de geolocalizacion de azul (`#3b82f6`) a naranja (`#f97316`)

## [1.0.10] - 2026-04-13

### Agregado
- Capa "Carencia por calidad y espacios de la vivienda (%)" en Desarrollo Social > Pobreza y vulnerabilidades

## [1.0.9] - 2026-04-13

### Corregido
- `formatNumber` se aplicaba a campos de fecha y folio en InfoBox. Se agrega propiedad `raw` en definiciones de `list` y `cards` para omitir el formateo numerico (aplicado en salud, educacion y recursos)

### Cambiado
- Componente `IconText` del InfoBox: ubicacion abre Google Maps, telefono abre marcador (`tel:`), mejor alineacion de icono y texto, espaciado entre items

## [1.0.8] - 2026-04-13

### Corregido
- Descargas de capas grandes (>1GB) fallaban por timeout de 120s en la cadena de proxies (nginx mapalab y gateway-hub). Timeout aumentado a 600s con `proxy_buffering off` para rutas de descarga
- Primera descarga lenta por cold start del pool de conexiones a PostgreSQL. Se agrega warm-up del pool al iniciar cada worker de Gunicorn

### Cambiado
- Configuracion del pool de conexiones SQLAlchemy con `pool_size=4` y `max_overflow=4`

### Eliminado
- Archivos `.env` remanentes en `frontend/`, `backend/` y `nginx/` (consolidados en `.env.*` raiz desde v1.0.5)

### Agregado
- `docs/context.md` con referencia completa del proyecto para onboarding y contexto en nuevas conversaciones

## [1.0.7] - 2026-04-13

### Eliminado
- Inyeccion de GTM desde el frontend (`main.jsx`), ahora centralizada en gateway-hub via `sub_filter`
- Variables `VITE_GTM_ID` y `VITE_GOOGLE_ANALYTICS_ID` de `.env.example`, `docker-compose.yml` y `Dockerfile`

## [1.0.6] - 2026-04-13

### Cambiado
- Renombrar proyecto Docker Compose de produccion de `mapalab-staging` a `mapalab`

### Agregado
- Target `ensure-networks` en Makefile para crear redes Docker automaticamente antes de deploy/staging/prod

## [1.0.5] - 2026-04-02

### Cambiado
- Unificar Docker Compose: un solo archivo raiz con profiles (dev/staging) reemplaza 4 archivos en subdirectorios
- Centralizar variables de entorno: `.env.example` raiz con `--env-file`, elimina patron fragil de `cp .env.X .env`
- Refactorizar Makefile: comandos simplificados, elimina `cd` por directorio, agrega `make deploy` y `make staging`
- Unificar .gitignore: un solo archivo raiz reemplaza 3 archivos con patrones duplicados
- Unificar backend Dockerfile con multi-stage targets (development/production)
- Extraer workflow reutilizable de test en CI/CD, eliminar duplicacion en 3 workflows

### Agregado
- README.md raiz como punto de entrada del proyecto
- CONTRIBUTING.md con guia de contribucion y convenciones
- CHANGELOG.md con registro de cambios unificado
- CODE_OF_CONDUCT.md adaptado al contexto IIEG
- `.dockerignore` para frontend y backend (optimizar contexto de build)
- `.env.example` raiz consolidado con todas las variables del sistema
- Target `make deploy` para el pipeline de CD
- Target `make staging` para diferenciar staging de produccion
- Workflow reutilizable `.github/workflows/test-frontend.yml`

### Eliminado
- `frontend/docker-compose.dev.yml`, `backend/docker-compose.yaml`, `backend/docker-compose.prod.yaml`, `nginx/docker-compose.yml`
- `frontend/.gitignore`, `backend/.gitignore` (consolidados en raiz)
- `.env.example` de cada subdirectorio (consolidados en raiz)
- `nginx/README.md`, `frontend/README.md`, `backend/README.md` (fusionados en README raiz y docs/)
- `frontend/ARCHITECTURE.md`, `frontend/CODE_OF_CONDUCT.md`, `frontend/CHANGELOG` (fusionados en raiz)
- `backend/Dockerfile.prod` (unificado en Dockerfile con targets)
- Patron fragil de `cp .env.X .env` en Makefile
- Targets `network-create` / `network-remove` del Makefile
- Duplicacion de jobs de test en workflows CI/CD

## [1.0.4] - 2026-04-01

### Agregado
- Marcador de capa seleccionada en la URL mediante prefijo `*` dentro del parametro `layers` (ej: `?layers=limite_iieg,*economia_pib`), permitiendo preservar la seleccion al recargar y compartir enlaces con subtopico pre-seleccionado.
- Aplicacion de filtros de fecha por defecto (`defaultDate`) al inicializar capas desde URL, igualando el comportamiento de activacion desde el sider.
- Indicador de carga inmediato al crear capas WMS, garantizando que el spinner aparezca desde el inicio de la peticion.

### Corregido
- La auto-seleccion de simbologia siempre revertia a "Limites" al recargar, ignorando la capa seleccionada por el usuario. Se corrigio la logica de auto-seleccion en `useSymbology` para respetar selecciones explicitas desde URL.
- Typo en `topicsConfig.js`: el ID `establecimeintos_salud` impedia activar la capa de establecimientos de salud desde los subtopicos del inicio.

## [1.0.3] - 2026-04-01

### Corregido
- El orden de capas activas se invertia al recargar la pagina. Se reemplazo el uso de `onToggleLayer` (que anteponia cada capa al inicio del array) por asignacion directa de IDs respetando el orden de la URL.

## [1.0.2] - 2026-04-01

### Corregido
- Las flechas de navegacion del componente `ScrollContainer` aparecian sin overflow real. Se cambio a renderizado condicional para evitar que el contenido de las flechas inflara el `scrollHeight` del contenedor.

## [1.0.1] - 2026-03-30

### Cambiado
- Simplificacion de infraestructura de 4 modos de despliegue (dev, prod, ssl, ssl-local) a 2 (dev, prod), delegando SSL y proxy de GeoServer al gateway-hub externo.
- Eliminacion de configuraciones Nginx redundantes (nginx.base.conf, nginx.ssl.conf, entrypoint.sh, docker-compose.ssl.yml, conf.d/, includes/, error/, ssl/).
- Eliminacion del stack standalone del frontend (Dockerfile, docker-compose.yml, nginx.conf).
- Simplificacion del Makefile removiendo targets ssl, ssl-local, ssl-down y deploy.
- Comunicacion entre servicios via host IP:port con `extra_hosts: host.docker.internal:host-gateway` para compatibilidad Linux.

### Corregido
- URLs de descarga de metadatos retornaban 404 por prefijo `metadato_` en el nombre de archivo que no existe en el bucket de Acervo. Se remueve el prefijo al construir la URL en el backend.
- Variable `ACERVO_PUBLIC_URL` apuntaba a `host.docker.internal` que el navegador no puede resolver. Corregido a IP del host.

## [1.0.0] - 2026-03-27

### Agregado
- Descarga de capas desde el servidor con componentes frontend y API backend dedicada.
- Cancelacion de descargas de capas en lote con actualizacion de UI.
- Servicio y API dedicados de periodicidad para capas, reemplazando el mecanismo de cache anterior.
- Cache de periodicidad robusto con logica de reintentos y control de fallos consecutivos.
- Modo INEGI para consultas de informacion de features, ajustando dinamicamente columnas de geometria y parametros WMS.
- Componente `ConfirmDropdown` integrado en `ActiveLayersList` y `CloseButton` para estandarizar prompts de confirmacion.
- Boton de cierre en el panel de historial de mediciones con ancho responsive.
- Funcionalidad de finalizar dibujo en herramientas de medicion.
- Iconos SVG dedicados de play/pause para animacion de capas raster con nuevos estilos de boton y estados hover.
- Selector de calidad de exportacion de mapa con dimensiones dinamicas de captura.
- Barra de escala en exportacion de mapa, fuentes de capas, y pie de pagina con disclaimer.
- Minimapa dinamico, soporte de multiples leyendas y composicion PDF mejorada en exportacion.
- Fecha actual en nombres de archivo de mapas exportados, PDFs, imagenes y datos descargados.
- Propiedad `isCategory` para capas y logica de procesamiento asociada.
- Configuraciones detalladas de InfoBox para capas climaticas raster con formato de fecha y precision decimal.
- Etiquetas estaticas en plantillas de tarjetas InfoBox.
- Mejora del esquema de metadatos con campos de descarga, fuentes, metodologia y simbolos de StatCard.
- Capas raster habilitadas por tiempo con funcionalidad de loop y seleccion de fecha mejorada.
- Soporte de despliegue bajo ruta base configurable (`/mapalab/`).
- CORS configurables y headers de seguridad en Nginx del frontend.
- Header sticky con fondo blanco y contenedor interior purpura redondeado.
- Flag `hidePeriodicity` en definiciones de capas para controlar la periodicidad en el modal de detalles.
- Flag `hiddenInMenu` para ocultar capas del menu de temas.
- Subtemas en configuraciones de temas.
- Componente `Message` y hook `useSlowLoading` para mensajes de carga lenta.
- Iconos SVG de advertencia y tooltips responsive en items de capas activas.
- Rediseno de paginas de error y not found.
- Icono de aviso de privacidad y estado de exito de copiado en boton de compartir.
- Atribucion del mapa con funcionalidad hover-to-expand e imagen Open Data.
- Atribucion Creative Commons BY 4.0.
- Helper `formatNumber` para formato consistente con separadores de miles.
- Helper `formatDateString` para formato de fecha de ultima actualizacion.
- Soporte de multiples enlaces externos separados por coma en seccion 'Fuente'.
- Hooks de configuracion para ejecutarse con Docker en modo desarrollo.
- Propiedad `wmsGroup` en configuracion WMS para prevenir merge de requests.
- Posicionamiento sticky de capa activa seleccionada con overlays de fade.
- Panel de simbologia inicializado colapsado con auto-expansion al seleccionar capa.
- Modo zen/mobile en sider con boton de toggle y dropdown de capas base.
- Selector de fecha con auto-seleccion de mes unico y navegacion de carrusel por ano.
- Calculo dinamico de zona UTM para exportacion de mapas.

### Cambiado
- Estandarizacion de IDs de capas en configuraciones de temas y logica de activacion por URL.
- Mejora del posicionamiento sticky de `ScrollContainer` con flexbox.
- Deteccion de overflow de carrusel con `ResizeObserver` en lugar de `setTimeout`.
- Renombrado de campo 'ingresos_propios' a 'porcentaje_ingresos_propios'.
- Consolidacion de URLs de backend y GeoServer en un solo `MAPALAB_BACKEND_URL`.
- Introduccion de variables `BACKEND_HOST` y `NETWORK_NAME`.
- Estandarizacion de estilos de etiquetas con constantes `MUNICIPIO_STYLE` y `CARACTERISTICA_STYLE`.
- Renombrado del modo 'zen' a 'mobile' en sider.
- Asignacion de `wmsGroup` especificos a capas en lugar de 'default'.
- Eliminacion de debouncing en filtros WMS y actualizaciones de capas activas.
- Integracion de filtrado CQL dinamico directamente en el WMS layer manager.
- Extraccion de secciones de informacion de capa en componente `LayerInfoSections`.
- Eliminacion de `BaseLayersDropdown` y su uso en `ActiveLayersList`.
- Eliminacion de GeoJSON de formatos de descarga vectorial disponibles.
- Estandarizacion de definiciones de capas de seguridad y actualizacion de `RASTER_YEAR`.

### Corregido
- Procesamiento correcto de `metadata.metadato` como array u objeto individual al agregar archivos al zip.
- Reduccion del cooldown de `LayerDetailModal` de 60 a 5 segundos.
- Manejo de null y undefined en utilidad `toArray` y procesamiento de campos `renderCard`.
- Errores gramaticales y de acentuacion en nombres de capas de robo.
- Nombres de display de capas de limite municipal en `HIDDEN_LAYERS`.
- Resolucion de URL de endpoint de metadatos relativa al origin.
- Renderizado del variante menu de Panel usando `createPortal` a `document.body`.

### Rendimiento
- File locking para generacion atomica de cache y connection pooling de base de datos.
- Memoizacion del calculo `isInegiMode` con `useMemo`.
- Headers de seguridad, compresion gzip, timeouts de proxy aumentados e includes modulares en Nginx.
- Cache de proxy Nginx para GeoServer con bypass por request.
- Capas WMS tileadas para mejor rendimiento de carga.

## [0.9.5] - 2026-02-06

### Agregado
- Selector de fecha en detalles de capa con opcion de modo avanzado.
- Mejora en generador de filtros CQL para ignorar claves internas (prefijadas con `_`).
- Actualizacion de capa base 'Cuerpos de agua' a resolucion 50k para mejor detalle.

### Cambiado
- Refactorizacion completa del servicio de metadatos de capa para buscar por workspace y capa.
- Eliminacion del servicio de periodicidad obsoleto.
- Ajuste de offsets en `InfoBox` y mejora en deteccion de posicion de click (`originalEvent`).

## [0.9.4] - 2026-01-12

### Agregado
- Estado de carga (`isLoading`) para seguimiento de progreso en busquedas.

### Cambiado
- Implementacion de estilos visuales segun mockup para paneles de simbologia, descargas y medidas.
- Configuracion de logging para mejor compatibilidad con Docker.
- Implementacion de nuevos iconos de control de mapa (zoom, centro) con estados hover.
- Limpieza de `Makefile` para eliminar contenedores huerfanos en `docker compose down`.

## [0.9.3] - 2025-12-15

### Corregido
- Expansion y refinamiento de definiciones de subcapas en categorias de demografia, desarrollo social y economia.
- Exposicion del puerto del backend al host.

### Cambiado
- Cambio de nombre de funcion en la fabrica de base de datos.
- Estandarizacion de nombres de proyectos docker-compose en diferentes entornos.
- Limpieza de `Makefile` y `README` (eliminacion de emojis), y limpieza de archivos `.gitignore`.

## [0.9.2] - 2025-12-11

### Agregado
- Implementacion de la version inicial de la aplicacion interactiva Mapalab con componentes completos de frontend y backend.

### Cambiado
- Contenedorizacion del proceso de construccion del frontend y simplificacion de la configuracion de Nginx.

## [0.9.1] - 2025-11-12

### Agregado
- Configuracion completa de Vitest para testing del proyecto.
- Scripts npm para testing: `npm test`, `npm run test:ui`, `npm run test:coverage`.
- Soporte para cobertura de codigo con `@vitest/coverage-v8`.

## [0.9.0] - 2025-11-12

### Agregado
- Hook `useAutoCleanFilters` para limpieza automatica de filtros al eliminar capas.
- Funcion `isRenderableParentLayer` en layerHelpers para detectar capas padre renderizables.

### Rendimiento
- Reduccion del tiempo de carga de filtros desde URL de 400ms a 150ms (~62% mas rapido).
- Eliminacion de setTimeout anidados innecesarios en la inicializacion de filtros.

## [0.8.3] - 2025-11-11

### Cambiado
- Actualizacion de configuracion de capas para utilizar filtros CQL en lugar de estilos.

## [0.8.2] - 2025-11-10

### Agregado
- Sistema de sincronizacion bidireccional de filtros con la URL.
- Hook `useFilterUrlSync` para sincronizacion automatica filtros -> URL.
- Hook `useInitializeFiltersFromUrl` para carga de filtros desde URL.

## [0.8.2-beta] - 2025-11-07

### Agregado
- Componente de periodicidad en el modal de detalles de capas.
- Concatenacion de filtros CQL para parametro de periodicidad.

### Corregido
- Problema de multiple informacion al seleccionar un punto en el mapa.
- Tipo de capa para homologar con GeoServer.

## [0.8.1-patch] - 2025-11-06

### Corregido
- Problema de recarga de parametros de la URL al desmarcar capas.
- Mejora de contrastes en componentes de UI.

## [0.8.1] - 2025-10-07

### Agregado
- Implementacion del hook useLayerUrlSync.
- Helper handleShare para copiar la URL.

## [0.8.0] - 2025-10-07

### Agregado
- Frame al descargar el mapa con norte, escala grafica, leyenda, fecha y coordenadas.
- Utils: coordinateGrid, coordinateLabels, layoutFooter, layoutHeader, northArrow, symbology, symbologyData.

## [0.7.7] - 2025-09-24

### Agregado
- Implementacion del Footer en la pagina de inicio.

## [0.7.6] - 2025-09-24

### Agregado
- Implementacion de Support Section y Select Section en la pagina de inicio.

## [0.7.5] - 2025-09-30

### Agregado
- Implementacion de GuideSection en la pagina de inicio.
- Componente PrimaryButton dinamico.

## [0.7.4] - 2025-10-02

### Agregado
- Configuracion del servidor WMS para conexion con servicios de mapas externos.
- Soporte para capas WMS en el visualizador de mapas.
- Sistema de autenticacion para servicios WMS protegidos.
- Cache local para capas WMS frecuentemente utilizadas.

## [0.7.3] - 2025-09-25

### Agregado
- Topic section con tematicas y busqueda por palabra clave.
- Componentes: TopicSection, Card, CardResponsive.

## [0.7.2] - 2025-09-24

### Agregado
- Implementacion de la Hero Section en la pagina de inicio.

## [0.7.1] - 2025-09-23

### Agregado
- Header de la plataforma con opciones dinamicas.
- Hamburger menu para dispositivos moviles.

## [0.7.0] - 2025-09-04

### Agregado
- Sistema de paneles colapsables para capas activas y simbologia.
- Hooks: useActiveLayersLogic, useLayerCollapse, useLayerDragDrop.
- Funcionalidad drag & drop para reordenar capas activas (Z-index).

### Cambiado
- Refactorizacion completa de MapsProvider y ActiveLayersList.

## [0.6.8] - 2024-06-11

### Agregado
- Funcionalidad para compartir mapas mediante enlaces directos.
- Soporte para capas personalizadas de usuario.

## [0.5.5] - 2024-01-09

### Agregado
- Nuevas opciones de filtrado de datos.
- Caracteristicas interactivas de leyenda.
- Capacidades avanzadas de busqueda.

## [0.5.1] - 2025-08-22

### Cambiado
- Actualizacion de la estructura del proyecto.

## [0.1.0] - 2025-08-10

### Agregado
- Configuracion inicial del proyecto.
- Estructura basica del frontend con React.
- Componentes de integracion de mapas.
