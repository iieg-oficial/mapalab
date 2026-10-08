import { useCallback, useEffect } from 'react';
import { useIsNonProd } from '@hooks/useDevTools';
import { useView3d } from '@contexts/View3dContext';
import { buildIiegMarker, computeIiegStats } from '@pages/maps/helpers/markerDefinitions';
import { zoom3dDeOl } from '@pages/maps/helpers/view3d';
import { getDatabaseStats } from '@services/layerMetadataService';

const ZOOM_MARCA = 16;

export const useMarcaIieg = ({ showMarker, allLayers }) => {
    const conCaminar = useIsNonProd();
    const { active, map3dRef } = useView3d();

    useEffect(() => {
        if (!allLayers?.length) return;
        showMarker?.(buildIiegMarker({ ...computeIiegStats({ allLayers }), permanente: true, conCaminar }));
    }, [showMarker, allLayers, conCaminar]);

    return useCallback(async () => {
        const map3d = active ? map3dRef.current : null;
        if (map3d) {
            const { center, zoom } = buildIiegMarker();
            map3d.flyTo({ center, zoom: zoom3dDeOl(zoom ?? ZOOM_MARCA), pitch: map3d.getPitch(), bearing: map3d.getBearing(), duration: 1500 });
        }
        const dbStats = await getDatabaseStats();
        const marca = buildIiegMarker({ ...computeIiegStats({ allLayers }), totalRecords: dbStats?.total_records ?? null, conCaminar });
        showMarker?.(marca);
        return marca;
    }, [showMarker, allLayers, conCaminar, active, map3dRef]);
};
