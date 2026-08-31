import { useRef } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import { useClearance } from '@hooks/useClearance';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { PANEL_GAP, VIEWPORT_EDGE } from '@pages/maps/helpers/mapFit';

export const DOCK_ID = 'dock-pills';

const CONTROLES_DEL_MAPA = ['.ol-scale-line', '.ol-attribution'];
const ALTO_DOCK = 120;

const DockPills = () => {
    const isMobile = useIsMobile();
    const dockRef = useRef(null);
    const { leftPosition, className: transicionSider } = useSiderAdaptivePosition({ bottomOffset: ALTO_DOCK });

    const inferior = useClearance(dockRef, {
        lado: 'bottom',
        obstaculos: CONTROLES_DEL_MAPA,
        base: isMobile ? 68 : 12,
        separacion: 8,
    });

    return (
        <div
            id={DOCK_ID}
            ref={dockRef}
            className={`fixed z-11 flex items-end justify-center gap-2 pointer-events-none max-md:flex-col max-md:items-center ${transicionSider}`}
            style={{
                bottom: inferior,
                left: isMobile ? VIEWPORT_EDGE : leftPosition + PANEL_GAP,
                right: VIEWPORT_EDGE + (isMobile ? 0 : PANEL_GAP),
            }}
        />
    );
};

export default DockPills;
