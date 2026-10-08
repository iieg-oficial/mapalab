import { useMemo } from 'react';
import { gruposDe } from '@pages/maps/helpers/comparadorSeries';

const listaDe = (crudo) => (Array.isArray(crudo) ? crudo : [crudo]).filter(Boolean);

export const useComparadorGrafica = ({
    filas, clavesComparadas, layerId, graficaMunicipio, graficaIndicadorDe,
}) => {
    const grupos = useMemo(() => gruposDe(filas), [filas]);

    const municipios = useMemo(() => {
        const guardados = listaDe(graficaMunicipio).filter(c => clavesComparadas.includes(c));
        return guardados.length ? guardados : clavesComparadas.slice(0, 1);
    }, [graficaMunicipio, clavesComparadas]);

    const indicadores = useMemo(() => {
        const guardados = listaDe(graficaIndicadorDe(layerId))
            .filter(n => grupos.some(g => g.nombre === n));
        return guardados.length ? guardados : grupos.slice(0, 1).map(g => g.nombre);
    }, [layerId, grupos, graficaIndicadorDe]);

    return { grupos, municipios, indicadores };
};
