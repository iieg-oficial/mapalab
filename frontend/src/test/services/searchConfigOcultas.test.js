import { describe, expect, it } from 'vitest';
import { findAllMatches, rebuildSearchConfig } from '@services/searchConfig';

const capa = (id, label, extra = {}) => ({ id, label, wmsConfig: { layers: id }, ...extra });

describe('buscador sin capas ocultas', () => {
    it('no indexa capas, subtemas ni temas ocultos en el menu', () => {
        rebuildSearchConfig([
            {
                id: 'agua', label: 'Agua', children: [
                    capa('presas', 'Presas'),
                    capa('presas_viejas', 'Presas viejas', { hiddenInMenu: true }),
                    { id: 'sub', label: 'Sub', hiddenInMenu: true, children: [capa('presas_sub', 'Presas sub')] },
                ],
            },
            { id: 'oculto', label: 'Oculto', hiddenInMenu: true, children: [capa('presas_tema', 'Presas tema')] },
        ]);

        expect(findAllMatches('presas').map(m => m.layerId)).toEqual(['presas']);
    });
});
