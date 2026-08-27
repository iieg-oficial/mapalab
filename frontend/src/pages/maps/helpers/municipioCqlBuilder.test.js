import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildLayerMunicipioCql, CQL_SIN_RESOLVER } from './municipioCqlBuilder';

const baseContext = {
    active: true,
    claves: ['14039', '14120'],
    nombres: ['Guadalajara', 'Zapopan'],
    bbox: [-103.5, 20.5, -103.2, 20.8],
    listLoading: false,
    allMunicipiosCount: 125,
};

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('buildLayerMunicipioCql', () => {
    it('devuelve null cuando el contexto no esta activo', () => {
        expect(buildLayerMunicipioCql({ hasMunicipio: true }, null)).toBeNull();
        expect(buildLayerMunicipioCql({ hasMunicipio: true }, { active: false })).toBeNull();
    });

    it('construye IN con claves por defecto', () => {
        const meta = { hasMunicipio: true, municipioField: 'cve_mun' };
        expect(buildLayerMunicipioCql(meta, baseContext)).toBe(
            "cve_mun IN ('14039','14120')",
        );
    });

    it('construye IN con nombres cuando el tipo es nombre', () => {
        const meta = { hasMunicipio: true, municipioField: 'nom_mun', municipioFieldType: 'nombre' };
        expect(buildLayerMunicipioCql(meta, baseContext)).toBe(
            "nom_mun IN ('Guadalajara','Zapopan')",
        );
    });

    it('escapa comillas simples en los valores', () => {
        const meta = { hasMunicipio: true, municipioField: 'nom_mun', municipioFieldType: 'nombre' };
        const context = { ...baseContext, nombres: ["Tonala's"] };
        expect(buildLayerMunicipioCql(meta, context)).toBe("nom_mun IN ('Tonala''s')");
    });

    it('cae en BBOX cuando la capa no tiene campo de municipio', () => {
        const meta = { hasMunicipio: false };
        expect(buildLayerMunicipioCql(meta, baseContext)).toBe(
            "BBOX(geom, -103.5, 20.5, -103.2, 20.8, 'EPSG:6368')",
        );
    });

    it('cae en BBOX y advierte cuando no hay valores resolubles', () => {
        const meta = { hasMunicipio: true, municipioField: 'cve_mun' };
        const context = { ...baseContext, claves: [], nombres: [] };
        expect(buildLayerMunicipioCql(meta, context, 'capa_x')).toBe(
            "BBOX(geom, -103.5, 20.5, -103.2, 20.8, 'EPSG:6368')",
        );
        expect(console.warn).toHaveBeenCalled();
    });

    it('advierte cuando faltan nombres pero usa los disponibles', () => {
        const meta = { hasMunicipio: true, municipioField: 'nom_mun', municipioFieldType: 'nombre' };
        const context = { ...baseContext, claves: ['14039', '14120', '14070'], nombres: ['Guadalajara'] };
        expect(buildLayerMunicipioCql(meta, context, 'capa_y')).toBe(
            "nom_mun IN ('Guadalajara')",
        );
        expect(console.warn).toHaveBeenCalled();
    });

    it('devuelve null cuando no hay campo ni bbox valido', () => {
        const meta = { hasMunicipio: false };
        const context = { ...baseContext, bbox: null };
        expect(buildLayerMunicipioCql(meta, context)).toBeNull();
    });

    it('no pide nada mientras la lista de municipios no ha cargado', () => {
        const meta = { hasMunicipio: true, municipioField: 'nom_mun', municipioFieldType: 'nombre' };
        const context = { ...baseContext, nombres: [], bbox: null, allMunicipiosCount: 0, listLoading: true };
        expect(buildLayerMunicipioCql(meta, context, 'capa_z')).toBe(CQL_SIN_RESOLVER);
        expect(console.warn).not.toHaveBeenCalled();
    });

    it('no advierte cuando la lista aun no llega aunque ya no este cargando', () => {
        const meta = { hasMunicipio: true, municipioField: 'nom_mun', municipioFieldType: 'nombre' };
        const context = { ...baseContext, nombres: [], bbox: null, allMunicipiosCount: 0, listLoading: false };
        expect(buildLayerMunicipioCql(meta, context, 'capa_w')).toBe(CQL_SIN_RESOLVER);
        expect(console.warn).not.toHaveBeenCalled();
    });

    it('filtra por clave sin esperar la lista de municipios', () => {
        const meta = { hasMunicipio: true, municipioField: 'cve_mun' };
        const context = { ...baseContext, nombres: [], bbox: null, allMunicipiosCount: 0, listLoading: true };
        expect(buildLayerMunicipioCql(meta, context, 'capa_v')).toBe(
            "cve_mun IN ('14039','14120')",
        );
    });
});
