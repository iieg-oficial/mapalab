import { useState } from 'react';
import Download from './MapExport/Download';
import ShareButton from './ShareButton';
import InfoModal from './InfoModal';
import Panel from '@components/Panel';
import ExportPreview from './MapExport/ExportPreview';

const MapToolsPanel = () => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [previewFormat, setPreviewFormat] = useState('png');
    const [previewLegends, setPreviewLegends] = useState([]);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewQuality, setPreviewQuality] = useState(null);

    const handleOpenPreview = (format, selectedLegends, title, quality) => {
        setPreviewFormat(format || 'png');
        setPreviewLegends(Array.isArray(selectedLegends) ? selectedLegends : (selectedLegends ? [selectedLegends] : []));
        setPreviewTitle(title || '');
        setPreviewQuality(quality || null);
        setIsPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setIsPreviewOpen(false);
    };

    const isAnyPanelOpen = isDownloadOpen || isPreviewOpen;

    return (
        <>
            <Panel
                variant="floating"
                position={`top-4 right-4 z-11 ${isAnyPanelOpen ? 'max-md:z-[60]' : 'max-md:z-21'}`}
                width="w-auto md:w-[373px]"
                flexDirection="flex-row items-center"
                className="rounded-[14px] shadow-[0_5px_20px_#1A26641A]"
                contentClassName="gap-2 px-2 py-3"
                bg="bg-white"
            >
                <Download onOpenPreview={handleOpenPreview} onOpenChange={setIsDownloadOpen} />
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
                    quality={previewQuality}
                />
            )}
        </>
    );
};

export default MapToolsPanel;
