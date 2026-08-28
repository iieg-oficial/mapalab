import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getLayerCampos, calcularPersonalizada } from '@services/layerBuilderService';

const STORAGE = 'mapalab.numeralia.personalizadas';
export const MAX_FILTROS = 6;
export const MAX_PROPIAS = 4;

const OPS_POR_TIPO = {
    texto: [{ clave: 'eq', texto: 'es' }, { clave: 'in', texto: 'es alguno de' }],
    numero: [{ clave: 'eq', texto: 'es' }, { clave: 'gte', texto: 'es al menos' }, { clave: 'lte', texto: 'es a lo más' }],
    fecha: [{ clave: 'gte', texto: 'es desde' }, { clave: 'lte', texto: 'es hasta' }],
};

export const operadoresDe = (tipo) => OPS_POR_TIPO[tipo] || OPS_POR_TIPO.texto;

export const definicionVacia = () => ({ operation: 'count', field: null, label: '', filters: [] });

export const esCompleta = (definicion) => {
    if (!definicion.label?.trim()) return false;
    return definicion.filters.every(f => f.field && f.op && (f.op === 'is_not_null' || f.value !== null && f.value !== ''));
};

const leerGuardadas = () => {
    try {
        const crudo = JSON.parse(localStorage.getItem(STORAGE) || '{}');
        return crudo && typeof crudo === 'object' ? crudo : {};
    } catch {
        return {};
    }
};

const guardarTodas = (todas) => {
    try {
        localStorage.setItem(STORAGE, JSON.stringify(todas));
    } catch {
        /* ignore */
    }
};

export const usePersonalizadas = (layerId) => {
    const [todas, setTodas] = useState(leerGuardadas);

    const propias = useMemo(() => (layerId ? todas[layerId] || [] : []), [todas, layerId]);

    const agregar = useCallback((definicion) => {
        if (!layerId) return;
        setTodas(previas => {
            const actuales = previas[layerId] || [];
            const siguientes = { ...previas, [layerId]: [...actuales, definicion].slice(-MAX_PROPIAS) };
            guardarTodas(siguientes);
            return siguientes;
        });
    }, [layerId]);

    const quitar = useCallback((indice) => {
        if (!layerId) return;
        setTodas(previas => {
            const actuales = previas[layerId] || [];
            const siguientes = { ...previas, [layerId]: actuales.filter((_, i) => i !== indice) };
            guardarTodas(siguientes);
            return siguientes;
        });
    }, [layerId]);

    return { propias, agregar, quitar };
};

export const useCatalogoCampos = (layerId, activo) => {
    const [catalogo, setCatalogo] = useState(null);

    useEffect(() => {
        if (!layerId || !activo) return undefined;
        let cancelado = false;
        getLayerCampos(layerId)
            .then(data => { if (!cancelado) setCatalogo(data); })
            .catch(() => { if (!cancelado) setCatalogo(null); });
        return () => { cancelado = true; };
    }, [layerId, activo]);

    return catalogo;
};

export const useVistaPrevia = (layerId, definicion, context) => {
    const [previa, setPrevia] = useState(null);
    const [calculando, setCalculando] = useState(false);
    const pedidoRef = useRef(0);
    const firma = JSON.stringify({ definicion, claves: context?.claves || [] });

    useEffect(() => {
        if (!layerId || !definicion.operation) return undefined;

        const pedido = pedidoRef.current + 1;
        pedidoRef.current = pedido;
        setCalculando(true);

        const id = setTimeout(() => {
            calcularPersonalizada(layerId, { ...definicion, label: definicion.label || 'Mi estadística' }, context)
                .then(data => {
                    if (pedidoRef.current !== pedido) return;
                    setPrevia(data);
                    setCalculando(false);
                })
                .catch(() => {
                    if (pedidoRef.current !== pedido) return;
                    setPrevia(null);
                    setCalculando(false);
                });
        }, 350);

        return () => clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layerId, firma]);

    return { previa, calculando };
};

export const usePersonalizadasCalculadas = (layerId, definiciones, context) => {
    const [valores, setValores] = useState([]);
    const pedidoRef = useRef(0);
    const firma = JSON.stringify({ definiciones, claves: context?.claves || [] });

    useEffect(() => {
        if (!layerId || definiciones.length === 0) {
            setValores([]);
            return undefined;
        }

        const pedido = pedidoRef.current + 1;
        pedidoRef.current = pedido;
        let cancelado = false;

        Promise.all(definiciones.map(d => calcularPersonalizada(layerId, d, context).catch(() => null)))
            .then(resultado => {
                if (cancelado || pedidoRef.current !== pedido) return;
                setValores(resultado.filter(Boolean));
            });

        return () => { cancelado = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layerId, firma]);

    return valores;
};
