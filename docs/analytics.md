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

## Debug en desarrollo

En `VITE_NODE_ENV=development` aparece un panel flotante en la esquina inferior izquierda que muestra cada evento disparado con sus parametros y hora. Los eventos **no se envian a GA4** en este modo.

En produccion el panel no renderiza y los eventos van a `window.dataLayer` para GTM.
