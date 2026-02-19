import { useState } from 'react';
import Download from './MapExport/Download';
import ShareButton from './ShareButton';
import InfoModal from './InfoModal';
import Panel from '@components/Panel';
import ExportPreview from './MapExport/ExportPreview';

const MapToolsPanel = () => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewFormat, setPreviewFormat] = useState('png');
    const [previewLegends, setPreviewLegends] = useState([]);
    const [previewTitle, setPreviewTitle] = useState('');

    const handleOpenPreview = (format, selectedLegends, title) => {
        setPreviewFormat(format || 'png');
        setPreviewLegends(Array.isArray(selectedLegends) ? selectedLegends : (selectedLegends ? [selectedLegends] : []));
        setPreviewTitle(title || '');
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
                width="w-auto md:w-[373px]"
                flexDirection="flex-row items-center"
                className="rounded-[14px] shadow-[0_5px_20px_#1A26641A]"
                contentClassName="gap-2 px-2 py-3"
                bg="bg-white"
            >
                <Download onOpenPreview={handleOpenPreview} />
                <ShareButton />
                <InfoModal />
            </Panel>
            {isPreviewOpen && (
                <ExportPreview
                    isOpen={isPreviewOpen}
                    onClose={handleClosePreview}
                    format={previewFormat}
                    selectedLegends={previewLegends}
                    initialTitle={previewTitle}
                />
            )}
        </>
    );
};

export default MapToolsPanel;
