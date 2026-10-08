import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';
import { useIsNonProd } from '@hooks/useDevTools';
import { trackView3d } from '@services/analyticsService';
import { suscribirVista3d, tomarVista3d } from '@pages/maps/helpers/vista3dCompartida';
import { AJUSTES_3D_DEFAULT, LLAVE_AJUSTES_3D } from '@pages/maps/helpers/ajustes3d';
import { useAjustes3d } from '@pages/maps/hooks/useAjustes3d';
import { CAPAS_OCULTAS_EN_3D, VIEW3D_DEFAULTS, clampExaggeration, clampPitch, webglAvailable } from '@pages/maps/helpers/view3d';

const View3dContext = createContext(null);
const SIN_INUNDACION = { nivel: 0, lloviendo: false, referencia: null, centro: null, modo: 'general', punto: null, radio: 1500, eligiendo: false };

const INACTIVE = {
    present: false,
    available: false,
    active: false,
    pitch: VIEW3D_DEFAULTS.pitch,
    bearing: VIEW3D_DEFAULTS.bearing,
    exaggeration: VIEW3D_DEFAULTS.exaggeration,
    ...AJUSTES_3D_DEFAULT,
    ajustes: AJUSTES_3D_DEFAULT,
    setAjuste: () => {},
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
    inundacion: SIN_INUNDACION,
    setInundacion: () => {},
    setTerreno: () => {},
    setCielo: () => {},
    setNiebla: () => {},
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

export const View3dProvider = ({ children, llaveAjustes = LLAVE_AJUSTES_3D }) => {
    const {
        hideMeasurementTools, hideAnnotationTools,
        showMeasurementTools, areMeasurementToolsVisible,
        setSelectedFeatureInfo, activeLayerIds, setHiddenLayerIds,
    } = useMapsContext();
    const [searchParams, setSearchParams] = useSearchParams();
    const [initial] = useState(() => readUrlState(searchParams));
    const habilitado = useIsNonProd();
    const [webgl] = useState(webglAvailable);
    const available = webgl && habilitado;
    const [active, setActive] = useState(initial.active && available);
    const [pitch, setPitchState] = useState(initial.pitch);
    const [bearing, setBearing] = useState(VIEW3D_DEFAULTS.bearing);
    const [exaggeration, setExaggerationState] = useState(VIEW3D_DEFAULTS.exaggeration);
    const [extruded, setExtruded] = useState(initial.extruded);
    const [orbita, setOrbita] = useState(false);
    const [inundacion, setInundacionState] = useState(SIN_INUNDACION);
    const setInundacion = useCallback(cambios => setInundacionState(prev => ({ ...prev, ...cambios })), []);
    const lloviendo = inundacion.lloviendo;
    const inundado = inundacion.nivel > 0;
    const modoInundacion = inundacion.modo;
    useEffect(() => {
        if (lloviendo) trackView3d('lluvia');
    }, [lloviendo]);
    useEffect(() => {
        if (inundado) trackView3d('inundacion', { modo: modoInundacion });
    }, [inundado, modoInundacion]);
    const { ajustes, setAjuste, reemplazarAjustes, restablecerAjustes } = useAjustes3d(llaveAjustes);
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
        setInundacionState(SIN_INUNDACION);
        setActive(prev => {
            if (prev) {
                const seconds = enteredAtRef.current ? Math.round((Date.now() - enteredAtRef.current) / 1000) : null;
                trackView3d('exit', { duration_sec: seconds });
            }
            return false;
        });
    }, [showMeasurementTools]);

    const toggle = useCallback(() => (active ? exit() : enter()), [active, enter, exit]);
    useEffect(() => {
        if (!habilitado) exit();
    }, [habilitado, exit]);
    const setPitch = useCallback((value) => setPitchState(clampPitch(value)), []);
    const setExaggeration = useCallback((value) => setExaggerationState(clampExaggeration(value)), []);
    const setters = useMemo(() => ({
        setSol: valor => setAjuste('sol', valor),
        setAlturaColumnas: valor => setAjuste('alturaColumnas', valor),
        setTerreno: valor => setAjuste('terreno', valor),
        setCielo: valor => setAjuste('cielo', valor),
        setNiebla: valor => setAjuste('niebla', valor),
        setEstiloPuntos: valor => setAjuste('estiloPuntos', valor),
    }), [setAjuste]);

    const restablecer = useCallback(() => {
        setPitchState(VIEW3D_DEFAULTS.pitch);
        setBearing(VIEW3D_DEFAULTS.bearing);
        setExaggerationState(VIEW3D_DEFAULTS.exaggeration);
        restablecerAjustes();
        setOrbita(false);
    }, [restablecerAjustes]);

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
            if (vista.ajustes) reemplazarAjustes(vista.ajustes);
        };
        aplicar();
        return suscribirVista3d(aplicar);
    }, [enter, reemplazarAjustes]);

    const ocultadasRef = useRef(new Set());
    useEffect(() => {
        if (!setHiddenLayerIds) return;
        if (!active) {
            const restaurar = [...ocultadasRef.current];
            ocultadasRef.current = new Set();
            if (restaurar.length) setHiddenLayerIds(prev => prev.filter(id => !restaurar.includes(id)));
            return;
        }
        const nuevas = CAPAS_OCULTAS_EN_3D.filter(id => (activeLayerIds || []).includes(id) && !ocultadasRef.current.has(id));
        if (!nuevas.length) return;
        nuevas.forEach(id => ocultadasRef.current.add(id));
        setHiddenLayerIds(prev => [...new Set([...prev, ...nuevas])]);
    }, [active, activeLayerIds, setHiddenLayerIds]);

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
        present: habilitado, available, active, pitch, bearing, exaggeration, extruded, extrusionStatus, map3dRef, grupo3dRef,
        ...ajustes, ajustes, setAjuste, ...setters, orbita, inundacion, setInundacion,
        enter, exit, toggle, setPitch, setBearing, setExaggeration, toggleExtrusion, isExtruded, reportExtrusion,
        setOrbita, restablecer,
    }), [
        habilitado, available, active, pitch, bearing, exaggeration, extruded, extrusionStatus,
        ajustes, setAjuste, setters, orbita, inundacion, setInundacion,
        enter, exit, toggle, setPitch, setExaggeration, toggleExtrusion, isExtruded, reportExtrusion,
        restablecer,
    ]);

    return <View3dContext.Provider value={value}>{children}</View3dContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useView3d = () => useContext(View3dContext) || INACTIVE;
