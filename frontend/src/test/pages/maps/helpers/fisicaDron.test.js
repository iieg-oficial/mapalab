import { describe, it, expect } from 'vitest';
import {
    AGL_MINIMO, SIN_ENTRADA, anguloCorto, aplicarMandos, crearDron, desplazar, distancia, entradaGuiada, pasoDron,
} from '@pages/maps/helpers/dron/fisicaDron';
import { AERONAVES, DRON_DEFAULT, mandosDe, normalizarDron, siguienteColor } from '@pages/maps/helpers/dron/aeronaves';
import { metaTercera } from '@pages/maps/helpers/dron/camaraDron';

const GDL = [-103.35, 20.67];
const plano = () => 1500;
const volar = (dron, entrada, segundos, extra = {}) => {
    let estado = dron;
    for (let i = 0; i < segundos * 20; i += 1) {
        estado = pasoDron(estado, entrada, { perfil: AERONAVES.cuadri, velocidad: 1, seguir: true, dt: 0.05, sueloEn: plano, ...extra });
    }
    return estado;
};

describe('física del dron', () => {
    it('avanza hacia su rumbo y respeta la velocidad de la aeronave', () => {
        const dron = { ...crearDron(GDL, 1500, 90), alt: 1800, agl: 300 };
        const final = volar(dron, { ...SIN_ENTRADA, avance: 1 }, 6);
        const { este, norte } = distancia(GDL, final.lngLat);
        expect(este).toBeGreaterThan(80);
        expect(Math.abs(norte)).toBeLessThan(5);
        expect(Math.hypot(final.vEste, final.vNorte) * 3.6).toBeCloseTo(AERONAVES.cuadri.vel[1], 0);
    });

    it('por default vuela a altitud fija aunque el terreno cambie abajo', () => {
        expect(DRON_DEFAULT.seguir).toBe(false);
        const loma = ([lng]) => 1500 + (lng + 103.35) * 20000;
        const dron = { ...crearDron(GDL, 1500, 90), alt: 1900, agl: 400 };
        const final = volar(dron, { ...SIN_ENTRADA, avance: 1 }, 6, { seguir: false, sueloEn: loma });
        expect(final.alt).toBeCloseTo(1900, 0);
        expect(final.agl).toBeLessThan(400);
    });

    it('a altitud fija choca si entra al terreno rápido y aterriza si baja despacio', () => {
        const pared = () => 2000;
        const rapido = pasoDron({ ...crearDron(GDL, 1500, 0), alt: 1990, vNorte: 20 }, SIN_ENTRADA, {
            perfil: AERONAVES.cuadri, velocidad: 1, seguir: false, dt: 0.05, sueloEn: pared,
        });
        expect(rapido.choque).toBe(true);
        const suave = pasoDron({ ...crearDron(GDL, 1500, 0), alt: 1501.2, vVert: -1 }, SIN_ENTRADA, {
            perfil: AERONAVES.cuadri, velocidad: 1, seguir: false, dt: 0.05, sueloEn: () => 1500.5,
        });
        expect(suave.choque).toBe(false);
        expect(suave.alt).toBeCloseTo(1501.5, 1);
    });

    it('sigue el relieve y nunca baja del mínimo sobre el terreno', () => {
        const dron = { ...crearDron(GDL, 1500, 0), alt: 1520, agl: 20 };
        const final = volar(dron, { ...SIN_ENTRADA, sube: -1 }, 10);
        expect(final.alt - final.piso).toBeGreaterThanOrEqual(AGL_MINIMO - 0.01);
        expect(final.agl).toBe(AGL_MINIMO);
    });

    it('el ala fija no se detiene: vuela arriba de su velocidad de pérdida', () => {
        const dron = { ...crearDron(GDL, 1500, 0), alt: 1800, agl: 300 };
        const final = volar(dron, SIN_ENTRADA, 12, { perfil: AERONAVES.ala });
        expect(Math.hypot(final.vEste, final.vNorte) * 3.6).toBeGreaterThan(AERONAVES.ala.perdida - 1);
    });

    it('el jet sube más allá del techo de los drones y no baja de su velocidad de pérdida', () => {
        const dron = { ...crearDron(GDL, 1500, 0), alt: 4500, agl: 3000 };
        const final = volar(dron, { ...SIN_ENTRADA, sube: 1 }, 20, { perfil: AERONAVES.jet });
        expect(final.agl).toBeGreaterThan(4000);
        expect(Math.hypot(final.vEste, final.vNorte) * 3.6).toBeGreaterThan(AERONAVES.jet.perdida - 5);
    });

    it('el globo se va con el viento aunque no se toque', () => {
        const dron = { ...crearDron(GDL, 1500, 0), alt: 1800, agl: 300 };
        const final = volar(dron, SIN_ENTRADA, 10, { perfil: AERONAVES.globo });
        expect(distancia(GDL, final.lngLat).metros).toBeGreaterThan(15);
        expect(final.alabeo).toBe(0);
    });

    it('con Q gira a la izquierda y el rumbo baja', () => {
        const dron = { ...crearDron(GDL, 1500, 90), alt: 1800, agl: 300 };
        expect(volar(dron, { ...SIN_ENTRADA, giro: 1 }, 1).rumbo).toBeLessThan(90);
    });
});

describe('mandos por aeronave', () => {
    const entrada = { ...SIN_ENTRADA, avance: -1, lateral: 1 };

    it('los drones y el helicóptero se desplazan de lado y van en reversa', () => {
        expect(aplicarMandos(entrada, mandosDe('cuadri'))).toMatchObject({ avance: -1, lateral: 1, giro: 0 });
        expect(aplicarMandos(entrada, mandosDe('heli')).lateral).toBe(1);
    });

    it('los aviones giran con A y D y la S solo frena', () => {
        const jet = aplicarMandos(entrada, mandosDe('jet'));
        expect(jet.lateral).toBe(0);
        expect(jet.giro).toBe(-1);
        expect(jet.avance).toBeGreaterThan(0);
        expect(aplicarMandos(SIN_ENTRADA, mandosDe('ala')).avance).toBeCloseTo(0.55);
    });

    it('el VTOL se desplaza pero no va en reversa y el globo solo sube, baja y gira', () => {
        const vtol = aplicarMandos(entrada, mandosDe('vtol'));
        expect(vtol.lateral).toBe(1);
        expect(vtol.avance).toBeCloseTo(0.1);
        const globo = aplicarMandos({ ...entrada, sube: 1, giro: 1 }, mandosDe('globo'));
        expect(globo).toMatchObject({ avance: 0, lateral: 0, sube: 1, giro: 1 });
    });
});

describe('vuelo guiado', () => {
    it('gira hacia el destino y avisa al llegar', () => {
        const dron = crearDron(GDL, 1500, 0);
        const destino = desplazar(GDL, 2000, 0);
        const { entrada, llego } = entradaGuiada(dron, { destino });
        expect(llego).toBe(false);
        expect(entrada.giro).toBeLessThan(0);
        expect(entradaGuiada(dron, { destino: desplazar(GDL, 50, 0) }).llego).toBe(true);
    });

    it('el piloto automático vuelve al centro cuando se aleja demasiado', () => {
        const dron = crearDron(desplazar(GDL, 0, 5000), 1500, 0);
        const { entrada } = entradaGuiada(dron, { auto: true, t: 0, centro: GDL, radio: 1000 });
        expect(entrada.avance).toBeGreaterThan(0);
        expect(Math.abs(entrada.giro)).toBe(1);
        expect(entradaGuiada(dron, { auto: false })).toBeNull();
    });

    it('normaliza ángulos al tramo más corto', () => {
        expect(anguloCorto(350)).toBe(-10);
        expect(anguloCorto(-190)).toBe(170);
    });
});

describe('aeronaves y cámara', () => {
    it('descarta valores guardados inválidos', () => {
        expect(normalizarDron({ modelo: 'ovni', color: '#000', velocidad: 7, estela: 'si' })).toEqual(DRON_DEFAULT);
        expect(normalizarDron({ modelo: 'globo', tercera: false }).modelo).toBe('globo');
        expect(siguienteColor('#2f7d3b')[0]).toBe('#1f6fa8');
        expect(siguienteColor('#1f6fa8')[0]).toBe('#6d2a8a');
    });

    it('la cámara en tercera persona va detrás y arriba del dron', () => {
        const dron = { ...crearDron(GDL, 1500, 0), alt: 1800 };
        const camara = metaTercera(dron, { sueloEn: plano });
        expect(distancia(GDL, camara.lngLat).norte).toBeLessThan(0);
        expect(camara.alt).toBeGreaterThan(dron.alt);
        expect(metaTercera({ ...dron, alt: 1505 }, { sueloEn: () => 1600 }).alt).toBeGreaterThanOrEqual(1606);
    });
});
