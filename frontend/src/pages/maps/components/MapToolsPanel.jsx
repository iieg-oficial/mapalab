import { useState } from 'react';
import Download from './MapExport/Download';
import ShareButton from './ShareButton';
import InfoModal from './InfoModal';
import Panel from '@components/Panel';
import ExportPreview from './MapExport/ExportPreview';

const MapToolsPanel = () => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewFormat, setPreviewFormat] = useState('png');

    const handleOpenPreview = (format) => {
        setPreviewFormat(format || 'png');
        setIsPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setIsPreviewOpen(false);
    };

    return (
        <>
            <Panel
                variant="floating"
                position="top-3 right-3 z-11"
                width="w-auto"
                flexDirection="flex-row items-center"
                className="rounded-[14px] shadow-none"
                contentClassName="gap-2 px-2 py-3"
                bg="bg-white"
            >
                <Download onOpenPreview={handleOpenPreview} />
                <ShareButton />
                <InfoModal />
            </Panel>
            <ExportPreview
                isOpen={isPreviewOpen}
                onClose={handleClosePreview}
                format={previewFormat}
            />
        </>
    );
};

export default MapToolsPanel;
