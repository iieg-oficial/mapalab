import { describe, it, expect } from 'vitest';
import { createAttributeTable, WfsError } from '@ghegar/tamiz';
import {
    crearAcumulador, fuenteWfs, mensajeDeError, ordenTamiz, sincronizar,
} from '@pages/maps/helpers/tamizTabla';

const DESCRIBE = {
    featureTypes: [{
        properties: [
            { name: 'clave', type: 'xsd:string', localType: 'string' },
            { name: 'alumnos', type: 'xsd:int', localType: 'int' },
            { name: 'geom', type: 'gml:Point', localType: 'Point' },
        ],
    }],
};

const crearWfs = (total = 250) => {
    const peticiones = [];
    const fetch = async (url, init) => {
        const query = init?.method === 'POST' ? String(init.body) : url.split('?')[1];
        const params = Object.fromEntries(new URLSearchParams(query));
        peticiones.push(params);
        if (params.request === 'DescribeFeatureType') return new Response(JSON.stringify(DESCRIBE));
        const inicio = Number(params.startIndex || 0);
        const cuantos = Math.min(Number(params.count), Math.max(0, total - inicio));
        const features = Array.from({ length: cuantos }, (_, i) => ({
            type: 'Feature', id: `escuelas.${inicio + i + 1}`, properties: { clave: String(inicio + i), alumnos: i },
        }));
        return new Response(JSON.stringify({ type: 'FeatureCollection', features, numberMatched: total }));
    };
    return { fetch, peticiones };
};

const esperar = async () => {
    for (let i = 0; i < 10; i += 1) await new Promise(resolve => setTimeout(resolve, 0));
};

const crearTabla = (wfs) => createAttributeTable({
    source: { url: 'https://geo.example.mx/wfs', typeName: 'educacion:escuelas', fetch: wfs.fetch },
    pageSize: 100,
    stableSort: true,
});

describe('fuenteWfs y ordenTamiz', () => {
    it('arma la fuente WFS desde la configuracion WMS de la capa', () => {
        expect(fuenteWfs({ baseUrl: 'https://geo.example.mx/educacion/wms', layerName: 'educacion:escuelas' }))
            .toEqual({ url: 'https://geo.example.mx/educacion/wfs', typeName: 'educacion:escuelas', version: '2.0.0' });
        expect(fuenteWfs({ baseUrl: 'https://x/wms', layerName: 'a', wfsLayerName: 'b' }).typeName).toBe('b');
        expect(fuenteWfs(null)).toBeNull();
    });

    it('traduce el orden del contexto al de tamiz', () => {
        expect(ordenTamiz({ columna: 'alumnos', descendente: true })).toEqual({ field: 'alumnos', direction: 'desc' });
        expect(ordenTamiz(null)).toBeNull();
    });
});

describe('mensajeDeError', () => {
    it('traduce los codigos de estado sin texto de GeoServer', () => {
        expect(mensajeDeError(new WfsError('WFS request failed with HTTP 400', 400)))
            .toBe('El servicio no pudo resolver la consulta de esta capa');
        expect(mensajeDeError(new WfsError('WFS request failed with HTTP 503', 503)))
            .toBe('El servicio de datos no está respondiendo');
    });

    it('prefiere el texto de la excepcion de GeoServer', () => {
        expect(mensajeDeError(new WfsError('Could not parse CQL filter list', 200))).toBe('Could not parse CQL filter list');
        expect(mensajeDeError(null)).toBeNull();
    });
});

describe('crearAcumulador', () => {
    it('junta las paginas en orden para el scroll infinito y reinicia al cambiar la consulta', async () => {
        const wfs = crearWfs();
        const tabla = crearTabla(wfs);
        const acumulador = crearAcumulador(tabla);
        const quitar = acumulador.subscribe(() => {});
        tabla.start();
        await esperar();
        expect(acumulador.getSnapshot()).toHaveLength(100);
        tabla.setPage(1);
        await esperar();
        tabla.setPage(2);
        await esperar();
        const filas = acumulador.getSnapshot();
        expect(filas).toHaveLength(250);
        expect(filas[249].id).toBe('escuelas.250');
        expect(acumulador.getSnapshot()).toBe(filas);
        expect(wfs.peticiones.filter(p => p.startIndex).every(p => p.sortBy === 'clave ASC')).toBe(true);
        tabla.setBaseCql('alumnos > 3');
        await esperar();
        expect(acumulador.getSnapshot()).toHaveLength(100);
        quitar();
    });
});

describe('sincronizar', () => {
    it('solo toca lo que cambio para no regresar el scroll a la primera pagina', async () => {
        const wfs = crearWfs();
        const tabla = crearTabla(wfs);
        const consulta = {
            base: "nivel = 'Primaria'",
            filtros: { alumnos: { familia: 'numero', min: 10, max: null } },
            expresion: null,
            orden: { columna: 'alumnos', descendente: true },
            tamano: 100,
        };
        sincronizar(tabla, consulta);
        tabla.start();
        await esperar();
        const ultima = wfs.peticiones.at(-1);
        expect(ultima.CQL_FILTER).toBe("(nivel = 'Primaria') AND (alumnos >= 10)");
        expect(ultima.sortBy).toBe('alumnos DESC');
        tabla.setPage(1);
        await esperar();
        sincronizar(tabla, { ...consulta, filtros: { ...consulta.filtros } });
        expect(tabla.getSnapshot().page).toBe(1);
        sincronizar(tabla, { ...consulta, filtros: {}, expresion: 'alumnos < 5', tamano: 1 });
        await esperar();
        expect(tabla.getSnapshot().filters).toEqual({});
        expect(wfs.peticiones.at(-1).CQL_FILTER).toBe("(nivel = 'Primaria') AND (alumnos < 5)");
        expect(wfs.peticiones.at(-1).count).toBe('1');
    });
});
