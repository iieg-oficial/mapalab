# Changelog — línea 2.x

Todos los cambios notables del proyecto se documentan en este archivo. La historia `0.x` y `1.x`
está en [`changelog/v1.md`](changelog/v1.md).

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Versionado Semantico](https://semver.org/lang/es/).

## [No publicado]

### Agregado

- **Tema de Día de Muertos.** Si un evento vigente trae `decoracion: 'dia-de-muertos'` (mariachi 2.151.0),
  el borde del sider muestra un pan de muerto que enciende el tema; arranca apagado en cada visita y el
  aviso «¡Día de Muertos!» sale una vez por visitante. Encendido, el pan lleva una mordida y aparecen:
  una lluvia lenta de cempasúchil que se acumula en el borde inferior (doce flores como tope, la más vieja
  se desvanece), un ramo de maravillas sobre el logo del IIEG que se cortan con un clic (su «Acerca de»
  pasa a un botón flotante mientras el ramo lo tapa), una rama lineal bajo el logo con el sider contraído
  y papel picado bajo Capas activas, en cordel o en pila si el panel está contraído, que se agita con el
  hover. Todo vive en `components/DiaDeMuertos/` y respeta `prefers-reduced-motion`
- El logo del IIEG del sider sale a `DiaDeMuertos/LogoIieg.jsx`

### Cambiado

- **`ScrollContainer` corre sobre scroll-edges**, la librería headless que salió de él (vendorizada en
  `vendor/scroll-edges-0.1.0.tgz`). Se ve igual; ya no mide con cada cambio de clase de sus hijos, observa
  los que llegan después de montar y el sider engancha su máscara aunque su contenido se monte tarde.
  Salen seis props sin uso y `useScrollOverflow`


## [2.3.0] - 2026-10-06

### Agregado

- **Resaltar la capa al pasar el mouse en Capas activas.** Las demás capas visibles bajan al 20 % de su
  opacidad en 150 ms y vuelven al salir; también en el comparador y en la vista 3D, que copia esas
  opacidades. Si la capa comparte imagen WMS con otras de su workspace, tras 200 ms se pide una imagen
  solo con ella (cancelada si el puntero sale antes, reutilizada si el mapa no se movió) y la compartida
  se atenúa cuando llega. Las funciones de aislar una capa salen del pulso de selección a
  `helpers/layers/aislarCapa.js`
  Hovers seguidos no acumulan atenuado: el regreso pendiente se completa antes del siguiente.
  Las capas H3 agrupadas (varias capas del visor en una sola capa vectorial) se reconocen por sus
  `memberIds`: la capa con el puntero ya no atenúa sus propios hexágonos.
  Si las capas cambian durante el hover (el switch H3 rechazado por exceso de elementos regresa la capa
  a WMS), el resaltado restaura y se vuelve a aplicar sobre las capas nuevas.
  Seleccionar una capa con el puntero encima suelta el resaltado al instante antes de la pulsación, que
  así devuelve las demás a su opacidad real y no al 20 %.
- **La marca del IIEG es permanente** y lleva el pin del mapa incrustado (`ico_iieg_mapa.svg`, el de
  portalito) en lugar del cuadro morado: se ve siempre desde el zoom 15, sin tener que tocar el logo. El
  logo sigue volando a ella y abriendo su tarjeta
- **Caminar el instituto (BETA, fuera de producción).** El botón con la persona en la columna de acciones de
  la tarjeta de la marca del IIEG (gris y con el motivo en el tooltip si el navegador no tiene WebGL2; enciende la
  vista 3D si está apagada) carga el edificio del IIEG desde `GET /instituto/edificio` (schema `instituto` de dataengine) y lo
  dibuja con three.js sobre el relieve: muros, techos, la planta alta sobre Dirección General, la
  azotea con pretil y la escalera de dos tramos con descanso. Se camina en primera o tercera persona
  con un avatar genérico (W A S D o flechas, Q E para girar, Shift para correr, arrastrar para mirar,
  V cambia la vista, Esc sale), con colisión contra muros y un tope de 60 cm de desnivel por paso. Una
  pastilla arriba dice en qué piso y espacio se está. Mientras se camina se apagan el relieve, las capas
  temáticas, las etiquetas y el sombreado (vuelven al salir; con el relieve de 15 m exagerado la cámara
  quedaba sobre el techo) y el mapa solo se repinta cuando algo cambia: a la altura de una
  persona y mirando al horizonte pedían cientos de mosaicos y redibujaban todo en cada cuadro. Es la prueba de viabilidad del frente 19
  (recorridos 3D). Necesita dataengine 1.49.0 y la carga del edificio aplicada antes
- **Inicio de sesión y capas privadas.** El visor entra con minerva (app propia `mapalab`, en una
  ventana emergente; si el navegador la bloquea, por redirect completo). El botón vive en el borde del
  sider, arriba del botón de estado (también en móvil): sin sesión entra directo; con sesión muestra iniciales,
  correo, cuántas capas privadas hay y Salir. El árbol público deja fuera los nodos `privada` y sus
  descendientes (esquema del caché 4); `GET /sesion/capas` entrega por usuario el complemento que le
  toca, y el frontend lo cuelga de su padre. Las capas privadas pasan por `/privado/{workspace}/wms`
  y `/wfs`, que validan la cookie y el acceso y reenvían a GeoServer con la credencial de servicio.
  Resolver, metadatos, periodicidad, estadísticas, descarga y catálogo responden 404 a quien no la
  puede ver. Un enlace con capas privadas que no puedes ver avisa con una pastilla y ofrece entrar.
  Pide en el `.env` `MINERVA_ISSUER_URL`, `MINERVA_PUBLIC_BASE`, `MINERVA_CLIENT_ID` y
  `MAPALAB_SESSION_HOURS`, y los secretos `minerva_client_secret` y `mapalab_session_secret`.
  Necesita dataengine 1.47.0 y mariachi con la pestaña de acceso desplegados antes
- **Las águilas pueden seguir una ruta.** Un dato curioso cuyo destino trae puntos de avance encuadra
  el recorrido completo en vez de centrar el punto final, y el visor dibuja la línea de avance sobre el
  mapa, con guiones en movimiento y un vértice por punto. El dato queda pineado en el último punto y la
  línea se quita al cerrarlo o al regresar. Con movimiento reducido la línea se dibuja quieta.
- **Telemetría del mapa incrustado.** El backend agrega por llave y sitio los Web Vitals y el tiempo
  hasta listo que manda el iframe (antes se tiraban), la latencia de `/embed/config` y del proxy WMS, y
  las cargas, errores JS, timeouts y denegados, y los manda cada 60 s a mariachi
  (`/internal/mapalab/keys/rendimiento` y `/sitios`), que los muestra en la pestaña Uso de la llave. El
  iframe manda el «listo» en cuanto ocurre, y el widget avisa desde el sitio anfitrión cuando se cansa de
  esperar o recibe un error, con `sendBeacon` en texto plano para no pedir preflight. Las denegaciones de
  llaves inexistentes ya dejan fila en la auditoría con el prefijo visible de la llave, y el registro de
  accesos deja de escribir una fila por cada tesela WMS y cada envío de telemetría. Dentro del embed los
  errores ya no se reportan también a `/log/client-error`, para no contar doble. Requiere mariachi
  2.136.0 desplegado antes.
- **Grabar una vuelta de la vista 3D (BETA).** Descargar elige primero qué bajar, Imagen o Animación,
  también en «Descargar imagen» del catálogo y también fuera de 3D. Animación ofrece Vuelta 3D (entra a
  3D si hace falta y graba) o Ruta en dron (abre el modo dron con el minimapa grande para trazar la ruta
  y grabarla con REC; solo en el visor). En el comparador la animación queda apagada. La vuelta se graba
  en tiempo real con la órbita del botón de play, a la velocidad de Ajustes 3D: el video (MP4 o WebM,
  720p o 1080p) dura lo que la vuelta, y el GIF cuadrado de 480 px toma cuadros a lo largo de ella y
  dura 3 o 5 s en loop. El formato que el navegador no pueda generar sale apagado. Barra de avance y
  Cancelar. Cada cuadro lleva el logo largo de MapaLab, la flecha del norte, el minimapa del visor con
  los logos de IIEG y Jalisco encima, la capa con rumbo, inclinación y zoom, y la atribución del mapa
  base. mediabunny y gifenc se cargan solo al grabar.
- **Grabar el vuelo del dron (BETA).** Botón REC en las acciones del minimapa del dron: se elige la
  cámara (1ª persona, 3ª persona o la del cono) y graba video en tiempo real hasta 1 min (30 s en
  celular), con el contador sobre el minimapa. REC otra vez detiene y descarga; ocultar la pestaña o salir del dron también.
  La cámara del cono pone la vista desde el dron hacia el suelo con la inclinación del cono, como un
  dron de mapeo, y el recuadro muestra la huella en el suelo. El minimapa marca el dron con su rumbo.
- Las acciones del minimapa del dron (expandir y rumbo arriba a la derecha; acercar y alejar abajo a la
  izquierda) aparecen al pasar el cursor con el minimapa contraído y quedan fijas con el minimapa grande;
  en pantallas táctiles quedan visibles.
- En las grabaciones el logo de MapaLab va a la mitad del tamaño, la flecha del norte queda a una
  distancia del borde que la deja girar sin salirse, y el recuadro, el minimapa y la atribución bajan
  al mismo margen que los demás elementos (4 % del lado corto).
- En el video del dron van, sin fondo, los mismos instrumentos que el dron en pantalla (altura,
  velocidad y el tercer instrumento de cada aeronave) bajo el nombre de la capa y su contador, y debajo
  el perfil del terreno. Los logos largos de IIEG y Jalisco van arriba del minimapa, que vuelve a ser el
  del visor (silueta con el municipio), más chico. Sin tiempo en el cuadro: el reproductor ya lo muestra.
  La flecha del norte es más chica. El minimapa contraído del dron es un poco más grande.
- La pastilla MANUAL/AUTO del dron va siempre arriba de los instrumentos, con sus opciones encima al
  pasar el cursor, en vez de flotar sobre el dron.
- La pastilla del dron cambia: botones sin fondo, en el gris y tamaño de los de zoom, que se pintan de
  morado al activarse; el primero abre y minimiza los instrumentos (el panel ya no tiene botón propio:
  contraído se abre con un clic y muestra si la altura está fija y la velocidad) y el segundo abre junto
  a la pastilla la tarjeta de grabar (cámara, formato y el PNG del recorrido). La velocidad se cambia con
  un clic en el velocímetro (1, 2, 3 y de vuelta) y la altura sobre el terreno se fija con un clic en el
  altímetro, que muestra un candado. En la pastilla 3D, el botón del dron y el engrane también van sin
  fondo y en gris. Las pastillas de zoom, 3D y dron comparten medidas: cada botón ocupa 40 px de alto,
  sin separación extra, y el fondo del seleccionado es un círculo de 28 px.
- Elegir el centro de la vuelta 3D: la vista actual o un punto que se marca con un clic en el mapa. Una
  pastilla arriba del mapa dice qué está pasando (eligiendo el centro, preparando, grabando con su
  avance, guardando) y deja cancelar; antes no se veía nada mientras arrancaba. La vuelta ya no lleva
  diales: solo la capa.
- Grabar una ruta la recorre completa: el dron vuela hasta 20 veces más rápido mientras graba y, si aún
  no cabe en un minuto, se toman menos cuadros. El minimapa del video dibuja el trazo que ya voló.
- La pastilla de trazos del minimapa va pegada a la derecha: primero la información, en su pastilla, y
  luego sus botones sueltos, con uno nuevo para grabar el trazo. Con el minimapa grande sus botones se
  ven siempre; contraído, al pasar el cursor. El minimapa del dron tiene una sombra más suave, como la
  de los instrumentos.
- El contador REC sobre el minimapa también detiene y descarga al darle clic. La grabación ya no tiene
  botón en el minimapa: se abre desde la pastilla, desde la pastilla de trazos o desde Descargar.
- Descargar → Animación → Ruta en dron ofrece «Grabar esta ruta» si ya hay una trazada, o «Crear la ruta
  y grabar»: abre el minimapa con la tarjeta de grabar lista y resaltada en naranja unos segundos, el
  dron vuela la ruta y el video se detiene al llegar al último punto.
- La ruta ya no se descarga aparte: se vuela y se graba con REC, y el PNG del recorrido quedó como
  enlace en la tarjeta de grabar.
- El botón de Colibrí para reportar lleva el badge BETA en la esquina superior derecha. Sale en el
  visor, el catálogo, el embebido y el inicio.
- Los badges BETA de Colibrí y del Catálogo van en la misma posición, en pill y en icono. En celular
  son más compactos para que no se junten.
- Al pasar el cursor, el botón de Colibrí se pinta de lila igual que la pill del Catálogo; antes solo
  oscurecía el icono y casi no se notaba.

### Cambiado

- **Producción solo enseña lo estable.** Con `VITE_APP_ENV` distinto de `dev` o `beta` se ocultan la vista 3D (y con ella el dron, las grabaciones y «Animación» en Descargar), los hexágonos, el minimapa, el botón N, la tabla de datos, el inicio de sesión y las capas privadas, el catálogo (la ruta `/catalogo` lleva al mapa), «Insertar en otra página», la barra divisora, la vista por municipio y el panel desacoplado de estadísticas con sus herramientas. Los enlaces compartidos y la URL tampoco los activan: un enlace del comparador abre su panel activo como mapa normal. Colibrí se queda. En `dev` y `beta` todo sigue visible, y «ver como producción» de las devtools enseña cómo queda. Cada puerta de entrada a algo oculto lleva su badge BETA (se sumaron el botón N, la sesión, el cubo de 3D en Capas activas, desacoplar estadísticas y el minimapa), así que en beta lo que tiene BETA es justo lo que producción no enseña. Sin «Vista por municipio», el botón de la barra superior crece a «Descargar mapa» y llena el ancho, alineado con Capas activas.
- **Al entrar a la vista 3D se apagan cuerpos de agua y curvas de nivel.** Siguen en Capas activas con el ojo
  apagado para volver a prenderlas; no aportan al relieve y alentaban el arranque. Al volver a 2D se encienden
  las que se apagaron así (`CAPAS_OCULTAS_EN_3D` en `helpers/view3d.js`)

- **El dominio se escribe una vez en el `.env`.** `DOMINIO`, `DOMINIO_MINERVA` y `SITIO` arriba del archivo;
  las URLs públicas, de acervo y de minerva se arman con ellas. El manifiesto de minerva ya no lleva hosts:
  `scripts/manifiesto-minerva.sh <env>` lo rellena con `DOMINIO` antes de importarlo
- El minimapa del visor ya no se oculta en 3D ni en el dron: se recorre a la derecha de la pastilla 3D
  (o de la del dron). En 3D un clic en él mueve el mapa 3D; en el dron no responde al clic, porque la
  posición la lleva el vuelo.
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

- Los enlaces a la página del IIEG (footer, logo de la portada y tarjeta del IIEG en el mapa) apuntan a
  `https://iieg.jalisco.gob.mx/`. El PDF de la licencia sigue en `iieg.gob.mx`, el único que lo sirve
- El widget embebible usa por defecto `https://iieg.jalisco.gob.mx/mapalab` cuando no se le pasa
  `base-url`; antes apuntaba a `mapalab.iieg.gob.mx`, que no existe. Bundle de `public/widget/v1/` reconstruido
- **`make refresh-layer-tree` ya regenera el árbol.** Hacía el `POST /layers/refresh-cache` desde el host a
  `localhost:8000` sin `X-Internal-Token` y siempre respondía 401; en producción ese puerto ni está publicado.
  Ahora corre dentro del contenedor del backend del entorno levantado, con el token de su propia configuración

- **El logo del IIEG en la vista 3D** movía el mapa 2D escondido y la cámara 3D se quedaba donde estaba. Ahora
  la cámara vuela a la marca conservando inclinación y rumbo, y la marca se dibuja también en 3D desde el zoom 15

- **En el catálogo una capa de puntos en hexágonos no se podía levantar en 3D.** El cubo preguntaba siempre por
  el modo puntos; ahora sigue al selector Puntos/Hexágonos y los hexágonos suben por su conteo, como en el visor

- **Un grupo en hexágonos no mostraba el cubo** (Establecimientos de salud, por ejemplo): el modo vive en sus hojas
  y el cubo solo miraba al grupo. Los hexágonos suben con escala logarítmica para que una celda de 600 no aplane
  a las de 5

- **La vuelta de minerva usa el host y el protocolo de la petición.** El `redirect_uri` salía de
  `MAPALAB_PUBLIC_BASE_URL` y el nginx pisaba `X-Forwarded-Proto` con `http`: quien entraba por otro
  nombre volvía a otro host y la cookie salía sin `Secure`. Se agrega `manifest.minerva.yml` para dar de
  alta la app `mapalab` en minerva
- **Las leyendas nuevas ya aparecen tras «Vaciar cachés» en mariachi.** El gateway guarda cada `GetLegendGraphic` seis horas, así que una leyenda recién subida no salía. El `wmsConfig` de cada capa trae ahora `legendVersion` (de `mapalab.workspaces.legend_version`, dataengine 1.48.0) y el visor la agrega a la URL de la leyenda como `&lv=`; GeoServer ignora el parámetro, pero la URL nueva no está en la caché del gateway. El ETag del árbol incluye esas versiones y `_TREE_SCHEMA` pasa a 5: sin eso, subir la versión no cambiaba el ETag y el navegador seguía con el árbol viejo por un 304. El catálogo arma su leyenda desde su propia API y no lo cubre.
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

