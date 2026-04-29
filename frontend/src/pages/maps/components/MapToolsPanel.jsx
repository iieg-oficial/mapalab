import { useState, useCallback } from 'react';
import Download from './MapExport/Download';
import ShareButton from './ShareButton';
import InfoModal from './InfoModal';
import Panel from '@components/Panel';
import ExportPreview from './MapExport/ExportPreview';
import { useShareDirtiness } from '@pages/maps/hooks/useShareDirtiness';
import { useMapsContext } from '@hooks/useMaps';

const MapToolsPanel = () => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [previewFormat, setPreviewFormat] = useState('png');
    const [previewLegends, setPreviewLegends] = useState([]);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewQuality, setPreviewQuality] = useState(null);
    const { isDirty, loadedShareId } = useShareDirtiness();
    const { compareMode, exitCompareMode } = useMapsContext();
    const inSyncWithShare = !!loadedShareId && !isDirty;
    const isModifiedFromShare = !!loadedShareId && isDirty;
    const isComparing = !!compareMode?.active;

    const handleRevert = useCallback(() => {
        window.location.reload();
    }, []);

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
            {inSyncWithShare && (
                <span
                    className="hidden md:inline-flex fixed top-4 right-[calc(16px+373px+8px)] z-11 items-center text-[11px]/[16px] font-garet bg-[#DCFCE7] text-[#16A34A] border border-[#22C55E] px-3 py-2 rounded-full whitespace-nowrap shadow-[0_5px_20px_#1A26641A] pointer-events-none"
                    title={`Mapa cargado del enlace ${loadedShareId}`}
                >
                    Usando link compartido: <span className="font-bold tabular-nums ml-1">{loadedShareId}</span>
                </span>
            )}
            {isModifiedFromShare && (
                <button
                    type="button"
                    onClick={handleRevert}
                    className="hidden md:inline-flex fixed top-4 right-[calc(16px+373px+8px)] z-11 items-center text-[11px]/[16px] font-garet bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-400 px-3 py-2 rounded-full whitespace-nowrap shadow-[0_5px_20px_#1A26641A] cursor-pointer transition-colors"
                    title={`Volver al estado del enlace ${loadedShareId}`}
                >
                    Regresar a: <span className="font-bold tabular-nums ml-1">{loadedShareId}</span>
                </button>
            )}
            {isComparing && (
                <button
                    type="button"
                    onClick={exitCompareMode}
                    className="hidden md:inline-flex fixed top-4 right-[calc(16px+373px+8px+150px)] z-11 items-center text-[11px]/[16px] font-garet bg-[#DBEAFE] hover:bg-[#BFDBFE] text-[#1D4ED8] border border-[#3B82F6] px-3 py-2 rounded-full whitespace-nowrap shadow-[0_5px_20px_#1A26641A] cursor-pointer transition-colors"
                    title="Salir del modo comparacion"
                >
                    Comparando: <span className="font-bold ml-1">{compareMode.paneA.label || 'A'} vs {compareMode.paneB.label || 'B'}</span>
                    <span className="ml-2 text-gray-500">×</span>
                </button>
            )}
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
