import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useActiveLayersLogic } from '@hooksMaps/useActiveLayersLogic';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { resolverObjetivo } from '@pages/maps/helpers/tablaCapa';

const TablaAtributosContext = createContext(null);

const ESTADO_CAPA = {
    filtros: {},
    expresionPropia: null,
    orden: null,
    vista: 'libre',
    bboxCongelado: null,
    conteo: null,
};

export const TablaAtributosProvider = ({ children }) => {
    const { allLayers, activeLayerIds, hiddenLayerIds } = useMapsContext();
    const { unifiedLayers } = useActiveLayersLogic(activeLayerIds || [], hiddenLayerIds || []);
    const [activo, setActivo] = useState(false);
    const [activaId, setActivaId] = useState(null);
    const [minimizado, setMinimizado] = useState(false);
    const [porCapa, setPorCapa] = useState({});

    const tablas = useMemo(() => {
        if (!activo) return [];
        return unifiedLayers
            .filter(capa => Boolean(resolverObjetivo(findLayerDef(capa.id, allLayers || [])).wmsConfig))
            .map(capa => ({
                id: capa.id,
                nombre: capa.name,
                visible: capa.visible !== false,
                childIds: capa.childIds || [capa.id],
            }));
    }, [allLayers, activo, unifiedLayers]);

    useEffect(() => {
        if (!activo) return;
        if (tablas.length === 0) {
            setActivo(false);
            setActivaId(null);
            return;
        }
        if (!activaId || !tablas.some(capa => capa.id === activaId)) setActivaId(tablas[0].id);
    }, [activaId, activo, tablas]);

    const parchear = useCallback((layerId, parche) => {
        setPorCapa(previo => {
            const actual = previo[layerId] || ESTADO_CAPA;
            const siguiente = typeof parche === 'function' ? parche(actual) : parche;
            return { ...previo, [layerId]: { ...actual, ...siguiente } };
        });
    }, []);

    const abrir = useCallback((layerId) => {
        setActivo(true);
        setMinimizado(false);
        if (!layerId) return;
        setActivaId(layerId);
    }, []);

    const cerrarTodas = useCallback(() => {
        setActivo(false);
        setActivaId(null);
        setPorCapa({});
        setMinimizado(false);
    }, []);

    const activar = useCallback((layerId) => {
        setActivaId(layerId);
        setMinimizado(false);
    }, []);

    const alternarMinimizado = useCallback(() => setMinimizado(valor => !valor), []);

    const estadoDe = useCallback((layerId) => porCapa[layerId] || ESTADO_CAPA, [porCapa]);

    const ponerFiltro = useCallback((layerId, columna, descriptor) => {
        parchear(layerId, actual => ({
            filtros: { ...actual.filtros, [columna]: descriptor },
            expresionPropia: null,
        }));
    }, [parchear]);

    const quitarFiltro = useCallback((layerId, columna) => {
        parchear(layerId, actual => {
            const filtros = { ...actual.filtros };
            delete filtros[columna];
            return { filtros };
        });
    }, [parchear]);

    const limpiarFiltros = useCallback((layerId) => {
        parchear(layerId, { filtros: {}, expresionPropia: null });
    }, [parchear]);

    const fijarExpresionPropia = useCallback((layerId, expresion) => {
        parchear(layerId, { expresionPropia: expresion || null });
    }, [parchear]);

    const fijarOrden = useCallback((layerId, columna) => {
        parchear(layerId, actual => {
            if (actual.orden?.columna !== columna) return { orden: { columna, descendente: false } };
            if (!actual.orden.descendente) return { orden: { columna, descendente: true } };
            return { orden: null };
        });
    }, [parchear]);

    const fijarVista = useCallback((layerId, vista, bbox = null) => {
        parchear(layerId, { vista, bboxCongelado: vista === 'congelada' ? bbox : null });
    }, [parchear]);

    const fijarConteo = useCallback((layerId, conteo) => {
        parchear(layerId, { conteo });
    }, [parchear]);

    const value = useMemo(() => ({
        activo,
        tablas,
        activaId,
        minimizado,
        estaAbierta: (layerId) => tablas.some(capa => capa.id === layerId),
        nombreDe: (layerId) => tablas.find(capa => capa.id === layerId)?.nombre || 'Capa',
        capaDe: (layerId) => tablas.find(capa => capa.id === layerId) || null,
        abrir,
        cerrarTodas,
        activar,
        alternarMinimizado,
        estadoDe,
        ponerFiltro,
        quitarFiltro,
        limpiarFiltros,
        fijarExpresionPropia,
        fijarOrden,
        fijarVista,
        fijarConteo,
    }), [
        activo, tablas, activaId, minimizado, abrir, cerrarTodas, activar, alternarMinimizado,
        estadoDe, ponerFiltro, quitarFiltro, limpiarFiltros, fijarExpresionPropia, fijarOrden,
        fijarVista, fijarConteo,
    ]);

    return (
        <TablaAtributosContext.Provider value={value}>
            {children}
        </TablaAtributosContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTablaAtributos = () => {
    const contexto = useContext(TablaAtributosContext);
    if (!contexto) throw new Error('useTablaAtributos requiere TablaAtributosProvider');
    return contexto;
};
