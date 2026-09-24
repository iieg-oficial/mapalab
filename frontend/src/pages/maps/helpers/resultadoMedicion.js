import { alturas } from '@pages/maps/helpers/elevacionDem';
import {
    areaPlana, areaSobreRelieve, densificar, distribucionAlturas, largoPlano, perfilDesde, perimetro, rejillaSobre,
} from '@pages/maps/helpers/medicion3d';

export const calcularMedicion = async (modo, vertices) => {
    if (modo === 'punto') {
        if (!vertices.length) return null;
        const [alt] = await alturas([vertices[0]]);
        return { modo, alt };
    }
    if (modo === 'linea') {
        if (vertices.length < 2) return null;
        const muestras = densificar(vertices);
        const perfil = perfilDesde(muestras, await alturas(muestras.map(m => m.lngLat)));
        return { modo, plano: largoPlano(vertices), ...perfil };
    }
    if (modo !== 'poligono' || vertices.length < 3) return null;
    const rejilla = rejillaSobre(vertices);
    const alts = await alturas(rejilla.nodos);
    const superficie = areaSobreRelieve(vertices, rejilla, alts);
    const distribucion = distribucionAlturas(vertices, rejilla, alts);
    return {
        modo, plano: areaPlana(vertices), superficie, perimetro: perimetro(vertices), distribucion,
        max: distribucion?.max, min: distribucion?.min,
    };
};
