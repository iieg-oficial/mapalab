import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSider } from '@contexts/SiderContext';
import { useView3d } from '@contexts/View3dContext';
import { useMapsContext } from '@hooks/useMaps';
import { useZenMode } from '@pages/maps/components/ZenMode';
import { AERONAVES, DRON_DEFAULT, normalizarDron, siguienteColor } from '@pages/maps/helpers/dron/aeronaves';

const LLAVE_DRON = 'mapalab.dron';

const leerDron = () => {
    try {
        return normalizarDron(JSON.parse(localStorage.getItem(LLAVE_DRON) || '{}'));
    } catch {
        return { ...DRON_DEFAULT };
    }
};

const guardarDron = (config) => {
    try {
        localStorage.setItem(LLAVE_DRON, JSON.stringify(config));
    } catch {
        return;
    }
};

const DronContext = createContext(null);

const NADA = () => {};
const INACTIVO = {
    presente: false,
    activo: false,
    config: DRON_DEFAULT,
    perfil: AERONAVES[DRON_DEFAULT.modelo],
    auto: false,
    entrar: NADA,
    salir: NADA,
    setOpcion: NADA,
    alternar: NADA,
    cambiarColor: NADA,
    setAuto: NADA,
    controlesRef: { current: null },
    destinoRef: { current: null },
    accionesRef: { current: {} },
    telemetriaRef: { current: null },
    publicar: NADA,
    suscribir: () => NADA,
};

export const DronProvider = ({ children }) => {
    const { active, setOrbita } = useView3d();
    const { forzarCandado } = useSider();
    const { setIsZenMode } = useZenMode() || {};
    const { setSelectedFeatureInfo } = useMapsContext();
    const [activo, setActivo] = useState(false);
    const [config, setConfig] = useState(leerDron);
    const [auto, setAuto] = useState(false);
    const controlesRef = useRef({ teclas: new Set(), joy: { mx: 0, mz: 0, giro: 0, sube: 0 } });
    const destinoRef = useRef(null);
    const accionesRef = useRef({});
    const telemetriaRef = useRef(null);
    const oyentesRef = useRef(new Set());

    useEffect(() => { guardarDron(config); }, [config]);
    useEffect(() => { if (!active) setActivo(false); }, [active]);
    useEffect(() => {
        if (!activo) return undefined;
        forzarCandado?.('mobile');
        setIsZenMode?.(true);
        setSelectedFeatureInfo?.(null);
        return () => {
            forzarCandado?.(null);
            setIsZenMode?.(false);
        };
    }, [activo, forzarCandado, setIsZenMode, setSelectedFeatureInfo]);

    const entrar = useCallback(() => {
        setOrbita(false);
        setAuto(false);
        destinoRef.current = null;
        setActivo(true);
    }, [setOrbita]);

    const salir = useCallback(() => {
        destinoRef.current = null;
        setActivo(false);
    }, []);

    const setOpcion = useCallback((clave, valor) => setConfig(prev => ({ ...prev, [clave]: valor })), []);
    const alternar = useCallback(clave => setConfig(prev => ({ ...prev, [clave]: !prev[clave] })), []);
    const cambiarColor = useCallback(() => setConfig(prev => ({ ...prev, color: siguienteColor(prev.color)[0] })), []);

    const publicar = useCallback((telemetria) => {
        telemetriaRef.current = telemetria;
        oyentesRef.current.forEach(oyente => oyente(telemetria));
    }, []);

    const suscribir = useCallback((oyente) => {
        oyentesRef.current.add(oyente);
        return () => oyentesRef.current.delete(oyente);
    }, []);

    const value = useMemo(() => ({
        presente: true,
        activo,
        config,
        perfil: AERONAVES[config.modelo],
        auto,
        entrar,
        salir,
        setOpcion,
        alternar,
        cambiarColor,
        setAuto,
        controlesRef,
        destinoRef,
        accionesRef,
        telemetriaRef,
        publicar,
        suscribir,
    }), [activo, config, auto, entrar, salir, setOpcion, alternar, cambiarColor, publicar, suscribir]);

    return <DronContext.Provider value={value}>{children}</DronContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDron = () => useContext(DronContext) || INACTIVO;
