import mapalabSquareIcon from '@logos/mapalab_square.svg';
import { APP_VERSION } from '@constants/app';

export const IIEG_MARKER = {
    id: 'iieg_hq',
    center: [-103.44669185275052, 20.68443473644039],
    zoom: 16,
    icon: mapalabSquareIcon,
    scale: 0.25,
    anchor: [0.5, 0.5],
    minZoom: 15,
    bgColor: '#5c2472',
    bgRadius: 45,
    infoBox: {
        layerName: 'MapaLab — IIEG Jalisco',
        properties: {
            nombre: 'MapaLab',
            version: `v${APP_VERSION}`,
            institucion: 'Instituto de Información Estadística y Geográfica del Estado de Jalisco',
            descripcion: 'Plataforma de visualización de datos geoespaciales de Jalisco',
            direccion: 'Calz. de los Pirules #71, Ciudad Granja, 45010 Zapopan, Jal.',
            telefono: '(33) 3777 1770',
            correo: 'iieg@jalisco.gob.mx',
            sitio_web: 'iieg.gob.mx',
            tecnologias: 'React, OpenLayers, FastAPI, GeoServer, PostGIS'
        },
        littleCard: {
            headerField: 'nombre',
            labelGroups: [
                { fields: ['version'], color: '#ffffff', bg: '#5c2472' },
                { fields: ['tecnologias'], splitValues: true, color: '#465055', bg: '#EFF3FC' }
            ],
            list: [
                { label: 'Organismo', field: 'institucion', raw: true },
                { label: 'Descripción', field: 'descripcion', raw: true }
            ],
            iconText: [
                { icon: 'ubicacion', field: 'direccion' },
                { icon: 'celular', field: 'telefono' },
                { icon: 'web', value: 'iieg.gob.mx', href: 'https://iieg.gob.mx/ns/' },
                { icon: 'novedades', value: `Novedades v${APP_VERSION}`, action: 'whats_new' }
            ]
        }
    }
};
