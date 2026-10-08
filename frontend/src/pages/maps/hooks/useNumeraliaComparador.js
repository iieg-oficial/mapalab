import { useEffect, useMemo, useRef, useState } from 'react';
import { getLayerMetadata } from '@services/layerMetadataService';

const OPS_PROPORCIONALES = new Set(['count', 'count_where', 'count_distinct', 'sum']);

export const esProporcional = (slot) => OPS_PROPORCIONALES.has(slot?.receta?.op);

export const aNumero = (valor) => {
    if (valor === null || valor === undefined || valor === '') return null;
    const numero = Number(String(valor).replace(/[\s,]/g, ''));
    return Number.isFinite(numero) ? numero : null;
};

const porNombre = (numeralia) => new Map((numeralia || []).map(slot => [slot.nombre, slot]));

const celdaDe = (slot, universo, proporcional) => {
    const bruto = aNumero(slot?.valor);
    const porcentaje = proporcional && universo && bruto !== null ? (bruto / universo) * 100 : null;
    return {
        bruto,
        porcentaje,
        texto: porcentaje === null ? (slot?.valor ?? null) : `${porcentaje.toFixed(1)}%`,
        orden: porcentaje === null ? bruto : porcentaje,
    };
};

export const construirFilas = (columnas) => {
    const plantilla = columnas[0]?.numeralia || [];
    if (plantilla.length === 0) return [];

    const mapas = columnas.map(col => porNombre(col.numeralia));
    const nombreBase = plantilla[0].nombre;
    const universos = mapas.map(mapa => aNumero(mapa.get(nombreBase)?.valor));

    return plantilla.map((slot, indice) => {
        const esBase = indice === 0;
        const proporcional = !esBase && esProporcional(slot);
        const celdas = mapas.map((mapa, columna) => celdaDe(mapa.get(slot.nombre), universos[columna], proporcional));

        const ordenables = celdas
            .map((celda, columna) => ({ columna, orden: celda.orden }))
            .filter(item => Number.isFinite(item.orden));

        const fila = { nombre: slot.nombre, simbolo: slot.simbolo, esBase, celdas, enPuntos: proporcional };
        if (ordenables.length < 2) return { ...fila, alto: null, bajo: null };

        const porValor = [...ordenables].sort((a, b) => b.orden - a.orden);
        const mayor = porValor[0];
        const menor = porValor[porValor.length - 1];
        if (mayor.orden === menor.orden) return { ...fila, alto: null, bajo: null };

        return {
            ...fila,
            alto: { columna: mayor.columna, ventaja: mayor.orden - porValor[1].orden },
            bajo: { columna: menor.columna, ventaja: porValor[porValor.length - 2].orden - menor.orden },
        };
    });
};

export const useNumeraliaComparador = (layerId, claves) => {
    const firma = claves.join(',');
    const [columnas, setColumnas] = useState([]);
    const [cargando, setCargando] = useState(false);
    const pedidoRef = useRef(0);

    useEffect(() => {
        if (!layerId || !firma) {
            setColumnas([]);
            setCargando(false);
            return undefined;
        }

        const pedido = pedidoRef.current + 1;
        pedidoRef.current = pedido;
        let cancelado = false;
        setCargando(true);

        Promise.all(
            firma.split(',').map(clave => getLayerMetadata(layerId, { claves: [clave] })
                .then(data => ({ clave, numeralia: (data?.numeralia || []).filter(s => s.nombre && s.valor !== null) }))
                .catch(() => ({ clave, numeralia: [] }))),
        ).then(resultado => {
            if (cancelado || pedidoRef.current !== pedido) return;
            setColumnas(resultado);
            setCargando(false);
        });

        return () => { cancelado = true; };
    }, [layerId, firma]);

    return useMemo(() => ({ columnas, cargando }), [columnas, cargando]);
};
