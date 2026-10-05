import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSider } from '@contexts/SiderContext';
import { useView3d } from '@contexts/View3dContext';
import { useMapsContext } from '@hooks/useMaps';
import { trackView3d } from '@services/analyticsService';
import { useZenMode } from '@pages/maps/components/ZenMode';

const CaminarContext = createContext(null);
const NADA = () => {};
const INACTIVO = {
    presente: false,
    activo: false,
    tercera: false,
    entrar: NADA,
    salir: NADA,
    alternarVista: NADA,
    teclasRef: { current: new Set() },
    publicar: NADA,
    suscribir: () => NADA,
};

export const CaminarProvider = ({ children }) => {
    const { active, setOrbita, setInundacion } = useView3d();
    const { forzarCandado } = useSider();
    const { isZenMode, setIsZenMode } = useZenMode() || {};
    const { setSelectedFeatureInfo, compareMode } = useMapsContext();
    const zenRef = useRef(false);
    zenRef.current = !!isZenMode;
    const [activo, setActivo] = useState(false);
    const [tercera, setTercera] = useState(true);
    const teclasRef = useRef(new Set());
    const oyentesRef = useRef(new Set());

    useEffect(() => { if (!active || compareMode?.active) setActivo(false); }, [active, compareMode?.active]);
    useEffect(() => {
        if (!activo) return undefined;
        const zenPrevio = zenRef.current;
        const teclas = teclasRef.current;
        const inicio = Date.now();
        forzarCandado?.('mobile');
        setIsZenMode?.(true);
        setSelectedFeatureInfo?.(null);
        trackView3d('caminar_start', {});
        return () => {
            forzarCandado?.(null);
            setIsZenMode?.(zenPrevio);
            teclas.clear();
            trackView3d('caminar_end', { duration_sec: Math.round((Date.now() - inicio) / 1000) });
        };
    }, [activo, forzarCandado, setIsZenMode, setSelectedFeatureInfo]);

    const entrar = useCallback(() => {
        setOrbita(false);
        setInundacion({ eligiendo: false });
        setActivo(true);
    }, [setOrbita, setInundacion]);

    const salir = useCallback(() => setActivo(false), []);
    const alternarVista = useCallback(() => setTercera(v => !v), []);

    const publicar = useCallback((estado) => {
        oyentesRef.current.forEach(oyente => oyente(estado));
    }, []);

    const suscribir = useCallback((oyente) => {
        oyentesRef.current.add(oyente);
        return () => oyentesRef.current.delete(oyente);
    }, []);

    const value = useMemo(() => ({
        presente: true,
        activo,
        tercera,
        entrar,
        salir,
        alternarVista,
        teclasRef,
        publicar,
        suscribir,
    }), [activo, tercera, entrar, salir, alternarVista, publicar, suscribir]);

    return <CaminarContext.Provider value={value}>{children}</CaminarContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCaminar = () => useContext(CaminarContext) || INACTIVO;
