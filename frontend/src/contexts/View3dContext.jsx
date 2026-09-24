import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';
import { trackView3d } from '@services/analyticsService';
import { suscribirVista3d, tomarVista3d } from '@pages/maps/helpers/vista3dCompartida';
import { ESTILO_PUNTOS_3D_DEFAULT } from '@pages/maps/helpers/estilosDePuntos3d';
import { VIEW3D_DEFAULTS, clampColumnas, clampExaggeration, clampPitch, clampSol, webglAvailable } from '@pages/maps/helpers/view3d';

const View3dContext = createContext(null);

const INACTIVE = {
    present: false,
    available: false,
    active: false,
    pitch: VIEW3D_DEFAULTS.pitch,
    bearing: VIEW3D_DEFAULTS.bearing,
    exaggeration: VIEW3D_DEFAULTS.exaggeration,
    sol: VIEW3D_DEFAULTS.sol,
    alturaColumnas: VIEW3D_DEFAULTS.alturaColumnas,
    extruded: [],
    extrusionStatus: {},
    map3dRef: { current: null },
    grupo3dRef: { current: { miembros: new Set(), fuente: null } },
    enter: () => false,
    exit: () => {},
    toggle: () => {},
    setPitch: () => {},
    setBearing: () => {},
    setExaggeration: () => {},
    setSol: () => {},
    setAlturaColumnas: () => {},
    orbita: false,
    setOrbita: () => {},
    terreno: VIEW3D_DEFAULTS.terreno,
    cielo: VIEW3D_DEFAULTS.cielo,
    niebla: VIEW3D_DEFAULTS.niebla,
    setTerreno: () => {},
    setCielo: () => {},
    setNiebla: () => {},
    estiloPuntos: ESTILO_PUNTOS_3D_DEFAULT,
    setEstiloPuntos: () => {},
    restablecer: () => {},
    toggleExtrusion: () => {},
    isExtruded: () => false,
    reportExtrusion: () => {},
};

const readUrlState = (searchParams) => ({
    active: searchParams.get('vista') === '3d',
    pitch: searchParams.has('inclinacion') ? clampPitch(searchParams.get('inclinacion')) : VIEW3D_DEFAULTS.pitch,
    extruded: (searchParams.get('extruir') || '').split(',').map(id => id.trim()).filter(Boolean),
});

const writeUrlState = (searchParams, { active, pitch, extruded }) => {
    const next = new URLSearchParams(searchParams);
    if (active) {
        next.set('vista', '3d');
        next.set('inclinacion', String(Math.round(pitch)));
        if (extruded.length) next.set('extruir', extruded.join(','));
        else next.delete('extruir');
    } else {
        ['vista', 'inclinacion', 'extruir'].forEach(key => next.delete(key));
    }
    return next;
};

export const View3dProvider = ({ children }) => {
    const {
        hideMeasurementTools, hideAnnotationTools,
        showMeasurementTools, areMeasurementToolsVisible,
        setSelectedFeatureInfo, activeLayerIds,
    } = useMapsContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const [initial] = useState(() => readUrlState(searchParams));
    const [available] = useState(webglAvailable);
    const [active, setActive] = useState(initial.active && available);
    const [pitch, setPitchState] = useState(initial.pitch);
    const [bearing, setBearing] = useState(VIEW3D_DEFAULTS.bearing);
    const [exaggeration, setExaggerationState] = useState(VIEW3D_DEFAULTS.exaggeration);
    const [extruded, setExtruded] = useState(initial.extruded);
    const [sol, setSolState] = useState(VIEW3D_DEFAULTS.sol);
    const [alturaColumnas, setAlturaState] = useState(VIEW3D_DEFAULTS.alturaColumnas);
    const [orbita, setOrbita] = useState(false);
    const [terreno, setTerreno] = useState(VIEW3D_DEFAULTS.terreno);
    const [cielo, setCielo] = useState(VIEW3D_DEFAULTS.cielo);
    const [niebla, setNiebla] = useState(VIEW3D_DEFAULTS.niebla);
    const [estiloPuntos, setEstiloPuntos] = useState(ESTILO_PUNTOS_3D_DEFAULT);
    const [extrusionStatus, setExtrusionStatus] = useState({});
    const map3dRef = useRef(null);
    const grupo3dRef = useRef({ miembros: new Set(), fuente: null });
    const enteredAtRef = useRef(null);
    const medicionesVisiblesRef = useRef(false);

    const enter = useCallback(() => {
        if (!available) return false;
        medicionesVisiblesRef.current = !!areMeasurementToolsVisible;
        hideMeasurementTools?.();
        hideAnnotationTools?.();
        setSelectedFeatureInfo?.(null);
        enteredAtRef.current = Date.now();
        setActive(true);
        trackView3d('enter');
        return true;
    }, [available, areMeasurementToolsVisible, hideMeasurementTools, hideAnnotationTools, setSelectedFeatureInfo]);

    const exit = useCallback(() => {
        if (medicionesVisiblesRef.current) showMeasurementTools?.();
        setActive(prev => {
            if (prev) {
                const seconds = enteredAtRef.current ? Math.round((Date.now() - enteredAtRef.current) / 1000) : null;
                trackView3d('exit', { duration_sec: seconds });
            }
            return false;
        });
    }, [showMeasurementTools]);

    const toggle = useCallback(() => (active ? exit() : enter()), [active, enter, exit]);
    const setPitch = useCallback((value) => setPitchState(clampPitch(value)), []);
    const setExaggeration = useCallback((value) => setExaggerationState(clampExaggeration(value)), []);
    const setSol = useCallback((value) => setSolState(clampSol(value)), []);
    const setAlturaColumnas = useCallback((value) => setAlturaState(clampColumnas(value)), []);

    const restablecer = useCallback(() => {
        setPitchState(VIEW3D_DEFAULTS.pitch);
        setBearing(VIEW3D_DEFAULTS.bearing);
        setExaggerationState(VIEW3D_DEFAULTS.exaggeration);
        setSolState(VIEW3D_DEFAULTS.sol);
        setAlturaState(VIEW3D_DEFAULTS.alturaColumnas);
        setTerreno(VIEW3D_DEFAULTS.terreno);
        setCielo(VIEW3D_DEFAULTS.cielo);
        setNiebla(VIEW3D_DEFAULTS.niebla);
        setEstiloPuntos(ESTILO_PUNTOS_3D_DEFAULT);
        setOrbita(false);
    }, []);

    const toggleExtrusion = useCallback((layerId) => {
        setExtruded(prev => {
            const on = !prev.includes(layerId);
            trackView3d(on ? 'extrude' : 'flatten', { layer_id: layerId });
            return on ? [...prev, layerId] : prev.filter(id => id !== layerId);
        });
    }, []);

    const isExtruded = useCallback((layerId) => extruded.includes(layerId), [extruded]);

    const reportExtrusion = useCallback((layerId, status) => {
        setExtrusionStatus(prev => (prev[layerId] === status ? prev : { ...prev, [layerId]: status }));
    }, []);

    useEffect(() => {
        const aplicar = () => {
            const vista = tomarVista3d();
            if (!vista || !enter()) return;
            setPitchState(vista.pitch);
            setBearing(vista.bearing);
            setExaggerationState(vista.exaggeration);
            setExtruded(vista.extruded);
        };
        aplicar();
        return suscribirVista3d(aplicar);
    }, [enter]);

    const previousActiveRef = useRef(new Set());
    useEffect(() => {
        const vigentes = new Set(activeLayerIds || []);
        const salieron = [...previousActiveRef.current].filter(id => !vigentes.has(id));
        previousActiveRef.current = vigentes;
        if (salieron.length) setExtruded(prev => prev.filter(id => !salieron.includes(id)));
    }, [activeLayerIds]);

    const roundedPitch = Math.round(pitch);
    const extrudedKey = extruded.join(',');
    useEffect(() => {
        const next = writeUrlState(searchParams, { active, pitch: roundedPitch, extruded: extrudedKey ? extrudedKey.split(',') : [] });
        if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
    }, [active, roundedPitch, extrudedKey, searchParams, setSearchParams]);

    const value = useMemo(() => ({
        present: true, available, active, pitch, bearing, exaggeration, extruded, extrusionStatus, map3dRef, grupo3dRef,
        sol, alturaColumnas, orbita, terreno, cielo, niebla, estiloPuntos,
        enter, exit, toggle, setPitch, setBearing, setExaggeration, toggleExtrusion, isExtruded, reportExtrusion,
        setSol, setAlturaColumnas, setOrbita, setTerreno, setCielo, setNiebla, setEstiloPuntos, restablecer,
    }), [
        available, active, pitch, bearing, exaggeration, extruded, extrusionStatus,
        sol, alturaColumnas, orbita, terreno, cielo, niebla, estiloPuntos,
        enter, exit, toggle, setPitch, setExaggeration, toggleExtrusion, isExtruded, reportExtrusion,
        setSol, setAlturaColumnas, restablecer,
    ]);

    return <View3dContext.Provider value={value}>{children}</View3dContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useView3d = () => useContext(View3dContext) || INACTIVE;
