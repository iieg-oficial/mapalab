import { APP_VERSION } from '@constants/app';

export const CURRENT_VERSION = APP_VERSION;

export const RELEASE_TAGS = {
    added: { label: 'Agregado', color: '#22c55e' },
    fixed: { label: 'Corregido', color: '#3b82f6' },
    changed: { label: 'Cambiado', color: '#FF8300' },
    removed: { label: 'Eliminado', color: '#ef4444' },
    perf: { label: 'Rendimiento', color: '#8b5cf6' }
};

const FALLBACK_NOTES = [
    {
        version: '1.9.0',
        items: [
            { text: 'Compartir mapa: el boton ahora genera un enlace corto que recuerda el estado completo (capas activas, orden, filtros, opacidad, fechas, basemap, posicion)', tag: 'changed' },
            { text: 'Boton "Fijar 1 ano" en el modal de compartir para que el enlace no expire por inactividad', tag: 'added' },
            { text: 'Los enlaces compartidos no fijados se conservan 30 dias desde el ultimo acceso', tag: 'added' },
        ]
    },
    {
        version: '1.8.0',
        items: [
            { text: 'Las capas ahora tienen identificadores publicos legibles que aparecen en la URL (por ejemplo "establecimientos-salud" en lugar de IDs internos)', tag: 'changed' },
            { text: 'Acceso directo a una capa con un link tipo "?layer=establecimientos-salud" — abre el mapa con esa capa activa', tag: 'added' },
            { text: 'Cada capa puede tener atajos cortos opcionales (aliases). Por ejemplo "?layer=esalud" tambien funciona', tag: 'added' },
        ]
    },
    {
        version: '1.7.0',
        items: [
            { text: 'Editor de capas: reordenar capas del árbol arrastrándolas (drag & drop) entre hermanos del mismo grupo', tag: 'added' },
            { text: 'Editor de capas: preview del InfoBox con datos de ejemplo al seleccionar un preset', tag: 'added' },
            { text: 'Editor de capas: formulario dinámico que muestra solo los campos que aplican al preset elegido', tag: 'added' },
            { text: 'Editor de capas: editor de JSON libre para el preset "custom"', tag: 'added' },
            { text: 'Observabilidad: endpoints /metrics en formato Prometheus para monitoreo centralizado', tag: 'added' },
            { text: 'Limpieza de arquitectura interna: removida la dependencia del Google Sheet heredado', tag: 'changed' }
        ]
    },
    {
        version: '1.6.0',
        items: [
            { text: 'Editor de capas: los campos de GeoServer (workspace, capa, estilo) se eligen desde listas dinámicas en lugar de escribirse a mano', tag: 'changed' },
            { text: 'Edición masiva de tags desde el editor con pegado directo de Excel (hasta 500 capas por envío)', tag: 'added' },
            { text: 'Límites de tasa en el panel de administración para proteger el servicio ante ráfagas de peticiones', tag: 'added' }
        ]
    },
    {
        version: '1.5.1',
        items: [
            { text: 'Editoras ahora pueden guardar cambios en capas como borradores que un administrador revisa antes de publicar', tag: 'added' }
        ]
    },
    {
        version: '1.5.0',
        items: [
            { text: 'Seguridad reforzada en configuración de numeralia: las estadísticas ahora se configuran con operaciones predefinidas (contar, sumar, promedio...) en lugar de escribir consultas', tag: 'changed' },
            { text: 'Actualización más estable: cuando un administrador edita varias capas seguidas, el sistema agrupa los refrescos para no saturar el servidor', tag: 'perf' }
        ]
    },
    {
        version: '1.4.8',
        items: [
            { text: 'Corregido: la búsqueda ahora indexa correctamente las capas y responde con resultados', tag: 'fixed' }
        ]
    },
    {
        version: '1.4.7',
        items: [
            { text: 'Corregido: la búsqueda de capas no encontraba resultados tras la migración al backend', tag: 'fixed' }
        ]
    },
    {
        version: '1.4.6',
        items: [
            { text: 'Corregido: la información al hacer click sobre una capa (InfoBox) y las descargas vectoriales no funcionaban por una desconexión interna', tag: 'fixed' }
        ]
    },
    {
        version: '1.4.5',
        items: [
            { text: 'Corregido: algunas capas no se dibujaban en el mapa porque la dirección del servicio WMS no se construía correctamente', tag: 'fixed' }
        ]
    },
    {
        version: '1.4.4',
        items: [
            { text: 'Documentación completa del sistema de capas (docs/layers.md)', tag: 'added' },
            { text: 'Script idempotente de bootstrap para configurar el esquema de capas en DataEngine', tag: 'added' }
        ]
    },
    {
        version: '1.4.3',
        items: [
            { text: 'Refactor total del sistema de capas: el frontend ya no contiene definiciones hardcodeadas, toda la información se obtiene del backend en tiempo real', tag: 'changed' },
            { text: 'Nuevo hook `useLayers` como única fuente del árbol de capas; 20 componentes migrados', tag: 'changed' }
        ]
    },
    {
        version: '1.4.2',
        items: [
            { text: 'Metadata de capas (descripción, fuentes, metodología, numeralia) migrada a tabla editable desde mariachi', tag: 'added' },
            { text: 'Numeralia dinámica: los valores se calculan con queries SQL configurables y se actualizan automáticamente cada día', tag: 'added' },
            { text: 'Editor de metadata en panel de administrador', tag: 'added' }
        ]
    },
    {
        version: '1.4.1',
        items: [
            { text: 'Mejora de rendimiento: el árbol de capas ahora se sirve desde una caché materializada, cargando en menos de 5ms', tag: 'perf' },
            { text: 'Los procesos de actualización diaria (periodicidad, árbol de capas, numeralia) se centralizaron en DataEngine', tag: 'changed' }
        ]
    },
    {
        version: '1.4.0',
        items: [
            { text: 'Sistema de capas dinámico: admin puede agregar, editar y quitar capas sin tocar código desde el panel de administración', tag: 'added' },
            { text: 'Editor visual de capas con árbol jerárquico, búsqueda y formularios por sección', tag: 'added' },
            { text: 'Flujo de revisión: editoras crean borradores, administradores aprueban y publican', tag: 'added' },
            { text: 'Introspección de GeoServer desde el editor: selección visual de workspace, capa, campos y estilos disponibles', tag: 'added' },
            { text: 'Búsqueda de capas desde el servidor con caché ETag para respuestas instantáneas cuando el contenido no ha cambiado', tag: 'perf' }
        ]
    },
    {
        version: '1.3.0',
        items: [
            { text: 'Carga inicial del sitio significativamente más rápida gracias a la separación del código en paquetes independientes y optimización de imágenes', tag: 'perf' },
            { text: 'El spinner de carga solo se descarga cuando realmente se necesita, reduciendo el peso inicial de la página', tag: 'perf' },
            { text: 'Las animaciones de fechas en las capas se detienen automáticamente al ocultar la capa para evitar consumo innecesario', tag: 'perf' },
            { text: 'Mejor accesibilidad: todos los botones y controles clickeables ahora responden a navegación con teclado (Enter/Espacio) y lectores de pantalla', tag: 'added' },
            { text: 'Sistema visual para destacar características nuevas: un punto naranja aparece sobre las funciones recién agregadas y desaparece al usarlas', tag: 'added' },
            { text: 'En las capas del Bosque de La Primavera el mapa se encuadra automáticamente al área real de la capa, sin zoom hardcodeado', tag: 'added' },
            { text: 'Al eliminar tarjetas en móvil deslizando, la animación es más fluida: las tarjetas colapsan suavemente en lugar de saltar', tag: 'changed' },
            { text: 'Al eliminar una tarjeta en móvil ya no se mueven ni desaparecen otras tarjetas por error', tag: 'fixed' },
            { text: 'En móvil, ahora puedes hacer mediciones y clicks en el mapa tocando entre los paneles laterales (zonas vacías del panel dejan pasar la interacción)', tag: 'fixed' },
            { text: 'Nueva barra de scroll vertical personalizada en toda la aplicación, más sutil', tag: 'changed' },
            { text: 'Actualización de dependencias clave: React 19.2.5, OpenLayers 10.9, Tailwind 4.2.4 y otras mejoras internas', tag: 'changed' }
        ]
    },
    {
        version: '1.2.0',
        items: [
            { text: 'Animación de periodicidad para todas las capas con fechas (antes solo raster). Los años o meses pueden ciclar automáticamente desde el modal de detalle', tag: 'added' },
            { text: 'Controles de animación junto a "Periodicidad:" en el modal: velocidad (0.25s a 3s), dirección (→/←), play/pausa y eliminar filtro de fecha', tag: 'added' },
            { text: 'El modal detecta si estás viendo años o meses y al dar play inicia la animación en el modo correcto', tag: 'added' },
            { text: 'Etiqueta compacta de fecha en el panel de capas activas con formatos "2024", "JUN 2024", "3 MESES 2024". Al hacer clic se inicia la animación si es posible, si no abre el detalle', tag: 'added' },
            { text: 'Durante la animación, el año o mes actual se resalta en naranja institucional y el carrusel hace scroll para mantenerlo visible', tag: 'added' },
            { text: 'Las flechas del carrusel de años solo aparecen cuando realmente se puede scrollear en esa dirección', tag: 'changed' },
            { text: 'En polígonos, al regresar a "todos los años" el año seleccionado permanece destacado', tag: 'fixed' },
            { text: 'El botón de detalle de capa permanece visible durante la animación (antes desaparecía por el indicador de carga)', tag: 'fixed' },
            { text: 'Al tocar el logo del IIEG se abre automaticamente la tarjeta de informacion centrada sobre el marcador', tag: 'added' },
            { text: 'En celulares el panel lateral se colapsa al tocar el logo del IIEG para ver mejor el mapa', tag: 'changed' },
            { text: 'En celulares la tarjeta de informacion ahora aparece como panel inferior de pantalla completa, con indicadores cuando hay mas tarjetas arriba o abajo', tag: 'changed' },
            { text: 'Nueva barra de herramientas en la tarjeta de informacion movil con opcion de descargar multiples tarjetas y lista para crecer con mas acciones', tag: 'added' },
            { text: 'En celulares cada tarjeta tiene un header compacto (barra lateral morada) que se adapta al ancho del panel', tag: 'changed' },
            { text: 'En celulares puedes eliminar una tarjeta deslizandola horizontalmente', tag: 'added' },
            { text: 'Mensajes "sin informacion aqui" y "resumen de seleccion por area" ahora se ven igual de pulidos en celular con encabezado y tipografia adaptada', tag: 'changed' },
            { text: 'Al tocar una capa sugerida en la tarjeta vacia ahora se muestra su informacion en el punto clickeado', tag: 'fixed' },
            { text: 'Ahora puedes editar emojis y textos colocados en el mapa: toca uno para seleccionarlo y aparece una barra con controles para arrastrar, rotar, cambiar el tamaño y eliminar', tag: 'added' }
        ]
    },
    {
        version: '1.1.4',
        items: [
            { text: 'Aviso de licencia IIEG al descargar datos con link a la declaración oficial', tag: 'added' },
            { text: 'Información detallada de Áreas Naturales Protegidas al hacer click', tag: 'added' },
            { text: 'Proceso de despliegue optimizado', tag: 'perf' }
        ]
    },
    {
        version: '1.1.3',
        items: [
            { text: 'Capa "Áreas Naturales Protegidas" disponible en Recursos', tag: 'added' },
            { text: 'Catálogo completo de emojis con categorías en herramientas de medición', tag: 'added' },
            { text: 'Video explicativo en la página de inicio', tag: 'added' },
            { text: 'Vista previa mejorada al compartir enlaces (imagen y descripción)', tag: 'added' },
            { text: 'Centrar Jalisco se adapta correctamente a pantallas móviles', tag: 'fixed' },
            { text: 'El modal de novedades ya no se cierra al hacer scroll en móvil', tag: 'fixed' },
            { text: 'Licencia actualizada a Licencia IIEG 2026', tag: 'changed' }
        ]
    },
    {
        version: '1.1.2',
        items: [
            { text: 'Descripción del proyecto actualizada', tag: 'changed' }
        ]
    },
    {
        version: '1.1.1',
        items: [
            { text: 'Información del IIEG mejorada con tecnologías como etiquetas', tag: 'changed' }
        ]
    },
    {
        version: '1.1.0',
        items: [
            { text: 'Zoom automático al activar capas específicas', tag: 'added' },
            { text: 'Marcadores interactivos con información al hacer click', tag: 'added' },
            { text: 'Botón para centrar la vista en Jalisco desde los controles del mapa', tag: 'added' },
            { text: 'Capas con rango de visibilidad por nivel de zoom', tag: 'added' },
            { text: 'Color naranja en el marcador de ubicación', tag: 'changed' }
        ]
    },
    {
        version: '1.0.10',
        items: [
            { text: 'Capa "Carencia por calidad y espacios de la vivienda" en Desarrollo Social', tag: 'added' }
        ]
    },
    {
        version: '1.0.9',
        items: [
            { text: 'Formato de fechas y folios corregido en la información de capas', tag: 'fixed' },
            { text: 'Dirección abre Google Maps y teléfono abre marcador desde la información de capas', tag: 'changed' }
        ]
    },
    {
        version: '1.0.8',
        items: [
            { text: 'Descargas de capas grandes ya no fallan por tiempo de espera', tag: 'fixed' },
            { text: 'Primera descarga más rápida al abrir la plataforma', tag: 'perf' }
        ]
    },
    {
        version: '1.0.6',
        items: [
            { text: 'Descarga directa de capas raster en formato GeoTIFF con metadatos', tag: 'added' }
        ]
    },
    {
        version: '1.0.5',
        items: [
            { text: 'Animación mensual en capas de precipitación y temperatura', tag: 'added' },
            { text: 'Estilos dinámicos por mes en capas de clima', tag: 'added' }
        ]
    },
    {
        version: '1.0.4',
        items: [
            { text: 'La capa seleccionada se mantiene al compartir o recargar el enlace', tag: 'added' },
            { text: 'Filtros de fecha se aplican correctamente al abrir un enlace compartido', tag: 'fixed' }
        ]
    },
    {
        version: '1.0.3',
        items: [
            { text: 'El orden de capas activas se mantiene al recargar la página', tag: 'fixed' }
        ]
    },
    {
        version: '1.0.2',
        items: [
            { text: 'Flechas de navegación solo aparecen cuando hay contenido desbordado', tag: 'fixed' }
        ]
    },
    {
        version: '1.0.1',
        items: [
            { text: 'URLs de metadatos de capas corregidas', tag: 'fixed' }
        ]
    },
    {
        version: '1.0.0',
        items: [
            { text: 'Descarga de capas en múltiples formatos (GeoPackage, Shapefile, CSV)', tag: 'added' },
            { text: 'Selector de fecha con navegación por año y mes', tag: 'added' },
            { text: 'Exportación de mapa con escala, leyenda, norte y coordenadas', tag: 'added' },
            { text: 'Animación temporal en capas raster (precipitación, temperatura)', tag: 'added' },
            { text: 'Selección de features por polígono dibujado', tag: 'added' },
            { text: 'Compartir estado del mapa vía URL', tag: 'added' },
            { text: 'Selector de calidad de exportación de mapa', tag: 'added' },
            { text: 'Panel de simbología con auto-expansión al seleccionar capa', tag: 'added' },
            { text: 'Modo móvil del panel lateral', tag: 'added' },
            { text: 'Herramientas de medición de línea y polígono', tag: 'added' }
        ]
    }
];

const API_URL = `${import.meta.env.VITE_BACKEND_API_HOST}release-notes`;

export const fetchReleaseNotes = async () => {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(res.status);
        return await res.json();
    } catch {
        return FALLBACK_NOTES;
    }
};

export const releaseNotes = FALLBACK_NOTES;
