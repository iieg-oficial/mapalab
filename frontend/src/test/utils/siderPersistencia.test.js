import { describe, it, expect, beforeEach } from 'vitest';
import { guardarCandado, leerCandado } from '@utils/siderPersistencia';

describe('siderPersistencia', () => {
    beforeEach(() => localStorage.clear());

    it('sin nada guardado el candado es automatico', () => {
        expect(leerCandado()).toBe('auto');
    });

    it('conserva los cuatro modos validos', () => {
        for (const modo of ['auto', 'expanded', 'collapsed', 'mobile']) {
            guardarCandado(modo);
            expect(leerCandado()).toBe(modo);
        }
    });

    it('ignora un modo que no existe', () => {
        guardarCandado('mobile');
        guardarCandado('inventado');
        expect(leerCandado()).toBe('mobile');
    });

    it('cae en automatico si lo guardado no sirve', () => {
        localStorage.setItem('mapalab.sider.candado', 'basura');
        expect(leerCandado()).toBe('auto');
    });
});
