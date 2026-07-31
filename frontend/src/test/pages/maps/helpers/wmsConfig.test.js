import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('VITE_GEOSERVER_URL', 'http://geo.test/geoserver/');

const {
    hydrateWmsConfig,
    hydrateLayerTree,
    findWMSConfig,
    hasWMSConfig,
    resolveTimeStyle,
    findLayerDef,
    JALISCO_BOUNDS
} = await import('@pages/maps/helpers/wmsConfig');

const LAYERS = [
    {
        id: 'group-a',
        children: [
            { id: 'layer-1', wmsConfig: { workspace: 'economia', layerName: 'economia:empleo' } },
            {
                id: 'label-node',
                isLabel: true,
                children: [
                    { id: 'layer-2', wmsConfig: { workspace: 'salud', layerName: 'salud:hospitales' } }
                ]
            }
        ]
    },
    { id: 'leaf', wmsConfig: { workspace: 'general', layerName: 'general:limites' } },
    { id: 'no-wms' }
];

describe('JALISCO_BOUNDS', () => {
    it('tiene coords, center y zoom', () => {
        expect(JALISCO_BOUNDS.coords).toHaveLength(4);
        expect(JALISCO_BOUNDS.center).toHaveLength(2);
        expect(typeof JALISCO_BOUNDS.zoom).toBe('number');
    });
});

describe('hydrateWmsConfig', () => {
    it('retorna null para input nulo', () => {
        expect(hydrateWmsConfig(null)).toBeNull();
        expect(hydrateWmsConfig(undefined)).toBeNull();
    });

    it('retorna null si falta geoserverWorkspace o geoserverLayer', () => {
        expect(hydrateWmsConfig({ workspace: 'seguridad' })).toBeNull();
        expect(hydrateWmsConfig({ geoserverWorkspace: 'x' })).toBeNull();
    });

    it('construye baseUrl y layerName desde geoserverWorkspace + geoserverLayer', () => {
        const cfg = hydrateWmsConfig({
            workspace: 'seguridad',
            geoserverWorkspace: 'seguridad_y_proteccion_ciudadana',
            geoserverLayer: 'delitos',
        });
        expect(cfg.baseUrl).toBe('http://geo.test/geoserver/seguridad_y_proteccion_ciudadana/wms');
        expect(cfg.layerName).toBe('seguridad_y_proteccion_ciudadana:delitos');
    });

    it('incluye propiedades base WMS', () => {
        const cfg = hydrateWmsConfig({
            workspace: 'general',
            geoserverWorkspace: 'general',
            geoserverLayer: 'limites',
        });
        expect(cfg.format).toBe('image/png');
        expect(cfg.transparent).toBe(true);
        expect(cfg.version).toBe('1.1.0');
        expect(cfg.antialias).toBe('full');
        expect(cfg.srs).toBeUndefined();
    });

    it('preserva styles, cqlFilter y otros campos del backend', () => {
        const cfg = hydrateWmsConfig({
            workspace: 'economia',
            geoserverWorkspace: 'economia',
            geoserverLayer: 'empleo',
            styles: 'mi_estilo',
            cqlFilter: 'col > 5',
            wmsGroup: 'grupo-x',
            wfsAvailable: false,
        });
        expect(cfg.styles).toBe('mi_estilo');
        expect(cfg.cqlFilter).toBe('col > 5');
        expect(cfg.wmsGroup).toBe('grupo-x');
        expect(cfg.wfsAvailable).toBe(false);
    });
});

describe('hydrateLayerTree', () => {
    it('hidrata wmsConfig recursivamente en hijos', () => {
        const tree = [
            {
                id: 'tema',
                children: [
                    {
                        id: 'hoja',
                        wmsConfig: {
                            workspace: 'seguridad',
                            geoserverWorkspace: 'seguridad_y_proteccion_ciudadana',
                            geoserverLayer: 'delitos',
                        },
                    },
                ],
            },
        ];
        const hydrated = hydrateLayerTree(tree);
        expect(hydrated[0].children[0].wmsConfig.layerName).toBe('seguridad_y_proteccion_ciudadana:delitos');
        expect(hydrated[0].children[0].wmsConfig.baseUrl).toContain('seguridad_y_proteccion_ciudadana/wms');
    });

    it('retorna el input tal cual si no es array', () => {
        expect(hydrateLayerTree(null)).toBeNull();
        expect(hydrateLayerTree('foo')).toBe('foo');
    });

    it('conserva nodos sin wmsConfig sin modificar', () => {
        const tree = [{ id: 'x', label: 'X', isCategory: true, children: [] }];
        const hydrated = hydrateLayerTree(tree);
        expect(hydrated[0].wmsConfig).toBeUndefined();
    });
});

describe('findWMSConfig', () => {
    it('encuentra config en nivel raíz', () => {
        expect(findWMSConfig('leaf', LAYERS)).toEqual(LAYERS[1].wmsConfig);
    });

    it('encuentra config anidada profundidad 2', () => {
        expect(findWMSConfig('layer-1', LAYERS).workspace).toBe('economia');
    });

    it('encuentra config anidada profundidad 3', () => {
        expect(findWMSConfig('layer-2', LAYERS).workspace).toBe('salud');
    });

    it('retorna null para capa sin wmsConfig', () => {
        expect(findWMSConfig('no-wms', LAYERS)).toBeNull();
    });

    it('retorna null para ID inexistente', () => {
        expect(findWMSConfig('fantasma', LAYERS)).toBeNull();
    });
});

describe('hasWMSConfig', () => {
    it('retorna true si la capa tiene wmsConfig', () => {
        expect(hasWMSConfig('leaf', LAYERS)).toBe(true);
    });

    it('retorna false si la capa no tiene wmsConfig', () => {
        expect(hasWMSConfig('no-wms', LAYERS)).toBe(false);
    });

    it('retorna false para ID inexistente', () => {
        expect(hasWMSConfig('fantasma', LAYERS)).toBe(false);
    });
});

describe('resolveTimeStyle', () => {
    it('reemplaza {year} y {month} en el pattern', () => {
        expect(resolveTimeStyle('lluvia_{year}_{month}', '2024-03')).toBe('lluvia_2024_03');
    });

    it('funciona con pattern que solo tiene {year}', () => {
        expect(resolveTimeStyle('temp_{year}', '2024-06')).toBe('temp_2024');
    });

    it('retorna null si pattern es null', () => {
        expect(resolveTimeStyle(null, '2024-03')).toBeNull();
    });

    it('retorna null si pattern es undefined', () => {
        expect(resolveTimeStyle(undefined, '2024-03')).toBeNull();
    });

    it('retorna null si timeValue es null', () => {
        expect(resolveTimeStyle('lluvia_{year}', null)).toBeNull();
    });

    it('retorna null si timeValue es undefined', () => {
        expect(resolveTimeStyle('lluvia_{year}', undefined)).toBeNull();
    });

    it('retorna null si ambos son null', () => {
        expect(resolveTimeStyle(null, null)).toBeNull();
    });

    it('retorna null si pattern es string vacío', () => {
        expect(resolveTimeStyle('', '2024-03')).toBeNull();
    });

    it('retorna null si timeValue es string vacío', () => {
        expect(resolveTimeStyle('pattern', '')).toBeNull();
    });
});

describe('findLayerDef', () => {
    it('encuentra capa en nivel raíz', () => {
        expect(findLayerDef('leaf', LAYERS).id).toBe('leaf');
    });

    it('encuentra capa anidada', () => {
        expect(findLayerDef('layer-2', LAYERS).id).toBe('layer-2');
    });

    it('retorna null para ID inexistente', () => {
        expect(findLayerDef('fantasma', LAYERS)).toBeNull();
    });
});
