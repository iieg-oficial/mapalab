import { useCallback, useEffect, useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import {
    LLAVE_TABLA,
    construirCql,
    descriptorVacio,
    etiquetaFiltro,
} from '@pages/maps/helpers/tablaCqlBuilder';

export const useTablaFiltros = (layerId) => {
    const { applyFilter, clearFilter } = useMapsContext();
    const {
        estadoDe, ponerFiltro, quitarFiltro, limpiarFiltros, fijarExpresionPropia,
    } = useTablaAtributos();
    const { filtros, expresionPropia } = estadoDe(layerId);

    const cqlDeFiltros = useMemo(() => construirCql(filtros), [filtros]);
    const cql = expresionPropia || cqlDeFiltros;

    useEffect(() => {
        if (!layerId) return;
        if (cql) applyFilter(layerId, LLAVE_TABLA, cql);
        else clearFilter(layerId, LLAVE_TABLA);
    }, [applyFilter, clearFilter, cql, layerId]);

    useEffect(() => () => clearFilter(layerId, LLAVE_TABLA), [clearFilter, layerId]);

    const chips = useMemo(() => {
        if (expresionPropia) {
            return [{ columna: null, etiqueta: 'expresión propia', propia: true }];
        }
        return Object.entries(filtros)
            .filter(([, descriptor]) => !descriptorVacio(descriptor))
            .map(([columna, descriptor]) => ({
                columna,
                etiqueta: etiquetaFiltro(columna, descriptor),
                propia: false,
            }));
    }, [expresionPropia, filtros]);

    const poner = useCallback((columna, descriptor) => {
        if (!descriptor || descriptorVacio(descriptor)) quitarFiltro(layerId, columna);
        else ponerFiltro(layerId, columna, descriptor);
    }, [layerId, ponerFiltro, quitarFiltro]);

    const quitar = useCallback((columna) => {
        if (columna === null) fijarExpresionPropia(layerId, null);
        else quitarFiltro(layerId, columna);
    }, [fijarExpresionPropia, layerId, quitarFiltro]);

    const limpiar = useCallback(() => limpiarFiltros(layerId), [layerId, limpiarFiltros]);

    const fijarExpresion = useCallback((expresion) => {
        fijarExpresionPropia(layerId, expresion);
    }, [fijarExpresionPropia, layerId]);

    return {
        filtros,
        expresionPropia,
        cql,
        cqlDeFiltros,
        chips,
        poner,
        quitar,
        limpiar,
        fijarExpresion,
    };
};
