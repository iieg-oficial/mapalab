import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxifyLayerTree } from './embedProxy';

afterEach(() => vi.restoreAllMocks());

const arbol = [{ id: 'g', children: [{ id: 'a', wmsConfig: { baseUrl: '/geoserver/wms', layerName: 'economia:a' } }] }];

describe('capas del embed por el proxy', () => {
    it('cada capa lleva la llave y el origen del sitio que contiene el iframe', () => {
        vi.spyOn(window, 'parent', 'get').mockReturnValue({});
        vi.spyOn(document, 'referrer', 'get').mockReturnValue('https://sitio.ejemplo.mx/pagina');
        const capa = proxifyLayerTree(arbol, 'mk_pub_abcd')[0].children[0].wmsConfig;
        expect(capa.baseUrl).toMatch(/\/embed\/wms-proxy$/);
        expect(capa._embedKey).toBe('mk_pub_abcd');
        expect(capa._embedParent).toBe('https://sitio.ejemplo.mx');
    });

    it('fuera de un iframe no hay origen del padre', () => {
        expect(proxifyLayerTree(arbol, 'mk_pub_abcd')[0].children[0].wmsConfig._embedParent).toBeNull();
    });
});
