# Analytics — Eventos GTM/GA4

Los eventos se envian a `window.dataLayer` para ser consumidos por GTM. En desarrollo se muestran en el panel de debug flotante (esquina inferior izquierda).

> **Integracion:** GTM se inyecta via `sub_filter` en gateway-hub (Nginx). El frontend solo hace push a `window.dataLayer`; no necesita `VITE_GTM_ID` ni ningun script de GTM propio.

## Eventos

| Evento | Parametros | Que mide | Donde se dispara | KPI |
|---|---|---|---|---|
| `map_interaction` | `action` | Conteo total de interacciones en el mapa | Acompaña a cada evento de mapa | Numero de visitas / Tasa de interaccion |
| `layer_toggle` | `layer_id`, `action: activar\|desactivar` | Capas mas populares y frecuencia de uso | Al activar o desactivar una capa | Capas mas activadas |
| `feature_click` | `layer_id` | Consultas de informacion por capa | Al hacer clic en el mapa y obtener resultados | Interaccion de clics en el mapa |
| `map_zoom_level` | `zoom_level` | Nivel de zoom usado (botones +/-) | Al pulsar zoom in / zoom out | Interaccion de clics en el mapa |
| `layer_search` | `query` | Terminos buscados con resultados exitosos | Al buscar una capa con coincidencias | Consultas de busqueda organica |
| `layer_detail_open` | `layer_id` | Capas cuyo detalle/metadata se consulta | Al abrir el modal de detalle de capa | Profundidad de desplazamiento |
| `layer_download` | `layer_id` | Descargas de datos espaciales por capa | Al descargar el ZIP de una capa con exito | Descargas |
| `map_export` | `format: png\|jpeg\|pdf`, `quality: Basica\|Normal\|Alta\|Ultra`, `view: vista_actual\|estado_completo` | Exportaciones de mapa por formato, calidad y vista | Al confirmar exportacion en el panel | Descargas / Uso de herramientas |
| `raster_loop_start` | `layer_id` | Uso de animacion temporal raster | Al iniciar el loop en capas de precipitacion/temperatura | Uso de herramientas / Filtros |
| `raster_loop_stop` | `layer_id` | Duracion implicita de uso del loop | Al detener el loop | Uso de herramientas |
| `drawing_tool_use` | `tool: Linea\|Poligono\|ManoAlzada\|Texto\|Emoji\|Seleccion` | Herramientas de dibujo/medicion utilizadas | Al seleccionar una herramienta en el panel de dibujo | Uso de herramientas |
| `basemap_change` | `basemap_id` | Preferencia de mapa base de los usuarios | Al cambiar el mapa base | Interaccion de clics en el mapa |
| `geolocate` | `status: exito\|error` | Uso de geolocalizacion y tasa de error | Al pulsar el boton de ubicacion | Uso de herramientas |
| `periodicity_advanced` | `layer_id` | Uso del selector de fechas avanzado por capa | Al activar modo avanzado de periodicidad (doble clic o pulsacion larga) | Uso de herramientas / Filtros |
| `sider_lock` | `mode: expandido\|colapsado\|automatico` | Preferencia de fijacion del menu lateral | Al cambiar el modo de bloqueo del sider (clic o Alt+B) | Interaccion de clics en el mapa |
| `share_map` | `status: exito\|error` | Uso del boton de compartir y tasa de error | Al copiar el enlace del mapa al portapapeles | Interaccion de clics en el mapa |
| `info_open` | — | Acceso a la informacion general de Mapalab | Al abrir el modal de informacion | Profundidad de desplazamiento |
| `report_submitted` | `tipo: problema\|solicitud\|sugerencia\|duda\|datos_incorrectos\|bug`, `source_route` | Reportes y sugerencias enviados al admin | Al confirmar el envio del reporte (POST exitoso) | Calidad / Soporte |
| `evento_open` | `evento_id`, `titulo` | Aperturas de eventos temáticos (mariachi) | Al montar `<EventoMenu>` (apertura del menú del evento desde el sider o el widget externo) | Eventos más usados |
| `evento_close` | `evento_id` | Cierre de evento (incluye unmount por navegación) | Al desmontar `<EventoMenu>` | Tiempo en evento (delta open/close) |
| `evento_center` | `evento_id` | Re-centrado manual del mapa sobre el evento | Al pulsar el botón "Centrar evento" de `<EventoActionsBar>` | Frecuencia con la que el usuario pierde el encuadre del evento |
| `infobox_action` | `action: center_group\|select_alternative\|empty_suggestions_view\|<tool_id>`, `layer_id` | Acciones dentro del InfoBox | `center_group` al centrar la selección, `empty_suggestions_view` al aparecer el estado vacío con sugerencias, `select_alternative` al elegir una capa sugerida, `<tool_id>` por cada herramienta del header mobile | Uso de herramientas / Fricción del estado vacío |

## Seccion Catalogo (`/catalogo`)

Estos eventos se emiten con `trackEvent` y **no** con `withMapInteraction`, por lo que no suman al agregado `map_interaction` del visor. Ademas, `detectSource()` en `telemetryService` etiqueta la seccion con `source: 'catalogo'` (antes caia como `visor`), lo que permite aislarla en el collector sin filtrar por `pathname`.

Las herramientas de medicion del catalogo reutilizan el tracker del visor, asi que tambien emiten `drawing_tool_use`.

| Evento | Parametros | Que mide | Donde se dispara | KPI |
|---|---|---|---|---|
| `catalogo_open` | `from: visor\|directo`, `slug` | Entradas a la seccion y su origen | Al montar `/catalogo`, una sola vez por montaje | Alcance de la seccion |
| `catalogo_search` | `query`, `results` | Terminos buscados y si arrojan resultados | Al cambiar la busqueda (valor ya debounceado, solo con texto) | Consultas de busqueda / Huecos de catalogo (`results: 0`) |
| `catalogo_layer_select` | `slug`, `from_search` | Capas abiertas y si se llego por busqueda o por el listado | Al elegir una capa de la lista | Capas mas consultadas |
| `catalogo_download` | `slug`, `format: geopackage\|shape-zip\|csv` | Descargas por capa y formato | Al pulsar un formato en el panel de leyendas | **Descargas (conversion de la seccion)** |
| `catalogo_feature_click` | `slug`, `count` | Uso de la consulta por clic y si devuelve datos | Tras el GetFeatureInfo del clic sobre la capa activa | Interaccion en el mapa / Clics sin resultado (`count: 0`) |
| `catalogo_tools_toggle` | `open` | Uso de las herramientas de medicion/anotacion | Al pulsar el boton regla/X | Uso de herramientas |
| `catalogo_layer_close` | `slug` | Cierre de la capa activa | Al pulsar el boton de cerrar capa del panel de leyendas | Rotacion entre capas |
| `catalogo_info_open` | — | Necesidad de explicacion de la seccion | Al abrir el modal "¿Que es el Catalogo?" | Friccion / Claridad de la UI |
| `catalogo_back` | `target` | Regresos al visor y a que URL | Al pulsar "Regresar a Mapalab" | Catalogo como puerta de entrada vs. salida |
| `catalogo_slug_not_found` | `slug` | Enlaces a capas inexistentes o mal formados | Cuando el slug de la URL no resuelve ni capa ni institucion | Calidad de enlaces compartidos |
| `catalogo_share` | `scope: capa\|institucion`, `slug`, `type: link\|qr\|qr_download` | Difusion de capas e instituciones y por que medio | Al copiar el enlace, mostrar el QR o descargarlo | **Difusion de la seccion** |
| `catalogo_institucion_select` | `slug`, `capas` | Uso del filtro por institucion y tamaño del catalogo filtrado | Al pulsar una pill de institucion (`slug: null` = Todas) | Instituciones mas consultadas |
| `catalogo_infobox_action` | `action: download\|center_group`, `slug` | Uso de la columna de acciones de la tarjeta de informacion | Al descargar las tarjetas como CSV o centrar la seleccion | Profundidad de consulta sobre la capa |
| `catalogo_infobox_editor_open` | `slug` | Interes en personalizar la tarjeta de una capa | Al abrir el editor, desde la lista de capas o desde la tarjeta | Capas cuya tarjeta se percibe incompleta |
| `catalogo_infobox_propuesta` | `slug`, `campos` | Propuestas enviadas y su tamaño | Tras el POST exitoso al endpoint publico | **Conversion del editor** (aperturas vs. envios) |

## Debug en desarrollo

En `VITE_NODE_ENV=development` aparece un panel flotante en la esquina inferior izquierda que muestra cada evento disparado con sus parametros y hora. Los eventos **no se envian a GA4** en este modo.

En produccion el panel no renderiza y los eventos van a `window.dataLayer` para GTM.
