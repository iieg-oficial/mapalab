import { ActiveLayersList } from './ActiveLayers';
import SymbologyPanel from './SymbologyPanel';
import Panel from '@components/Panel';

const MapLayersPanels = () => {
    return (
        <Panel
            variant="floating"
            position="top-25 right-3 z-10"
            width="w-[373px]"
            maxHeight="max-h-[calc(100vh-6rem)]"
            flexDirection="flex-col"
            contentClassName="gap-4 overflow-hidden"
            noPadding={true}
            className="bg-transparent! border-transparent! shadow-none! overflow-hidden"
        >
            <ActiveLayersList />
            <SymbologyPanel />
        </Panel>
    );
};

export default MapLayersPanels;
