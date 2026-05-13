import { useEffect, useRef } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { postFeatureClick } from '@pages/embed/helpers/postMessage';


export const useEmbedFeatureRelay = () => {
    const { selectedFeatureInfo } = useMapsContext();
    const lastFingerprintRef = useRef(null);

    useEffect(() => {
        if (!selectedFeatureInfo) return;
        const feature = selectedFeatureInfo.feature || selectedFeatureInfo;
        const properties = feature?.properties || feature?.getProperties?.() || {};
        const layerId = selectedFeatureInfo.layerId || feature?.layerId || null;
        const featureId = feature?.id || feature?.getId?.() || properties?.id || null;
        const fingerprint = JSON.stringify({ layerId, featureId, keys: Object.keys(properties || {}).length });
        if (fingerprint === lastFingerprintRef.current) return;
        lastFingerprintRef.current = fingerprint;
        postFeatureClick({
            layerId,
            featureId,
            properties,
        });
    }, [selectedFeatureInfo]);
};
