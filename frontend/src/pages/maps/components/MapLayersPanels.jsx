import ActiveLayersList from './ActiveLayersList';
import SymbologyPanel from './SymbologyPanel';
import Panel from '@components/Panel';

const MapLayersPanels = () => {
    return (
        <Panel
            variant="floating"
            position="top-20 right-3 z-10"
            width="w-auto"
            maxHeight="max-h-[calc(100vh-6rem)]"
            flexDirection="flex-col"
            contentClassName="gap-4 overflow-y-auto"
            noPadding={true}
            className="bg-transparent! shadow-none! !"
        >
            <ActiveLayersList />
            <SymbologyPanel />
        </Panel>
    );
};

export default MapLayersPanels;
