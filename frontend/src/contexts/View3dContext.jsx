import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useMapsContext } from '@hooks/useMaps';
import { trackView3d } from '@services/analyticsService';
import { VIEW3D_DEFAULTS, clampExaggeration, clampPitch, webglAvailable } from '@pages/maps/helpers/view3d';

const View3dContext = createContext(null);

const INACTIVE = {
    available: false,
    active: false,
    pitch: VIEW3D_DEFAULTS.pitch,
    bearing: VIEW3D_DEFAULTS.bearing,
    exaggeration: VIEW3D_DEFAULTS.exaggeration,
    extruded: [],
    extrusionStatus: {},
    map3dRef: { current: null },
    enter: () => false,
    exit: () => {},
    toggle: () => {},
    setPitch: () => {},
    setBearing: () => {},
    setExaggeration: () => {},
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
        compareMode, exitCompareMode, hideMeasurementTools, hideAnnotationTools,
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
    const [extrusionStatus, setExtrusionStatus] = useState({});
    const map3dRef = useRef(null);
    const enteredAtRef = useRef(null);

    const enter = useCallback(() => {
        if (!available) return false;
        if (compareMode?.active) exitCompareMode?.();
        hideMeasurementTools?.();
        hideAnnotationTools?.();
        setSelectedFeatureInfo?.(null);
        enteredAtRef.current = Date.now();
        setActive(true);
        trackView3d('enter');
        return true;
    }, [available, compareMode?.active, exitCompareMode, hideMeasurementTools, hideAnnotationTools, setSelectedFeatureInfo]);

    const exit = useCallback(() => {
        setActive(prev => {
            if (prev) {
                const seconds = enteredAtRef.current ? Math.round((Date.now() - enteredAtRef.current) / 1000) : null;
                trackView3d('exit', { duration_sec: seconds });
            }
            return false;
        });
    }, []);

    const toggle = useCallback(() => (active ? exit() : enter()), [active, enter, exit]);
    const setPitch = useCallback((value) => setPitchState(clampPitch(value)), []);
    const setExaggeration = useCallback((value) => setExaggerationState(clampExaggeration(value)), []);

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

    const previousActiveRef = useRef(new Set());
    useEffect(() => {
        const vigentes = new Set(activeLayerIds || []);
        const salieron = [...previousActiveRef.current].filter(id => !vigentes.has(id));
        previousActiveRef.current = vigentes;
        if (salieron.length) setExtruded(prev => prev.filter(id => !salieron.includes(id)));
    }, [activeLayerIds]);

    useEffect(() => {
        if (compareMode?.active && active) exit();
    }, [compareMode?.active, active, exit]);

    const roundedPitch = Math.round(pitch);
    const extrudedKey = extruded.join(',');
    useEffect(() => {
        const next = writeUrlState(searchParams, { active, pitch: roundedPitch, extruded: extrudedKey ? extrudedKey.split(',') : [] });
        if (next.toString() !== searchParams.toString()) setSearchParams(next, { replace: true });
    }, [active, roundedPitch, extrudedKey, searchParams, setSearchParams]);

    const value = useMemo(() => ({
        available, active, pitch, bearing, exaggeration, extruded, extrusionStatus, map3dRef,
        enter, exit, toggle, setPitch, setBearing, setExaggeration, toggleExtrusion, isExtruded, reportExtrusion,
    }), [
        available, active, pitch, bearing, exaggeration, extruded, extrusionStatus,
        enter, exit, toggle, setPitch, setExaggeration, toggleExtrusion, isExtruded, reportExtrusion,
    ]);

    return <View3dContext.Provider value={value}>{children}</View3dContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useView3d = () => useContext(View3dContext) || INACTIVE;
