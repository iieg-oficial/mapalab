import { Style, Icon as IconStyle, Text as TextStyle, Fill, Stroke, Circle as CircleStyle } from 'ol/style';
import { toLonLat } from 'ol/proj';
import { DRAW_COLORS } from './drawingConstants';
import { svgToDataUrl } from './drawingStyles';

export const PIN_ETIQUETAS = [
    { id: 'pin', texto: 'Solo el pin' },
    { id: 'coordenadas', texto: 'Coordenadas' },
    { id: 'texto', texto: 'Texto propio' },
];

export const PIN_ETIQUETA_INICIAL = 'pin';

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38">
<path d="M14 1C6.8 1 1 6.8 1 14c0 9.6 11.2 21.4 12.3 22.5a1 1 0 0 0 1.4 0C15.8 35.4 27 23.6 27 14 27 6.8 21.2 1 14 1z" fill="${DRAW_COLORS.purpleDeep}" stroke="#ffffff" stroke-width="2"/>
<circle cx="14" cy="14" r="5" fill="#ffffff"/>
</svg>`;

const PIN_SRC = svgToDataUrl(PIN_SVG);
const FUENTE = '600 12px "Garet", "Inter", sans-serif';

export const lonLatDePin = (geometria) => toLonLat(geometria.getCoordinates());

export const coordenadasDePin = (geometria) => {
    const [lng, lat] = lonLatDePin(geometria);
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
};

export const textoVisibleDePin = (feature) => {
    const modo = feature.get('pinEtiqueta') || PIN_ETIQUETA_INICIAL;
    if (modo === 'coordenadas') return coordenadasDePin(feature.getGeometry());
    if (modo === 'texto') return feature.get('textLabel') || '';
    return '';
};

export const etiquetaDePin = (feature) => {
    const texto = feature.get('pinEtiqueta') === 'texto' ? feature.get('textLabel') : '';
    const coordenadas = coordenadasDePin(feature.getGeometry());
    return texto ? `Pin: ${texto}\n${coordenadas}` : `Pin: ${coordenadas}`;
};

export const createPinStyle = (feature, selected = false) => {
    const texto = textoVisibleDePin(feature);
    const estilos = [
        new Style({
            image: new IconStyle({ src: PIN_SRC, anchor: [0.5, 1], crossOrigin: 'anonymous' }),
            text: texto ? new TextStyle({
                text: texto,
                font: FUENTE,
                textAlign: 'left',
                offsetX: 16,
                offsetY: -24,
                fill: new Fill({ color: '#111827' }),
                backgroundFill: new Fill({ color: 'rgba(255, 255, 255, 0.92)' }),
                padding: [3, 6, 3, 6],
            }) : undefined,
        }),
    ];
    if (selected) {
        estilos.unshift(new Style({
            image: new CircleStyle({
                radius: 22,
                displacement: [0, 19],
                fill: new Fill({ color: 'rgba(122, 47, 159, 0.12)' }),
                stroke: new Stroke({ color: DRAW_COLORS.purpleDeep, width: 2 }),
            }),
        }));
    }
    return estilos;
};

export const cerrarPin = (feature) => {
    const value = coordenadasDePin(feature.getGeometry());
    feature.set('measurementValue', value);
    feature.set('cachedStyle', createPinStyle(feature), true);
    return { value, label: etiquetaDePin(feature) };
};
