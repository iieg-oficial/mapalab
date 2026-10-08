import { afterEach, describe, expect, it } from 'vitest';
import {
    AJUSTES_3D_DEFAULT, ajustesDistintos, guardarAjustes3d, leerAjustesGuardados, normalizarAjustes3d,
} from '@pages/maps/helpers/ajustes3d';

describe('ajustes 3D', () => {
    afterEach(() => localStorage.clear());

    it('por defecto: sombra, textos de frente, contorno y sin agrupar', () => {
        expect(AJUSTES_3D_DEFAULT).toMatchObject({ estiloPuntos: 'sombra', estiloTextos: 'frente', contorno: true, agruparPuntos: false, escalaSimbolos: 1 });
    });

    it('acota numeros, descarta opciones y tipos invalidos y conserva lo valido', () => {
        const ajustes = normalizarAjustes3d({ escalaSimbolos: 9, velocidadOrbita: '5', terreno: 'no', estiloTextos: 'planos', sol: 400, extra: 1 });
        expect(ajustes.escalaSimbolos).toBe(1.5);
        expect(ajustes.velocidadOrbita).toBe(5);
        expect(ajustes.terreno).toBe(true);
        expect(ajustes.estiloTextos).toBe('planos');
        expect(ajustes.sol).toBe(40);
        expect(ajustes).not.toHaveProperty('extra');
    });

    it('guarda solo lo distinto y lo recupera por llave', () => {
        guardarAjustes3d({ ...AJUSTES_3D_DEFAULT, agruparPuntos: true }, 'prueba');
        expect(JSON.parse(localStorage.getItem('prueba'))).toEqual({ agruparPuntos: true });
        expect(leerAjustesGuardados('prueba').agruparPuntos).toBe(true);
        expect(leerAjustesGuardados('otra')).toEqual(AJUSTES_3D_DEFAULT);
    });

    it('un almacenamiento corrupto vuelve a los valores de fabrica', () => {
        localStorage.setItem('rota', '{no es json');
        expect(leerAjustesGuardados('rota')).toEqual(AJUSTES_3D_DEFAULT);
        expect(ajustesDistintos(null)).toEqual({});
    });
});
