import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TablaAtributosContext = createContext(null);

const MAX_TABLAS = 4;

const ESTADO_CAPA = {
    filtros: {},
    expresionPropia: null,
    orden: null,
    vista: 'libre',
    bboxCongelado: null,
    conteo: null,
};

export const TablaAtributosProvider = ({ children }) => {
    const [tablas, setTablas] = useState([]);
    const [activaId, setActivaId] = useState(null);
    const [minimizado, setMinimizado] = useState(false);
    const [porCapa, setPorCapa] = useState({});

    const parchear = useCallback((layerId, parche) => {
        setPorCapa(previo => {
            const actual = previo[layerId] || ESTADO_CAPA;
            const siguiente = typeof parche === 'function' ? parche(actual) : parche;
            return { ...previo, [layerId]: { ...actual, ...siguiente } };
        });
    }, []);

    const abrir = useCallback((layerId) => {
        if (!layerId) return;
        setTablas(previas => {
            if (previas.includes(layerId)) return previas;
            return [...previas, layerId].slice(-MAX_TABLAS);
        });
        setPorCapa(previo => (previo[layerId] ? previo : { ...previo, [layerId]: ESTADO_CAPA }));
        setActivaId(layerId);
        setMinimizado(false);
    }, []);

    const cerrar = useCallback((layerId) => {
        setTablas(previas => {
            const siguientes = previas.filter(id => id !== layerId);
            setActivaId(actual => (actual === layerId ? siguientes[siguientes.length - 1] || null : actual));
            return siguientes;
        });
        setPorCapa(previo => {
            const siguiente = { ...previo };
            delete siguiente[layerId];
            return siguiente;
        });
    }, []);

    const cerrarTodas = useCallback(() => {
        setTablas([]);
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
        tablas,
        activaId,
        minimizado,
        abierta: tablas.length > 0,
        estaAbierta: (layerId) => tablas.includes(layerId),
        abrir,
        cerrar,
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
        tablas, activaId, minimizado, abrir, cerrar, cerrarTodas, activar, alternarMinimizado,
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
