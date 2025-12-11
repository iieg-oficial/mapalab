import Download from './Download';
import ShareButton from './ShareButton';
import InfoModal from './InfoModal';
import Panel from '@components/Panel';

const MapToolsPanel = () => {
    return (
        <Panel
            variant="floating"
            position="top-3 right-3 z-11"
            width="w-auto"
            maxHeight="h-auto"
            flexDirection="flex-row"
            contentClassName="gap-3 px-4 py-3"
        >
            <Download />
            <ShareButton />
            <InfoModal />
        </Panel>
    );
};

export default MapToolsPanel;
