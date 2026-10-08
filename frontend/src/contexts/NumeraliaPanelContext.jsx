import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { definicionVacia, MAX_PROPIAS } from '@hooksMaps/useStatsBuilder';
import { trackStatsCustomCreate, trackStatsDetach, trackStatsOpen } from '@services/analyticsService';

const NumeraliaPanelContext = createContext(null);

const STORAGE_ESTADO = 'mapalab.numeralia.estado';
const STORAGE_PROPIAS = 'mapalab.numeralia.personalizadas';
const MAX_COMPARADOS = 6;

const INICIAL = {
    abierto: false,
    minimizado: false,
    modo: 'resumen',
    clavesComparadas: [],
    rankingPorcentaje: false,
    rankingPorCapa: {},
    borradorPorCapa: {},
    vistaGrafica: false,
    graficaEje: 'municipio',
    graficaMunicipio: [],
    graficaIndicadorPorCapa: {},
};

const leer = () => {
    try {
        const crudo = JSON.parse(localStorage.getItem(STORAGE_ESTADO) || 'null');
        if (!crudo || typeof crudo !== 'object') return INICIAL;
        return { ...INICIAL, ...crudo };
    } catch {
        return INICIAL;
    }
};

const guardar = (estado) => {
    try {
        localStorage.setItem(STORAGE_ESTADO, JSON.stringify(estado));
    } catch {
        /* ignore */
    }
};

const limpiar = () => {
    try {
        localStorage.removeItem(STORAGE_ESTADO);
    } catch {
        /* ignore */
    }
};

const leerPropias = () => {
    try {
        const crudo = JSON.parse(localStorage.getItem(STORAGE_PROPIAS) || '{}');
        return crudo && typeof crudo === 'object' ? crudo : {};
    } catch {
        return {};
    }
};

const guardarPropias = (todas) => {
    try {
        localStorage.setItem(STORAGE_PROPIAS, JSON.stringify(todas));
    } catch {
        /* ignore */
    }
};

export const NumeraliaPanelProvider = ({ children }) => {
    const [estado, setEstado] = useState(leer);
    const [propiasPorCapa, setPropiasPorCapa] = useState(leerPropias);
    const [detachedLayerId, setDetachedLayerId] = useState(null);
    const [highlight, setHighlight] = useState(0);

    const aplicar = useCallback((parche) => {
        setEstado(previo => {
            const siguiente = typeof parche === 'function' ? parche(previo) : { ...previo, ...parche };
            guardar(siguiente);
            return siguiente;
        });
    }, []);

    const detach = useCallback((layerId) => {
        trackStatsDetach(layerId || null);
        aplicar({ abierto: true });
        if (layerId) setDetachedLayerId(layerId);
    }, [aplicar]);

    const attach = useCallback(() => {
        limpiar();
        setEstado(INICIAL);
        setDetachedLayerId(null);
    }, []);

    const seguir = useCallback((layerId) => {
        if (layerId) setDetachedLayerId(layerId);
    }, []);

    const alternarMinimizado = useCallback(() => {
        aplicar(previo => ({ ...previo, minimizado: !previo.minimizado }));
    }, [aplicar]);

    const abrirModo = useCallback((siguiente) => {
        if (estado.modo !== siguiente) trackStatsOpen(siguiente);
        aplicar(previo => ({ ...previo, modo: previo.modo === siguiente ? 'resumen' : siguiente }));
    }, [aplicar, estado.modo]);

    const cerrarModo = useCallback(() => aplicar({ modo: 'resumen' }), [aplicar]);

    const compararCon = useCallback((claves) => {
        aplicar(previo => ({
            ...previo,
            clavesComparadas: [...new Set([...previo.clavesComparadas, ...claves.map(String)])].slice(0, MAX_COMPARADOS),
        }));
    }, [aplicar]);

    const quitarComparado = useCallback((clave) => {
        aplicar(previo => ({
            ...previo,
            clavesComparadas: previo.clavesComparadas.filter(c => c !== String(clave)),
        }));
    }, [aplicar]);

    const reordenarComparados = useCallback((claves) => {
        aplicar({ clavesComparadas: claves.map(String) });
    }, [aplicar]);

    const fijarRankingPorcentaje = useCallback((valor) => {
        aplicar({ rankingPorcentaje: Boolean(valor) });
    }, [aplicar]);

    const fijarRankingIndice = useCallback((layerId, indice) => {
        if (!layerId) return;
        aplicar(previo => ({ ...previo, rankingPorCapa: { ...previo.rankingPorCapa, [layerId]: indice } }));
    }, [aplicar]);

    const fijarVistaGrafica = useCallback((valor) => aplicar({ vistaGrafica: Boolean(valor) }), [aplicar]);

    const fijarGraficaEje = useCallback((eje) => aplicar({ graficaEje: eje }), [aplicar]);

    const fijarGraficaMunicipio = useCallback((claves) => {
        aplicar({ graficaMunicipio: (Array.isArray(claves) ? claves : [claves]).filter(Boolean).map(String) });
    }, [aplicar]);

    const fijarGraficaIndicador = useCallback((layerId, nombre) => {
        if (!layerId) return;
        aplicar(previo => ({
            ...previo,
            graficaIndicadorPorCapa: { ...previo.graficaIndicadorPorCapa, [layerId]: nombre },
        }));
    }, [aplicar]);

    const fijarBorrador = useCallback((layerId, definicion) => {
        if (!layerId) return;
        aplicar(previo => ({ ...previo, borradorPorCapa: { ...previo.borradorPorCapa, [layerId]: definicion } }));
    }, [aplicar]);

    const agregarPersonalizada = useCallback((layerId, definicion) => {
        if (!layerId) return;
        trackStatsCustomCreate(layerId, definicion?.operation, definicion?.filters?.length || 0);
        setPropiasPorCapa(previas => {
            const actuales = previas[layerId] || [];
            const siguientes = { ...previas, [layerId]: [...actuales, definicion].slice(-MAX_PROPIAS) };
            guardarPropias(siguientes);
            return siguientes;
        });
    }, []);

    const quitarPersonalizada = useCallback((layerId, indice) => {
        if (!layerId) return;
        setPropiasPorCapa(previas => {
            const actuales = previas[layerId] || [];
            const siguientes = { ...previas, [layerId]: actuales.filter((_, i) => i !== indice) };
            guardarPropias(siguientes);
            return siguientes;
        });
    }, []);

    const resaltar = useCallback(() => setHighlight(n => n + 1), []);

    const value = useMemo(() => ({
        ...estado,
        detachedLayerId,
        highlight,
        detach,
        attach,
        seguir,
        alternarMinimizado,
        resaltar,
        abrirModo,
        cerrarModo,
        compararCon,
        quitarComparado,
        reordenarComparados,
        fijarRankingPorcentaje,
        fijarRankingIndice,
        fijarBorrador,
        fijarVistaGrafica,
        fijarGraficaEje,
        fijarGraficaMunicipio,
        fijarGraficaIndicador,
        agregarPersonalizada,
        quitarPersonalizada,
        rankingIndiceDe: (layerId) => estado.rankingPorCapa[layerId] ?? 0,
        borradorDe: (layerId) => estado.borradorPorCapa[layerId] || definicionVacia(),
        personalizadasDe: (layerId) => propiasPorCapa[layerId] || [],
        graficaIndicadorDe: (layerId) => estado.graficaIndicadorPorCapa[layerId] || null,
    }), [
        estado, propiasPorCapa, detachedLayerId, highlight,
        detach, attach, seguir, alternarMinimizado, resaltar,
        abrirModo, cerrarModo,
        compararCon, quitarComparado, reordenarComparados,
        fijarRankingPorcentaje, fijarRankingIndice, fijarBorrador,
        fijarVistaGrafica, fijarGraficaEje, fijarGraficaMunicipio, fijarGraficaIndicador,
        agregarPersonalizada, quitarPersonalizada,
    ]);

    return (
        <NumeraliaPanelContext.Provider value={value}>
            {children}
        </NumeraliaPanelContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNumeraliaPanel = () => useContext(NumeraliaPanelContext) || {};
