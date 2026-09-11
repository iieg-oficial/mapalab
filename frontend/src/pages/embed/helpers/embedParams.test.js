import { describe, it, expect } from 'vitest';
import { parseEmbedParams, sanitizeColor, sanitizeIconUrl, sanitizeMarkerCard, sanitizeText, VISOR_HREF } from './embedParams';
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

const TARJETA = {
    chips: [{ text: 'Sede · Zapopan', style: 'solid' }, { text: '8 direcciones' }],
    rows: [{ label: 'Qué hace', text: '**El Instituto** es el organismo responsable de difundir datos.' }],
    links: [
        { icon: 'ubicacion', text: 'Calz. de los Pirules #71' },
        { icon: 'mapas', text: 'Explorar Jalisco en MapaLab', href: '@visor' },
    ],
    tiles: [{ value: 2013, label: 'año de creación' }, { value: 16994827, label: 'registros ingestados' }],
    order: ['chips', 'rows', 'links', 'tiles'],
};

describe('tarjeta del marcador definida por el sitio que embebe', () => {
    it('lee el JSON y conserva los cuatro bloques', () => {
        const card = sanitizeMarkerCard(JSON.stringify(TARJETA));
        expect(card.chips).toEqual([{ text: 'Sede · Zapopan', style: 'solid' }, { text: '8 direcciones', style: 'soft' }]);
        expect(card.rows[0].label).toBe('Qué hace');
        expect(card.links[1].href).toBe(VISOR_HREF);
        expect(card.tiles.map((t) => t.value)).toEqual([2013, 16994827]);
        expect(card.open).toBe(true);
    });

    it('descarta JSON invalido, listas vacias y objetos que no son tarjeta', () => {
        expect(sanitizeMarkerCard('{no es json')).toBeNull();
        expect(sanitizeMarkerCard('[]')).toBeNull();
        expect(sanitizeMarkerCard('{"chips":[],"tiles":[]}')).toBeNull();
        expect(sanitizeMarkerCard(null)).toBeNull();
    });

    it('rechaza el JSON que pasa de 4 KB', () => {
        const grande = JSON.stringify({ rows: [{ text: 'x'.repeat(5000) }] });
        expect(sanitizeMarkerCard(grande)).toBeNull();
    });

    it('solo acepta iconos conocidos y hrefs http, https, tel, mailto o @visor', () => {
        const card = sanitizeMarkerCard(JSON.stringify({ links: [
            { icon: 'premio', text: 'no existe' },
            { icon: 'web', text: 'script', href: 'javascript:alert(1)' },
            { icon: 'celular', text: 'tel', href: 'tel:3337771770' },
            { icon: 'web', text: 'correo', href: 'mailto:iieg@jalisco.gob.mx' },
        ] }));
        expect(card.links.map((l) => [l.icon, l.href])).toEqual([['web', null], ['celular', 'tel:3337771770'], ['web', 'mailto:iieg@jalisco.gob.mx']]);
    });

    it('recorta cada bloque a su tope y cada texto a su largo', () => {
        const card = sanitizeMarkerCard(JSON.stringify({
            chips: Array.from({ length: 9 }, (_, i) => ({ text: `chip ${i}` })),
            rows: [{ text: 'y'.repeat(900) }],
        }));
        expect(card.chips).toHaveLength(6);
        expect(card.rows[0].text).toHaveLength(400);
    });

    it('ignora valores de mosaico que no son numero ni texto', () => {
        const card = sanitizeMarkerCard(JSON.stringify({ tiles: [{ value: { x: 1 }, label: 'a' }, { value: '4 917 690', label: 'b' }, { value: Infinity, label: 'c' }] }));
        expect(card.tiles).toEqual([{ value: '4 917 690', label: 'b' }]);
    });

    it('respeta el orden pedido y cae al orden por omision si no sirve', () => {
        expect(sanitizeMarkerCard(JSON.stringify({ tiles: TARJETA.tiles, order: ['tiles', 'chips', 'nada'] })).order).toEqual(['tiles', 'chips']);
        expect(sanitizeMarkerCard(JSON.stringify({ tiles: TARJETA.tiles, order: ['nada'] })).order).toEqual(['chips', 'rows', 'links', 'tiles']);
    });

    it('arma la tarjeta del marcador con los bloques del InfoBox y el enlace al visor', () => {
        const card = sanitizeMarkerCard(JSON.stringify(TARJETA));
        const marker = buildEmbedMarker({ center: [-103.44, 20.68], title: 'IIEG Jalisco', card, visorHref: '/mapalab/mapa?marker=20.68,-103.44' });
        const { properties, littleCard } = marker.infoBox;
        expect(marker.openOnShow).toBe(true);
        expect(littleCard.blockOrder).toEqual(['labelGroups', 'list', 'iconText', 'cards']);
        expect(littleCard.labelGroups[0].fields[0]).toMatchObject({ field: 'chip_0', bg: '#5C2472' });
        expect(properties.chip_0).toBe('Sede · Zapopan');
        expect(littleCard.list[0]).toEqual({ label: 'Qué hace', field: 'row_0', raw: true });
        expect(littleCard.iconText[1].href).toBe('/mapalab/mapa?marker=20.68,-103.44');
        expect(littleCard.iconText[0].href).toBeUndefined();
        expect(littleCard.cardsColumns).toBe(2);
        expect(properties.tile_1).toBe(16994827);
    });

    it('sin tarjeta sigue armando la tarjeta simple de titulo y descripcion', () => {
        const marker = buildEmbedMarker({ center: [-103.44, 20.68], title: 'IIEG', description: 'Calz. de los Pirules #71' });
        expect(marker.infoBox.littleCard.list[0].field).toBe('descripcion');
        expect(marker.openOnShow).toBeUndefined();
    });
});
