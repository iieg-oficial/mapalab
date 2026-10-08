import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
    fetchMunicipiosList,
    fetchMunicipiosGeometries,
} from '@services/municipioService';
import {
    trackMunicipioModeEnter,
    trackMunicipioModeExit,
    trackMunicipioSelectionChange,
} from '@services/analyticsService';

const INEGI_BASE_IDS = new Set(['limite_inegi', 'limite_municipal_inegi']);

export const SCOPE_TYPES = {
    MUNICIPIO: 'municipio',
    REGION: 'region',
    ZMG: 'zmg',
};

const ZMG_CLAVES = ['14039', '14120', '14098', '14101', '14097', '14070', '14051', '14044', '14124'];
export const ZMG_LABEL = 'ZMG (Zona Metropolitana de Guadalajara)';

const TIPOS_DE_SCOPE = new Set(Object.values(SCOPE_TYPES));

const esZmg = (claves) => claves.length === ZMG_CLAVES.length && ZMG_CLAVES.every((c) => claves.includes(c));

const scopeRestaurado = (claves, guardado) => {
    if (TIPOS_DE_SCOPE.has(guardado?.type)) return { type: guardado.type, value: guardado.value ?? null };
    if (claves.length === 0) return { type: null, value: null };
    if (claves.length === 1) return { type: SCOPE_TYPES.MUNICIPIO, value: claves[0] };
    if (esZmg(claves)) return { type: SCOPE_TYPES.ZMG, value: null };
    return { type: SCOPE_TYPES.MUNICIPIO, value: null };
};

export const useMunicipioMode = ({ activeLayerIds }) => {
    const [active, setActive] = useState(false);
    const [scope, setScopeState] = useState({ type: null, value: null });
    const [selected, setSelected] = useState([]);
    const [allMunicipios, setAllMunicipios] = useState([]);
    const [listLoading, setListLoading] = useState(false);
    const [geomLoading, setGeomLoading] = useState(false);
    const [geometries, setGeometries] = useState([]);
    const [unionBbox, setUnionBbox] = useState(null);
    const [error, setError] = useState(null);

    const listAbortRef = useRef(null);
    const geomAbortRef = useRef(null);
    const enteredAtRef = useRef(null);

    const sourceId = useMemo(() => {
        const ids = activeLayerIds || [];
        return ids.some(id => INEGI_BASE_IDS.has(id)) ? 'inegi' : 'iieg';
    }, [activeLayerIds]);

    const regiones = useMemo(() => {
        const map = new Map();
        allMunicipios.forEach(m => {
            const reg = m.region || 'Sin región';
            if (!map.has(reg)) map.set(reg, []);
            map.get(reg).push(m.clave);
        });
        return [...map.entries()]
            .map(([nombre, claves]) => ({ nombre, claves: claves.slice().sort() }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
    }, [allMunicipios]);

    const scopeLabel = useMemo(() => {
        if (!scope.type) return null;
        if (scope.type === SCOPE_TYPES.ZMG) return ZMG_LABEL;
        if (scope.type === SCOPE_TYPES.REGION) {
            return scope.value ? `Región ${scope.value}` : 'Región';
        }
        if (scope.type === SCOPE_TYPES.MUNICIPIO) {
            if (!scope.value) return 'Municipios';
            const match = allMunicipios.find(m => String(m.clave) === String(scope.value));
            return match?.nombre || String(scope.value);
        }
        return null;
    }, [scope, allMunicipios]);

    const loadList = useCallback(async (force = false) => {
        if (listAbortRef.current) listAbortRef.current.abort();
        const controller = new AbortController();
        listAbortRef.current = controller;
        setListLoading(true);
        setError(null);
        try {
            const items = await fetchMunicipiosList({ signal: controller.signal, force });
            setAllMunicipios(items);
            return items;
        } catch (err) {
            if (err?.name !== 'AbortError') setError(err);
            return [];
        } finally {
            if (listAbortRef.current === controller) listAbortRef.current = null;
            setListLoading(false);
        }
    }, []);

    const loadGeometries = useCallback(async (claves, src) => {
        if (!Array.isArray(claves) || claves.length === 0) {
            setGeometries([]);
            setUnionBbox(null);
            return { items: [], unionBbox: null };
        }
        if (geomAbortRef.current) geomAbortRef.current.abort();
        const controller = new AbortController();
        geomAbortRef.current = controller;
        setGeomLoading(true);
        setError(null);
        try {
            const result = await fetchMunicipiosGeometries(src, claves, { signal: controller.signal });
            setGeometries(result.items || []);
            setUnionBbox(result.unionBbox || null);
            return result;
        } catch (err) {
            if (err?.name !== 'AbortError') setError(err);
            return { items: [], unionBbox: null };
        } finally {
            if (geomAbortRef.current === controller) geomAbortRef.current = null;
            setGeomLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!active) {
            setGeometries([]);
            setUnionBbox(null);
            return;
        }
        loadGeometries(selected, sourceId);
    }, [active, selected, sourceId, loadGeometries]);

    useEffect(() => {
        if (allMunicipios.length === 0 && !listLoading) {
            loadList();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isInsideMunicipios = useCallback((coord) => {
        if (!active) return true;
        if (!Array.isArray(geometries) || geometries.length === 0) return true;
        if (!Array.isArray(coord) || coord.length < 2) return false;
        for (const item of geometries) {
            if (item?.geometry?.intersectsCoordinate?.(coord)) return true;
        }
        return false;
    }, [active, geometries]);

    const polygonIntersectsMunicipios = useCallback((olGeometry) => {
        if (!active) return true;
        if (!Array.isArray(geometries) || geometries.length === 0) return true;
        if (!olGeometry?.getCoordinates) return false;
        try {
            const rings = olGeometry.getCoordinates();
            const outer = Array.isArray(rings?.[0]) && Array.isArray(rings[0][0]) ? rings[0] : rings;
            if (!Array.isArray(outer)) return false;
            for (const coord of outer) {
                if (!Array.isArray(coord)) continue;
                for (const item of geometries) {
                    if (item?.geometry?.intersectsCoordinate?.(coord)) return true;
                }
            }
        } catch {
            return true;
        }
        return false;
    }, [active, geometries]);

    const municipioContext = useMemo(() => {
        if (!active || !Array.isArray(selected) || selected.length === 0) {
            return { active: false, claves: [], nombres: [], bbox: null, listLoading: false, allMunicipiosCount: allMunicipios.length };
        }
        const claves = selected.map(String);
        const clavesSet = new Set(claves);
        const nombres = allMunicipios
            .filter(m => clavesSet.has(String(m.clave)))
            .map(m => m.nombre)
            .filter(Boolean);
        return {
            active: true,
            claves,
            nombres,
            bbox: Array.isArray(unionBbox) && unionBbox.length === 4 ? unionBbox : null,
            listLoading,
            allMunicipiosCount: allMunicipios.length,
        };
    }, [active, selected, allMunicipios, unionBbox, listLoading]);

    const resolveClavesForScope = useCallback((type, value, allMunis) => {
        if (type === SCOPE_TYPES.MUNICIPIO) return [String(value)];
        if (type === SCOPE_TYPES.ZMG) return [...ZMG_CLAVES];
        if (type === SCOPE_TYPES.REGION) {
            return allMunis
                .filter(m => (m.region || '') === value)
                .map(m => String(m.clave));
        }
        return [];
    }, []);

    const setScope = useCallback((type, value) => {
        if (!type) {
            setScopeState({ type: null, value: null });
            setSelected([]);
            trackMunicipioSelectionChange({ source: sourceId, count: 0, action: 'clear' });
            return;
        }
        const claves = resolveClavesForScope(type, value, allMunicipios);
        setScopeState({ type, value });
        setSelected(claves);
        setActive(prev => {
            if (!prev) {
                enteredAtRef.current = Date.now();
                trackMunicipioModeEnter({ source: sourceId, count: claves.length, fromUrl: false });
            }
            return true;
        });
        trackMunicipioSelectionChange({ source: sourceId, count: claves.length, action: `set_${type}` });
    }, [sourceId, allMunicipios, resolveClavesForScope]);

    const enter = useCallback(async (initialClaves = [], { fromUrl = false, scope: scopeGuardado = null } = {}) => {
        const wasActive = active;
        const unique = Array.isArray(initialClaves) ? [...new Set(initialClaves.map(String))] : [];
        setSelected(unique);
        setScopeState(scopeRestaurado(unique, scopeGuardado));
        setActive(true);
        if (!wasActive) {
            enteredAtRef.current = Date.now();
        }
        if (allMunicipios.length === 0 && !listLoading) {
            loadList();
        }
        trackMunicipioModeEnter({ source: sourceId, count: unique.length, fromUrl });
    }, [active, loadList, sourceId, allMunicipios.length, listLoading]);

    const exit = useCallback(() => {
        const startedAt = enteredAtRef.current;
        const durationSec = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
        enteredAtRef.current = null;
        trackMunicipioModeExit({ durationSec, source: sourceId });
        setActive(false);
        setScopeState({ type: null, value: null });
        setSelected([]);
        setGeometries([]);
        setUnionBbox(null);
        setError(null);
    }, [sourceId]);

    useEffect(() => () => {
        listAbortRef.current?.abort();
        geomAbortRef.current?.abort();
    }, []);

    return useMemo(() => ({
        active,
        scope,
        scopeLabel,
        selected,
        sourceId,
        allMunicipios,
        regiones,
        geometries,
        listLoading,
        geomLoading,
        error,
        municipioContext,
        isInsideMunicipios,
        polygonIntersectsMunicipios,
        enter,
        exit,
        setScope,
        loadList,
    }), [
        active, scope, scopeLabel, selected, sourceId,
        allMunicipios, regiones, geometries, listLoading, geomLoading, error,
        municipioContext, isInsideMunicipios, polygonIntersectsMunicipios,
        enter, exit, setScope, loadList,
    ]);
};
