import { describe, it, expect } from 'vitest';
import { buildLayerMunicipioCql } from '@pages/maps/helpers/municipioCqlBuilder';
import { metaMunicipio, municipiosDeParam } from '@pages/catalogo/hooks/useCatalogoMunicipio';

const CONTEXTO = { active: true, claves: ['14120', '14039'], nombres: ['Zapopan', 'Guadalajara'], bbox: null, listLoading: false, allMunicipiosCount: 125 };

describe('municipio en el catálogo', () => {
    it('lee las claves del parámetro como el visor', () => {
        expect(municipiosDeParam('14120, 14039,')).toEqual(['14120', '14039']);
        expect(municipiosDeParam(null)).toEqual([]);
    });

    it('sin campo de municipio la capa no ofrece el filtro', () => {
        expect(metaMunicipio({ slug: 'cuencas' })).toBeNull();
        expect(metaMunicipio(null)).toBeNull();
    });

    it('una capa por nombre filtra con los nombres', () => {
        const meta = metaMunicipio({ slug: 'centros-educativos', municipioField: 'municipio', municipioFieldType: 'nombre' });
        expect(buildLayerMunicipioCql(meta, CONTEXTO)).toBe("municipio IN ('Zapopan','Guadalajara')");
    });

    it('una capa por clave filtra con las claves, y sin tipo se asume clave', () => {
        const meta = metaMunicipio({ slug: 'edad-mediana', municipioField: 'clave_municipio' });
        expect(meta.municipioFieldType).toBe('clave');
        expect(buildLayerMunicipioCql(meta, CONTEXTO)).toBe("clave_municipio IN ('14120','14039')");
    });
});
