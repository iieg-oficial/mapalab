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
