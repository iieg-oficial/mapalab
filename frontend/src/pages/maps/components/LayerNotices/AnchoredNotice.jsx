import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { useMapsContext } from '@hooks/useMaps';

const ARROW_TO_POSITIONING = {
    bottom: 'bottom-center',
    top: 'top-center',
    left: 'center-left',
    right: 'center-right',
};

const AnchoredNotice = ({ coord, arrowPosition = 'bottom', children }) => {
    const { mapRef, paneMapInstances } = useMapsContext();
    const [container] = useState(() => {
        if (typeof document === 'undefined') return null;
        const el = document.createElement('div');
        el.style.pointerEvents = 'auto';
        el.style.willChange = 'transform, visibility';
        return el;
    });

    const overlayRef = useRef(null);

    useEffect(() => {
        if (!container) return undefined;
        const map = paneMapInstances?.[0] || mapRef?.current;
        if (!map || !coord || !Number.isFinite(coord.lon) || !Number.isFinite(coord.lat)) return undefined;

        const overlay = new Overlay({
            element: container,
            position: fromLonLat([coord.lon, coord.lat]),
            positioning: ARROW_TO_POSITIONING[arrowPosition] || 'bottom-center',
            stopEvent: false,
            insertFirst: false,
        });
        map.addOverlay(overlay);
        overlayRef.current = overlay;

        const updateVisibility = () => {
            const size = map.getSize();
            if (!size) return;
            const pixel = map.getPixelFromCoordinate(overlay.getPosition());
            if (!pixel) {
                container.style.visibility = 'hidden';
                return;
            }
            const [x, y] = pixel;
            const inside = x >= 0 && x <= size[0] && y >= 0 && y <= size[1];
            container.style.visibility = inside ? 'visible' : 'hidden';
        };

        updateVisibility();
        map.on('moveend', updateVisibility);
        return () => {
            map.un('moveend', updateVisibility);
            map.removeOverlay(overlay);
            overlayRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [container, mapRef, paneMapInstances, coord?.lon, coord?.lat, arrowPosition]);

    if (!container) return null;
    return createPortal(children, container);
};

export default AnchoredNotice;
