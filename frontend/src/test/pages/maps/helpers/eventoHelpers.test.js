import { describe, it, expect } from 'vitest';
import {
    slugifyTitulo,
    findLayerByWorkspaceLayer,
    buildEventoIndex,
} from '@pages/maps/helpers/eventoHelpers';

describe('slugifyTitulo', () => {
    it('retorna cadena vacia si no hay titulo', () => {
        expect(slugifyTitulo(null)).toBe('');
        expect(slugifyTitulo(undefined)).toBe('');
        expect(slugifyTitulo('')).toBe('');
    });

    it('convierte a minusculas y sustituye espacios por guiones', () => {
        expect(slugifyTitulo('Mundial 2026')).toBe('mundial-2026');
    });

    it('quita acentos y diacriticos', () => {
        expect(slugifyTitulo('México lindo')).toBe('mexico-lindo');
        expect(slugifyTitulo('La acción está aquí')).toBe('la-accion-esta-aqui');
    });

    it('colapsa multiples no-alfanumericos en un solo guion', () => {
        expect(slugifyTitulo('hola!!! mundo???')).toBe('hola-mundo');
    });

    it('elimina guiones al inicio y al final', () => {
        expect(slugifyTitulo('   hola   ')).toBe('hola');
        expect(slugifyTitulo('-mundo-')).toBe('mundo');
    });

    it('trunca a 60 caracteres', () => {
        const long = 'a'.repeat(80);
        expect(slugifyTitulo(long)).toHaveLength(60);
    });
});

describe('findLayerByWorkspaceLayer', () => {
    const tree = [
        {
            id: 'tema-1',
            children: [
                { id: 'capa-a', workspaceAlias: 'demografia', geoserverLayer: 'poblacion' },
                {
                    id: 'cat',
                    children: [
                        { id: 'capa-b', wmsConfig: { workspace: 'salud', geoserverLayer: 'hospitales' } },
                    ],
                },
            ],
        },
    ];

    it('retorna null si workspace o layer estan vacios', () => {
        expect(findLayerByWorkspaceLayer('', 'x', tree)).toBeNull();
        expect(findLayerByWorkspaceLayer('x', '', tree)).toBeNull();
    });

    it('encuentra capas usando workspaceAlias y geoserverLayer', () => {
        const found = findLayerByWorkspaceLayer('demografia', 'poblacion', tree);
        expect(found?.id).toBe('capa-a');
    });

    it('recorre el arbol y encuentra capas en wmsConfig anidados', () => {
        const found = findLayerByWorkspaceLayer('salud', 'hospitales', tree);
        expect(found?.id).toBe('capa-b');
    });

    it('retorna null si no encuentra match', () => {
        expect(findLayerByWorkspaceLayer('no', 'existe', tree)).toBeNull();
    });
});

describe('buildEventoIndex', () => {
    const allLayers = [
        { id: 'capa-1', workspaceAlias: 'a', geoserverLayer: 'x' },
        { id: 'capa-2', workspaceAlias: 'b', geoserverLayer: 'y' },
    ];

    it('construye index vacio si no hay eventos', () => {
        const { eventoByLayerId, layerIdsByEvento } = buildEventoIndex([], allLayers);
        expect(eventoByLayerId.size).toBe(0);
        expect(layerIdsByEvento.size).toBe(0);
    });

    it('mapea evento → ids de capas que referencia', () => {
        const eventos = [
            { id: 10, capas: [{ tipo: 'capa', workspace: 'a', layer: 'x' }] },
        ];
        const { layerIdsByEvento } = buildEventoIndex(eventos, allLayers);
        expect(Array.from(layerIdsByEvento.get(10))).toEqual(['capa-1']);
    });

    it('mapea layerId → evento (el primero gana en colisiones)', () => {
        const eventos = [
            { id: 1, capas: [{ tipo: 'capa', workspace: 'a', layer: 'x' }] },
            { id: 2, capas: [{ tipo: 'capa', workspace: 'a', layer: 'x' }] },
        ];
        const { eventoByLayerId } = buildEventoIndex(eventos, allLayers);
        expect(eventoByLayerId.get('capa-1').id).toBe(1);
    });

    it('baja en categorias y skip etiquetas al indexar', () => {
        const eventos = [
            {
                id: 5,
                capas: [
                    { tipo: 'etiqueta', alias: 'header' },
                    {
                        tipo: 'categoria',
                        capas: [{ tipo: 'capa', workspace: 'b', layer: 'y' }],
                    },
                ],
            },
        ];
        const { layerIdsByEvento } = buildEventoIndex(eventos, allLayers);
        expect(Array.from(layerIdsByEvento.get(5))).toEqual(['capa-2']);
    });

    it('mapea aliasByLayerId con alias trimmeado cuando viene definido', () => {
        const eventos = [
            { id: 1, capas: [{ tipo: 'capa', workspace: 'a', layer: 'x', alias: '  Lluvia abril 2024  ' }] },
        ];
        const { aliasByLayerId } = buildEventoIndex(eventos, allLayers);
        expect(aliasByLayerId.get('capa-1')).toBe('Lluvia abril 2024');
    });

    it('no agrega entrada en aliasByLayerId cuando alias esta vacio o ausente', () => {
        const eventos = [
            { id: 1, capas: [{ tipo: 'capa', workspace: 'a', layer: 'x' }] },
            { id: 2, capas: [{ tipo: 'capa', workspace: 'b', layer: 'y', alias: '   ' }] },
        ];
        const { aliasByLayerId } = buildEventoIndex(eventos, allLayers);
        expect(aliasByLayerId.has('capa-1')).toBe(false);
        expect(aliasByLayerId.has('capa-2')).toBe(false);
    });

    it('aliasByLayerId conserva el primer alias en colisiones entre eventos', () => {
        const eventos = [
            { id: 1, capas: [{ tipo: 'capa', workspace: 'a', layer: 'x', alias: 'Primero' }] },
            { id: 2, capas: [{ tipo: 'capa', workspace: 'a', layer: 'x', alias: 'Segundo' }] },
        ];
        const { aliasByLayerId } = buildEventoIndex(eventos, allLayers);
        expect(aliasByLayerId.get('capa-1')).toBe('Primero');
    });
});
