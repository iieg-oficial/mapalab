import { useEffect, useRef } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { buildEmbedMarker } from '@pages/maps/helpers/markerDefinitions';

const RETRY_MS = 200;
const MARKER_ID = 'embed_marker';

export const useEmbedMarker = ({ marker, icon = null, color = null, title = null, description = null, card = null, visorHref = null }) => {
    const { mapRef, showMarker, hideMarker } = useMapsContext();
    const appliedRef = useRef(false);

    useEffect(() => {
        if (!marker || appliedRef.current) return undefined;
        const [lat, lng] = marker;
        let intervalId = null;

        const apply = () => {
            if (!mapRef?.current || typeof showMarker !== 'function') return false;
            appliedRef.current = true;
            showMarker(buildEmbedMarker({ center: [lng, lat], icon, color, title, description, card, visorHref }));
            return true;
        };

        if (!apply()) {
            intervalId = setInterval(() => {
                if (apply()) {
                    clearInterval(intervalId);
                    intervalId = null;
                }
            }, RETRY_MS);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [marker, icon, color, title, description, card, visorHref, mapRef, showMarker]);

    useEffect(() => () => {
        if (appliedRef.current) hideMarker?.(MARKER_ID);
    }, [hideMarker]);
};
