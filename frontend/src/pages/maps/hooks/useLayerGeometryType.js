import { useEffect, useState } from 'react';
import { useLayers } from '@hooks/useLayers';
import { RASTER_WORKSPACES } from '@services/downloadUrls';
import { fetchGeometryType } from '@utils/featureInfoUtils';
import { findLayerById, collectLayersWithWMS } from '../helpers/layers/utils/layerHelpers';

const geometryTypeByLayerId = new Map();

const resolveWmsConfig = (layerNode) => {
    if (!layerNode) return null;
    if (layerNode.wmsConfig) return layerNode.wmsConfig;
    return collectLayersWithWMS(layerNode)[0]?.wmsConfig || null;
};

const workspaceOf = (wmsConfig) =>
    wmsConfig.workspace || wmsConfig.geoserverWorkspace || wmsConfig.layerName?.split(':')[0] || null;

export const useLayerGeometryType = (layerId) => {
    const { layers: allLayers } = useLayers();
    const [geometryType, setGeometryType] = useState(() => geometryTypeByLayerId.get(layerId) || null);

    useEffect(() => {
        if (!layerId) {
            setGeometryType(null);
            return;
        }

        if (geometryTypeByLayerId.has(layerId)) {
            setGeometryType(geometryTypeByLayerId.get(layerId));
            return;
        }

        const wmsConfig = resolveWmsConfig(findLayerById(layerId, allLayers));
        if (!wmsConfig?.baseUrl || !wmsConfig?.layerName) {
            setGeometryType(null);
            return;
        }

        if (RASTER_WORKSPACES.has(workspaceOf(wmsConfig))) {
            geometryTypeByLayerId.set(layerId, 'raster');
            setGeometryType('raster');
            return;
        }

        let cancelled = false;
        fetchGeometryType(wmsConfig.baseUrl, wmsConfig.layerName)
            .then(tipo => {
                if (cancelled) return;
                const resolved = tipo && tipo !== 'unknown' ? tipo : null;
                geometryTypeByLayerId.set(layerId, resolved);
                setGeometryType(resolved);
            })
            .catch(() => {
                if (!cancelled) setGeometryType(null);
            });

        return () => { cancelled = true; };
    }, [layerId, allLayers]);

    return geometryType;
};
