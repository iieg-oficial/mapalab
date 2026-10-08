import { lazy, Suspense, useCallback, useEffect, useRef } from 'react';
import { useView3d } from '@contexts/View3dContext';
import { useMapsContext } from '@hooks/useMaps';
import { canExtrudeLayer } from '@pages/maps/helpers/view3d';

const Map3DView = lazy(() => import('@mapsComponents/Map3D/Map3DView'));

const useExtrusionDeLaCapa = (onExtrusion) => {
    const view3d = useView3d();
    const { allLayers, getServiceMode } = useMapsContext();
    const capa = allLayers?.[0] || null;
    const id = capa?.id || null;
    const extruible = !!capa && view3d.available && canExtrudeLayer(capa, getServiceMode?.(id));
    const on = extruible && view3d.active && view3d.isExtruded(id);
    const status = on ? view3d.extrusionStatus[id] || null : null;
    const viewRef = useRef(view3d);

    useEffect(() => {
        viewRef.current = view3d;
    }, [view3d]);

    const alternar = useCallback(() => {
        const vista = viewRef.current;
        if (!vista.active) {
            if (vista.enter() && !vista.isExtruded(id)) vista.toggleExtrusion(id);
            return;
        }
        vista.toggleExtrusion(id);
    }, [id]);

    useEffect(() => {
        onExtrusion?.(extruible ? { on, status, en3d: view3d.active, alternar } : null);
    }, [onExtrusion, extruible, on, status, view3d.active, alternar]);

    useEffect(() => () => onExtrusion?.(null), [onExtrusion]);
};

const CatalogoVista3d = ({ consultar, onExtrusion = null }) => {
    const { active } = useView3d();
    useExtrusionDeLaCapa(onExtrusion);
    if (!active) return null;
    return (
        <Suspense fallback={null}>
            <Map3DView consultar={consultar} mediciones={false} />
        </Suspense>
    );
};

export default CatalogoVista3d;
