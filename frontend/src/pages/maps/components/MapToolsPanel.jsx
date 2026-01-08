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
            className="rounded-[14px] shadow-none"
            contentClassName="gap-2 px-2 py-3"
            bg="bg-white"
        >
            <Download />
            <ShareButton />
            <InfoModal />
        </Panel>
    );
};

export default MapToolsPanel;
