import mapalabSquareIcon from '@logos/mapalab_square.svg';
import { APP_VERSION, APP_LOC } from '@constants/app';
import { collectCatalogUnits } from './layers/utils/layerHelpers';

export const computeIiegStats = ({ allLayers = [] } = {}) => {
    const units = collectCatalogUnits({ children: allLayers });
    return {
        totalLayers: units.length,
    };
};

const formatCount = (n) => (typeof n === 'number' ? n.toLocaleString('es-MX') : '—');

export const buildIiegMarker = ({ totalLayers = 0, totalRecords = null } = {}) => ({
    id: 'iieg_hq',
    center: [-103.44669185275052, 20.68443473644039],
    zoom: 16,
    icon: mapalabSquareIcon,
    scale: 0.25,
    anchor: [0.5, 0.5],
    minZoom: 15,
    bgColor: '#5c2472',
    bgRadius: 45,
    openOnShow: true,
    infoBox: {
        layerName: 'MapaLab — IIEG Jalisco',
        properties: {
            nombre: 'MapaLab',
            version: `v${APP_VERSION}`,
            institucion: 'Instituto de Información Estadística y Geográfica del Estado de Jalisco',
            descripcion: 'Mapa interactivo de Jalisco con capas geoespaciales. La herramienta oficial para visualizar y analizar información territorial del estado.',
            direccion: 'Calz. de los Pirules #71, Ciudad Granja, 45010 Zapopan, Jal.',
            telefono: '(33) 3777 1770',
            correo: 'iieg@jalisco.gob.mx',
            sitio_web: 'iieg.gob.mx',
            tecnologias: 'React, OpenLayers, FastAPI, GeoServer, PostGIS',
            capas_disponibles: formatCount(totalLayers),
            registros_geograficos: formatCount(totalRecords),
            lineas_codigo: formatCount(APP_LOC)
        },
        littleCard: {
            headerField: 'nombre',
            bodyOrder: ['labels', 'labelGroups', 'list', 'cards', 'iconText', 'text'],
            labelGroups: [
                { fields: ['version'], color: '#ffffff', bg: '#5c2472' },
                { fields: ['tecnologias'], splitValues: true, color: '#465055', bg: '#EFF3FC' }
            ],
            list: [
                { label: 'Organismo', field: 'institucion', raw: true },
                { label: 'Descripción', field: 'descripcion', raw: true }
            ],
            cards: [
                { label: 'Alrededor de capas disponibles', field: 'capas_disponibles' },
                { label: 'Registros geográficos', field: 'registros_geograficos' },
                { label: 'Líneas de código', field: 'lineas_codigo' }
            ],
            cardsColumns: 1,
            iconText: [
                { icon: 'ubicacion', field: 'direccion' },
                { icon: 'celular', field: 'telefono' },
                { icon: 'web', value: 'iieg.gob.mx', href: 'https://iieg.gob.mx/ns/' },
                { icon: 'novedades', value: `Novedades v${APP_VERSION}`, action: 'whats_new' },
                { icon: 'bug', value: 'Reportar problema o sugerencia', action: 'report' }
            ]
        }
    }
});

export const EMBED_MARKER_COLOR = '#5c2472';

export const buildEmbedMarker = ({ center, icon = null, color = null, title = null, description = null } = {}) => {
    const useDefaultIcon = !icon;
    const marker = {
        id: 'embed_marker',
        center,
        icon: icon || mapalabSquareIcon,
        scale: useDefaultIcon ? 0.12 : 1,
        anchor: useDefaultIcon ? [0.5, 0.5] : [0.5, 1]
    };
    const bgColor = color || (useDefaultIcon ? EMBED_MARKER_COLOR : null);
    if (bgColor) {
        marker.bgColor = bgColor;
        marker.bgRadius = 22;
    }
    if (title) {
        marker.infoBox = {
            layerName: title,
            properties: { titulo: title, descripcion: description || '' },
            littleCard: {
                headerField: 'titulo',
                bodyOrder: ['list'],
                list: [{ label: '', field: 'descripcion', raw: true }]
            }
        };
    }
    return marker;
};
