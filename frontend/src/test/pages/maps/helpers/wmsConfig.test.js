import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.stubEnv('VITE_GEOSERVER_URL', 'http://geo.test/geoserver/');

const {
    createWMSConfig,
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

describe('createWMSConfig', () => {
    it('genera baseUrl usando el workspace', () => {
        const cfg = createWMSConfig('economia', 'empleo');
        expect(cfg.baseUrl).toBe('http://geo.test/geoserver/economia/wms');
    });

    it('genera layerName con nombre real para workspaces mapeados', () => {
        const cfg = createWMSConfig('seguridad', 'delitos');
        expect(cfg.layerName).toBe('seguridad_y_proteccion_ciudadana:delitos');
    });

    it('genera layerName directo para workspaces sin mapeo', () => {
        const cfg = createWMSConfig('salud', 'hospitales');
        expect(cfg.layerName).toBe('salud:hospitales');
    });

    it('incluye propiedades base WMS', () => {
        const cfg = createWMSConfig('general', 'limites');
        expect(cfg.format).toBe('image/png');
        expect(cfg.transparent).toBe(true);
        expect(cfg.version).toBe('1.1.0');
        expect(cfg.srs).toBe('EPSG:6368');
    });

    it('respeta styles y cqlFilter pasados', () => {
        const cfg = createWMSConfig('economia', 'empleo', 'mi_estilo', 'col > 5');
        expect(cfg.styles).toBe('mi_estilo');
        expect(cfg.cqlFilter).toBe('col > 5');
    });

    it('usa defaults vacíos para styles y cqlFilter', () => {
        const cfg = createWMSConfig('economia', 'empleo');
        expect(cfg.styles).toBe('');
        expect(cfg.cqlFilter).toBe('');
    });

    it('mapea todos los workspaces con nombre real', () => {
        const mappings = {
            seguridad: 'seguridad_y_proteccion_ciudadana',
            gobierno: 'gobierno_y_ciudadania',
            desarrollo: 'desarrollo_social',
            recursos: 'recursos_y_calidad_de_vida'
        };
        Object.entries(mappings).forEach(([alias, real]) => {
            const cfg = createWMSConfig(alias, 'layer');
            expect(cfg.layerName).toBe(`${real}:layer`);
        });
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
