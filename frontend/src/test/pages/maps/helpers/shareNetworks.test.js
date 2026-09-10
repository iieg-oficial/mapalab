import { describe, it, expect } from 'vitest';
import { REDES_COMPARTIR, TEXTO_COMPARTIR } from '@pages/maps/helpers/shareNetworks';

const URL_MAPA = 'https://iieg.jalisco.gob.mx/mapalab/mapa?s=k7Qm2x&extra=1';

describe('REDES_COMPARTIR', () => {
    it('cada red tiene id unico y etiqueta', () => {
        const ids = REDES_COMPARTIR.map((red) => red.id);
        expect(new Set(ids).size).toBe(ids.length);
        REDES_COMPARTIR.forEach((red) => expect(red.etiqueta).toBeTruthy());
    });

    it('los iconos salen del Acervo por ruta relativa, sin host ni IP', () => {
        REDES_COMPARTIR.forEach((red) => {
            expect(red.icono.startsWith('/acervo/iieg/iconos/')).toBe(true);
            expect(red.icono).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
            expect(red.icono).not.toContain(' ');
        });
    });

    it('todas las redes aceptan un enlace y codifican la URL completa', () => {
        expect(REDES_COMPARTIR.map((red) => red.id)).toEqual(['whatsapp', 'facebook', 'x', 'linkedin', 'telegram']);
        REDES_COMPARTIR.forEach((red) => {
            const destino = red.construir(URL_MAPA, TEXTO_COMPARTIR);
            expect(destino).toContain(encodeURIComponent(URL_MAPA));
            expect(destino).not.toContain('&extra=1');
        });
    });

    it('whatsapp y telegram traen un icono provisional mientras llegan los oficiales', () => {
        ['whatsapp', 'telegram'].forEach((id) => {
            const red = REDES_COMPARTIR.find((r) => r.id === id);
            expect(red.respaldo.startsWith('data:image/svg+xml')).toBe(true);
        });
        expect(REDES_COMPARTIR.find((r) => r.id === 'whatsapp').icono).toContain('ico_wa.svg');
        expect(REDES_COMPARTIR.find((r) => r.id === 'telegram').icono).toContain('ico_tg.svg');
    });

    it('whatsapp pone el texto y el enlace en el mismo mensaje', () => {
        const wa = REDES_COMPARTIR.find((red) => red.id === 'whatsapp');
        expect(wa.construir(URL_MAPA, TEXTO_COMPARTIR)).toBe(
            `https://wa.me/?text=${encodeURIComponent(`${TEXTO_COMPARTIR} ${URL_MAPA}`)}`,
        );
    });
});
