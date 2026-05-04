import { useState, useCallback } from 'react';
import { ActiveLayersList } from './ActiveLayers';
import SymbologyPanel from './SymbologyPanel';
import Panel from '@components/Panel';
import Message from '@components/Message';
import { useSlowLoading } from '@hooks/useSlowLoading';

const SYMBOLOGY_PANEL_ENABLED = false;

const MapLayersPanels = () => {
    const [layersCollapsed, setLayersCollapsed] = useState(true);
    const [symbologyCollapsed, setSymbologyCollapsed] = useState(true);
    const handleLayersCollapse = useCallback((v) => setLayersCollapsed(v), []);
    const handleSymbologyCollapse = useCallback((v) => setSymbologyCollapsed(v), []);
    const isSlow = useSlowLoading(5000);

    const allCollapsed = layersCollapsed && (!SYMBOLOGY_PANEL_ENABLED || symbologyCollapsed);

    return (
        <Panel
            variant="floating"
            position={`top-27 right-4 z-10 ${allCollapsed ? 'max-md:z-9' : 'max-md:z-[23]'}`}
            width="w-[373px] max-md:w-[calc(100vw-2rem)]"
            maxHeight="max-h-[calc(100vh-7.5rem)] max-md:max-h-[calc(100dvh-8rem)]"
            flexDirection="flex-col"
            contentClassName="gap-4 overflow-visible"
            noPadding={true}
            className="bg-transparent! border-transparent! shadow-none! overflow-visible max-md:pointer-events-none"
        >
            {isSlow && (
                <div className="max-md:pointer-events-auto">
                    <Message
                        variant="warning"
                        title="Recuerda que..."
                        description="El funcionamiento del mapa puede verse afectado de acuerdo al número de capas que tengas activas."
                        closable
                        storageKey="slow_loading_warning"
                    />
                </div>
            )}
            <ActiveLayersList onCollapseChange={handleLayersCollapse} />
            {SYMBOLOGY_PANEL_ENABLED && <SymbologyPanel onCollapseChange={handleSymbologyCollapse} />}
        </Panel>
    );
};

export default MapLayersPanels;
