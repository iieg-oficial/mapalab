import { useState } from 'react';
import { useWMSLegend } from '@hooksMaps/useWMSLegend';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import { useLegendsVisibility } from './hooks/useLegendsVisibility';
import { ACTIVE_LAYERS_PANEL_WIDTH } from '@pages/maps/helpers/mapFit';
import LegendImage from '@components/LegendImage';
import Icon from '@components/Icon';
import HexbinLegend from './HexbinLegend';
import { legendEntries } from '@pages/maps/helpers/hexbinStyles';
import { hasHexbinMode } from '@pages/maps/helpers/serviceMode';

const LayerLegendInline = ({ layer, compareMode, slotMembership }) => {
    const { hasLegend, getLegendUrl } = useWMSLegend();
    const { visible } = useLegendsVisibility();
    const { centerOnLayer, getServiceMode, getHexbinStats } = useMapsContext();
    const { width: siderWidth, isMobile } = useSider();
    const [hovered, setHovered] = useState(false);

    if (!visible) return null;
    if (!layer) return null;

    const hexbinIds = layer.childIds?.length ? layer.childIds : [layer.id];
    if (hasHexbinMode(hexbinIds, getServiceMode)) {
        const stats = hexbinIds.map(id => getHexbinStats?.(id)).find(Boolean);
        if (!stats) return null;
        return (
            <div className="w-full bg-white rounded-[13px] overflow-hidden">
                <HexbinLegend entries={legendEntries(stats.breaks, stats.max)} cells={stats.cells} />
            </div>
        );
    }

    if (!hasLegend(layer)) return null;

    const isSwipe = !!compareMode?.active;

    let url;
    if (!isSwipe || !slotMembership) {
        url = getLegendUrl(layer);
    } else {
        const activeSlot = slotMembership === 'AB'
            ? (compareMode.activeSlot === 'B' ? 'B' : 'A')
            : slotMembership;
        const slotDate = compareMode[activeSlot === 'A' ? 'paneA' : 'paneB']?.filters?.[layer.id]?.date;
        url = getLegendUrl(layer, { dateValue: slotDate });
    }

    if (!url) return null;

    const handleCenter = (e) => {
        e.stopPropagation();
        centerOnLayer?.(layer.id, { siderWidth, isMobile, rightPanelWidth: ACTIVE_LAYERS_PANEL_WIDTH });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCenter(e);
        }
    };

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleCenter}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title="Centrar capa en el mapa"
            aria-label="Centrar capa en el mapa"
            className="relative group w-full bg-white rounded-[13px] overflow-hidden p-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#70308A] outline-none"
        >
            <LegendImage src={url} alt={layer.name} />
            <span className="absolute top-1.5 right-1.5 z-10 p-1 bg-white rounded-full shadow-[0_2px_8px_#1A26641A] opacity-0 group-hover:opacity-100 max-md:opacity-100 transition-opacity pointer-events-none">
                <Icon name="fit_extent" state={hovered ? 'hover' : 'normal'} className="w-4 h-4" />
            </span>
        </div>
    );
};

export default LayerLegendInline;
