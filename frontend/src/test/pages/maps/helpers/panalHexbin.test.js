import { describe, it, expect, vi } from 'vitest';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import OlMap from 'ol/Map';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat } from 'ol/proj';
import { montarHexbin } from '@pages/maps/helpers/hexbinEntrada';
import { HEXBIN_LAYER_FLAG, hexbinDeCapa, SinPrecalculado, fuentePrecalculada } from '@pages/maps/helpers/panalHexbin';
import { findHexbinCellAtPixel, markSelectedCell } from '@pages/maps/helpers/vectorFeatureQuery';

const GDL = fromLonLat([-103.35, 20.67]);
const MTY = fromLonLat([-100.31, 25.67]);
const esperar = () => new Promise(resolve => setTimeout(resolve, 30));
const mapa = () => new OlMap({ view: new View({ center: GDL, zoom: 11 }) });
const punto = coordenada => new Feature({ geometry: new Point(coordenada) });

describe('montarHexbin local', () => {
    it('agrupa los puntos que llegan y avisa estadísticas con la leyenda de panal', async () => {
        const map = mapa();
        const onStats = vi.fn();
        const montaje = montarHexbin({ map, precalculado: false, memberIds: ['escuelas'], zIndex: 4, opacity: 0.8, paletteIndex: 2, onStats });
        expect(map.getLayers().getArray()).toContain(montaje.layer);
        expect(montaje.layer.get(HEXBIN_LAYER_FLAG)).toBe(true);
        expect(montaje.layer.get('layerId')).toBe('escuelas');
        expect(montaje.layer.get('memberIds')).toEqual(['escuelas']);
        expect(montaje.layer.getZIndex()).toBe(4);

        montaje.vectorSource.addFeatures([punto(GDL), punto(GDL), punto(MTY)]);
        await esperar();
        const stats = onStats.mock.calls.at(-1)[0];
        expect(stats).toMatchObject({ cells: 2, max: 2, paletteIndex: 2 });
        expect(stats.legend.length).toBeGreaterThan(0);
        expect(montaje.layer.getSource().getFeatureById('87498c96effffff').get('count')).toBe(2);
    });

    it('las celdas se pueden serializar para el 3D', async () => {
        const montaje = montarHexbin({ map: mapa(), precalculado: false, memberIds: ['a'] });
        montaje.vectorSource.addFeatures([punto(GDL)]);
        await esperar();
        const json = new GeoJSON().writeFeaturesObject(montaje.layer.getSource().getFeatures());
        expect(() => structuredClone(json)).not.toThrow();
    });

    it('desmontar quita la capa del mapa', () => {
        const map = mapa();
        const montaje = montarHexbin({ map, precalculado: false, memberIds: ['a'] });
        montaje.desmontar();
        expect(map.getLayers().getArray()).not.toContain(montaje.layer);
    });
});

describe('montarHexbin precalculado', () => {
    it('sin GeoServer configurado no hay celdas y avisa para caer al navegador', async () => {
        const onSinPrecalculado = vi.fn();
        const onLoading = vi.fn();
        montarHexbin({ map: mapa(), precalculado: true, memberIds: ['delitos'], onSinPrecalculado, onLoading });
        expect(onLoading).toHaveBeenCalledWith(true);
        await esperar();
        expect(onSinPrecalculado).toHaveBeenCalledTimes(1);
        expect(onLoading).toHaveBeenLastCalledWith(false);
    });

    it('la fuente precalculada lanza SinPrecalculado cuando el servicio no trae celdas', async () => {
        const fuente = fuentePrecalculada(['delitos']);
        await expect(fuente.load({ resolution: 7, signal: new AbortController().signal })).rejects.toBeInstanceOf(SinPrecalculado);
    });
});

describe('clic en celda', () => {
    it('encuentra la celda por índice y la marca como seleccionada', async () => {
        const map = mapa();
        const montaje = montarHexbin({ map, precalculado: false, memberIds: ['escuelas'] });
        montaje.vectorSource.addFeatures([punto(GDL), punto(GDL)]);
        await esperar();

        const hit = findHexbinCellAtPixel(map, GDL, new Set(['escuelas']));
        expect(hit).toMatchObject({ layerId: 'escuelas', h3Index: '87498c96effffff', count: 2 });
        expect(hit.geometry.getType()).toBe('Polygon');
        expect(findHexbinCellAtPixel(map, GDL, new Set(['otra']))).toBeNull();
        expect(findHexbinCellAtPixel(map, fromLonLat([0, 0]), new Set(['escuelas']))).toBeNull();

        markSelectedCell(hit.layer, hit.h3Index);
        expect(hexbinDeCapa(hit.layer).getSnapshot().selection.h3Index).toBe('87498c96effffff');
        markSelectedCell(hit.layer, null);
        expect(hexbinDeCapa(hit.layer).getSnapshot().selection).toBeNull();
    });

    it('ignora capas ocultas o fuera de su rango de zoom', async () => {
        const map = mapa();
        const montaje = montarHexbin({ map, precalculado: false, memberIds: ['escuelas'], zoomRange: { min: 12 } });
        montaje.vectorSource.addFeatures([punto(GDL)]);
        await esperar();
        expect(findHexbinCellAtPixel(map, GDL, new Set(['escuelas']))).toBeNull();
    });
});
