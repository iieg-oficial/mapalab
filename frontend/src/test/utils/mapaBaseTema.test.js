import { describe, it, expect, beforeEach } from 'vitest';
import { MAPA_OSCURO, mapaParaGuardar, recordarMapaAnterior } from '@pages/maps/helpers/mapaBaseTema';

describe('mapaBaseTema', () => {
    beforeEach(() => recordarMapaAnterior(null));

    it('un mapa elegido por el visitante se guarda tal cual', () => {
        expect(mapaParaGuardar('satelite')).toBe('satelite');
        expect(mapaParaGuardar(undefined)).toBeNull();
    });

    it('el oscuro del tema se guarda como el mapa que había antes', () => {
        recordarMapaAnterior('osm');
        expect(mapaParaGuardar(MAPA_OSCURO)).toBe('osm');
    });

    it('sin mapa anterior el oscuro no se guarda', () => {
        expect(mapaParaGuardar(MAPA_OSCURO)).toBeNull();
    });
});
