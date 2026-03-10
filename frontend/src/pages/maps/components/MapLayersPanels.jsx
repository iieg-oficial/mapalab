import { useState, useCallback } from 'react';
import { ActiveLayersList } from './ActiveLayers';
import SymbologyPanel from './SymbologyPanel';
import Panel from '@components/Panel';

const MapLayersPanels = () => {
    const [layersCollapsed, setLayersCollapsed] = useState(true);
    const [symbologyCollapsed, setSymbologyCollapsed] = useState(true);
    const handleLayersCollapse = useCallback((v) => setLayersCollapsed(v), []);
    const handleSymbologyCollapse = useCallback((v) => setSymbologyCollapsed(v), []);

    const allCollapsed = layersCollapsed && symbologyCollapsed;

    return (
        <Panel
            variant="floating"
            position={`top-27 right-4 z-10 ${allCollapsed ? 'max-md:z-9' : 'max-md:z-[23]'}`}
            width="w-[373px] max-md:w-[calc(100vw-2rem)]"
            maxHeight="max-h-[calc(100vh-7.5rem)] max-md:max-h-[calc(100dvh-8rem)]"
            flexDirection="flex-col"
            contentClassName="gap-4 overflow-visible"
            noPadding={true}
            className="bg-transparent! border-transparent! shadow-none! overflow-visible"
        >
            <ActiveLayersList onCollapseChange={handleLayersCollapse} />
            <SymbologyPanel onCollapseChange={handleSymbologyCollapse} />
        </Panel>
    );
};

export default MapLayersPanels;
