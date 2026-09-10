import { describe, it, expect } from 'vitest';
import { parseEmbedParams, sanitizeColor, sanitizeIconUrl, sanitizeText } from './embedParams';
import { buildEmbedMarker, EMBED_MARKER_ICON } from '@pages/maps/helpers/markerDefinitions';
import { RELIEF_OVERLAY_Z_INDEX } from '@pages/maps/helpers/basemaps';

const paramsOf = (query) => parseEmbedParams(new URLSearchParams(query));

describe('parametros del marcador del embed', () => {
    it('lee el marcador como lat,lng', () => {
        expect(paramsOf('marker=20.68,-103.44').marker).toEqual([20.68, -103.44]);
    });

    it('descarta coordenadas fuera de rango o incompletas', () => {
        expect(paramsOf('marker=91,-103.44').marker).toBeNull();
        expect(paramsOf('marker=20.68,-181').marker).toBeNull();
        expect(paramsOf('marker=20.68').marker).toBeNull();
        expect(paramsOf('marker=norte,sur').marker).toBeNull();
    });

    it('solo acepta iconos por http, https o data:image', () => {
        expect(sanitizeIconUrl('https://iieg.gob.mx/pin.svg')).toBe('https://iieg.gob.mx/pin.svg');
        expect(sanitizeIconUrl('data:image/svg+xml;base64,abc')).toBe('data:image/svg+xml;base64,abc');
        expect(sanitizeIconUrl('javascript:alert(1)')).toBeNull();
        expect(sanitizeIconUrl('data:text/html,<script>')).toBeNull();
    });

    it('solo acepta color hexadecimal', () => {
        expect(sanitizeColor('#5c2472')).toBe('#5c2472');
        expect(sanitizeColor('#abc')).toBe('#abc');
        expect(sanitizeColor('red')).toBeNull();
        expect(sanitizeColor('#12345')).toBeNull();
    });

    it('normaliza el texto de la tarjeta y lo recorta', () => {
        expect(sanitizeText('  Instituto   de\n Informacion ', 120)).toBe('Instituto de Informacion');
        expect(sanitizeText('x'.repeat(200), 120)).toHaveLength(120);
        expect(sanitizeText('   ', 120)).toBeNull();
    });
});

describe('marcador del embed', () => {
    it('usa el pin de IIEG anclado en la punta cuando no se pide icono', () => {
        const marker = buildEmbedMarker({ center: [-103.44, 20.68], color: '#ff8300' });
        expect(marker.icon).toBe(EMBED_MARKER_ICON);
        expect(marker.anchor).toEqual([0.5, 1]);
        expect(marker.bgColor).toBeUndefined();
    });

    it('el pin de IIEG es el doble de grande en escritorio que en movil', () => {
        const escritorio = buildEmbedMarker({ center: [-103.44, 20.68] });
        const movil = buildEmbedMarker({ center: [-103.44, 20.68], isMobile: true });
        expect(escritorio.scale).toBe(movil.scale * 2);
        expect(buildEmbedMarker({ center: [-103.44, 20.68], icon: 'https://x.mx/pin.svg' }).scale).toBe(1);
    });

    it('dibuja el pin encima de las etiquetas, la mascara y el relieve', () => {
        const marker = buildEmbedMarker({ center: [-103.44, 20.68] });
        expect(marker.zIndex).toBeGreaterThan(RELIEF_OVERLAY_Z_INDEX);
    });

    it('pinta el circulo de color detras de un icono propio', () => {
        const marker = buildEmbedMarker({ center: [-103.44, 20.68], icon: 'https://x.mx/pin.svg', color: '#ff8300' });
        expect(marker.bgColor).toBe('#ff8300');
    });

    it('ancla el icono propio a su base y lo deja sin circulo', () => {
        const marker = buildEmbedMarker({ center: [-103.44, 20.68], icon: 'https://x.mx/pin.svg' });
        expect(marker.anchor).toEqual([0.5, 1]);
        expect(marker.bgColor).toBeUndefined();
    });

    it('no arma tarjeta si no hay titulo', () => {
        expect(buildEmbedMarker({ center: [-103.44, 20.68], description: 'sin titulo' }).infoBox).toBeUndefined();
    });

    it('arma la tarjeta con titulo y descripcion', () => {
        const marker = buildEmbedMarker({
            center: [-103.44, 20.68],
            title: 'IIEG',
            description: 'Calz. de los Pirules #71',
        });
        expect(marker.infoBox.properties).toEqual({ titulo: 'IIEG', descripcion: 'Calz. de los Pirules #71' });
        expect(marker.infoBox.littleCard.headerField).toBe('titulo');
    });
});
