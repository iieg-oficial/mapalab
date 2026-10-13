import { describe, it, expect, vi } from 'vitest';
import OlMap from 'ol/Map';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { installAggregationWorker } from '@ghegar/panal/worker/runtime';
import { montarHexbin } from '@pages/maps/helpers/hexbinEntrada';
import { Acercate, fuenteVista } from '@pages/maps/helpers/panalHexbin';

const esperar = (ms = 60) => new Promise(resolve => setTimeout(resolve, ms));

const parDePuertos = () => {
    const oyentes = { main: new Set(), worker: new Set() };
    const puerto = (propios, ajenos) => ({
        postMessage: (data) => queueMicrotask(() => ajenos.forEach(fn => fn({ data: structuredClone(data) }))),
        addEventListener: (_, fn) => propios.add(fn),
        removeEventListener: (_, fn) => propios.delete(fn)
    });
    return { main: puerto(oyentes.main, oyentes.worker), worker: puerto(oyentes.worker, oyentes.main) };
};

const montarWorker = () => {
    const { main, worker } = parDePuertos();
    const urls = [];
    const fetch = vi.fn(async (url) => {
        urls.push(new URL(url, 'http://local'));
        const features = [[-103.35, 20.67], [-103.3501, 20.6701]].map((lonLat, i) => ({
            type: 'Feature', id: `p.${i}`, properties: { n: i }, geometry: { type: 'Point', coordinates: fromLonLat(lonLat) }
        }));
        return new Response(JSON.stringify({ type: 'FeatureCollection', numberMatched: 2, features }));
    });
    installAggregationWorker(worker, { fetch });
    return { main, urls };
};

const WMS = { baseUrl: '/sextante/seguridad/wms', layerName: 'seguridad:delitos' };
const peticion = (extent) => ({ resolution: 7, extent, projection: 'EPSG:3857', signal: new AbortController().signal });

describe('fuenteVista', () => {
    it('cuenta la vista con margen y pide acercarse si pasa del tope', async () => {
        const { main, urls } = montarWorker();
        const contar = vi.fn().mockResolvedValue(80000);
        const fuente = fuenteVista({ worker: main, wmsConfig: WMS, cqlFilter: 'anio = 2025', geometria: 'geom', contar });
        await expect(fuente.load(peticion([-104, 20, -103, 21]))).rejects.toBeInstanceOf(Acercate);
        const cql = contar.mock.calls[0][1];
        expect(cql).toMatch(/^BBOX\(geom, .+, 'EPSG:3857'\) AND \(anio = 2025\)$/);
        expect(urls).toHaveLength(0);
    });

    it('debajo del tope descarga en el worker y no vuelve a contar dentro de lo cubierto', async () => {
        const { main, urls } = montarWorker();
        const contar = vi.fn().mockResolvedValue(10);
        const fuente = fuenteVista({ worker: main, wmsConfig: WMS, cqlFilter: '', geometria: 'geom', contar });
        const celdas = await fuente.load(peticion([-104, 20, -103, 21]));
        expect(celdas).toEqual([{ h3Index: '87498c96effffff', value: 2, count: 2 }]);
        expect(urls[0].pathname).toBe('/sextante/seguridad/wfs');
        expect(urls[0].searchParams.get('CQL_FILTER')).toBe(contar.mock.calls[0][1]);
        await fuente.load(peticion([-103.9, 20.1, -103.1, 20.9]));
        expect(contar).toHaveBeenCalledTimes(1);
        expect(urls).toHaveLength(1);
        await fuente.load(peticion([-100, 20, -99, 21]));
        expect(contar).toHaveBeenCalledTimes(2);
        fuente.release();
    });
});

describe('montarHexbin en modo vista', () => {
    it('oculta la capa mientras pide acercarse y la muestra al poder agrupar', async () => {
        const { main } = montarWorker();
        const map = new OlMap({ view: new View({ center: fromLonLat([-103.35, 20.67]), zoom: 7 }) });
        map.setSize([800, 600]);
        let total = 90000;
        const contar = vi.fn(async () => total);
        const onAcercate = vi.fn();
        const onStats = vi.fn();
        const montaje = montarHexbin({
            map,
            precalculado: false,
            vista: { worker: main, wmsConfig: WMS, cqlFilter: '', geometria: 'geom', contar },
            memberIds: ['delitos'],
            onAcercate,
            onStats
        });
        await esperar();
        expect(onAcercate).toHaveBeenCalledWith({ total: 90000, limite: 50000 });
        expect(montaje.layer.getVisible()).toBe(false);

        total = 30;
        map.getView().setZoom(12);
        map.dispatchEvent('moveend');
        await esperar(400);
        expect(montaje.layer.getVisible()).toBe(true);
        expect(onStats.mock.calls.at(-1)[0]).toMatchObject({ cells: 1, max: 2 });
        montaje.desmontar();
    });
});
