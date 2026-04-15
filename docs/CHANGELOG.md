# Changelog

Todos los cambios notables del proyecto se documentan en este archivo.

El formato esta basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto se adhiere a [Versionado Semantico](https://semver.org/lang/es/).

## [No publicado]

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
- Actualizacion de dependencias del frontend.

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
