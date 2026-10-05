import { useCallback, useEffect } from 'react';
import { useIsNonProd } from '@hooks/useDevTools';
import { buildIiegMarker, computeIiegStats } from '@pages/maps/helpers/markerDefinitions';
import { getDatabaseStats } from '@services/layerMetadataService';

export const useMarcaIieg = ({ showMarker, allLayers }) => {
    const conCaminar = useIsNonProd();

    useEffect(() => {
        if (!allLayers?.length) return;
        showMarker?.(buildIiegMarker({ ...computeIiegStats({ allLayers }), permanente: true, conCaminar }));
    }, [showMarker, allLayers, conCaminar]);

    return useCallback(async () => {
        const dbStats = await getDatabaseStats();
        showMarker?.(buildIiegMarker({ ...computeIiegStats({ allLayers }), totalRecords: dbStats?.total_records ?? null, conCaminar }));
    }, [showMarker, allLayers, conCaminar]);
};
