import { useState, useEffect } from 'react';
import Download from './MapExport/Download';
import MunicipioFilterButton from './MapExport/MunicipioFilterButton';
import ShareButton from './ShareButton';
import ShareActiveChip from './ShareActiveChip';
import Panel from '@components/Panel';
import FloatingIconButton from '@components/FloatingIconButton';
import ExportPreview from './MapExport/ExportPreview';
import { useShareDirtiness } from '@pages/maps/hooks/useShareDirtiness';
import { useMapsContext } from '@hooks/useMaps';
import { SIDER_EXPANDED_WIDTH } from '@constants/sider';
import { useIsNonProd } from '@hooks/useDevTools';

const COLLAPSE_KEY = 'mapalab.tools.collapsed';
const MapToolsPanel = () => {
    const isNonProd = useIsNonProd();
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [isMunicipioOpen, setIsMunicipioOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const { municipioMode } = useMapsContext();
    const [previewFormat, setPreviewFormat] = useState('png');
    const [previewLegends, setPreviewLegends] = useState([]);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewQuality, setPreviewQuality] = useState(null);
    const [previewSwipeOptions, setPreviewSwipeOptions] = useState(null);
    const { isDirty, loadedShareId, reset } = useShareDirtiness();
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
    });

    useEffect(() => {
        try { localStorage.setItem(COLLAPSE_KEY, isCollapsed ? '1' : '0'); } catch { /* storage off */ }
    }, [isCollapsed]);

    const handleOpenPreview = (format, selectedLegends, title, quality, swipeOptions) => {
        setPreviewFormat(format || 'png');
        setPreviewLegends(Array.isArray(selectedLegends) ? selectedLegends : (selectedLegends ? [selectedLegends] : []));
        setPreviewTitle(title || '');
        setPreviewQuality(quality || null);
        setPreviewSwipeOptions(swipeOptions || null);
        setIsPreviewOpen(true);
    };

    const handleClosePreview = () => {
        setIsPreviewOpen(false);
    };

    const isAnyPanelOpen = isDownloadOpen || isPreviewOpen || isMunicipioOpen || isShareOpen;
    const isDownloadExpanded = !isNonProd && !isCollapsed;
    // const panelInlineStyle = isCollapsed ? undefined : { width: SIDER_EXPANDED_WIDTH };
    const collapseIconKey = isCollapsed ? 'left_arrow_fill_normal' : 'right_arrow_fill_normal';
    const collapseTooltip = isCollapsed ? 'Mostrar etiquetas' : 'Compactar barra';

    return (
        <>
            <div className={`fixed top-4 right-4 z-11 ${isAnyPanelOpen ? 'max-md:z-60' : 'max-md:z-21'} flex flex-row items-center`}>
                {loadedShareId && (
                    <ShareActiveChip loadedShareId={loadedShareId} isDirty={isDirty} onRestaurado={reset} />
                )}
                <div className="hidden md:flex shrink-0 -mr-5 mt-2.5 z-12 relative">
                    <FloatingIconButton
                        iconKey={collapseIconKey}
                        tooltip={collapseTooltip}
                        placement="left"
                        delay={300}
                        onClick={() => setIsCollapsed(prev => !prev)}
                    />
                </div>
                <Panel
                    variant="floating"
                    position="static"
                    width={isCollapsed || !isNonProd ? 'w-auto' : 'w-auto md:w-[373px]'}
                    flexDirection="flex-row items-center"
                    className="rounded-[10px] shadow-[0_5px_20px_#1A26641A]"
                    contentClassName="gap-2 px-4 py-3"
                    bg="bg-white"
                >
                    <Download
                        onOpenPreview={handleOpenPreview}
                        onOpenChange={setIsDownloadOpen}
                        collapsed={isCollapsed}
                        expanded={isDownloadExpanded}
                    />
                    <MunicipioFilterButton 
                        municipioMode={municipioMode} 
                        onOpenChange={setIsMunicipioOpen} 
                        collapsed={isCollapsed} 
                    />
                    <ShareButton
                        onOpenChange={setIsShareOpen}
                        isDirty={isDirty}
                        loadedShareId={loadedShareId}
                        onCompartido={reset}
                    />
                </Panel>
            </div>
            {isPreviewOpen && (
                <ExportPreview
                    isOpen={isPreviewOpen}
                    onClose={handleClosePreview}
                    format={previewFormat}
                    selectedLegends={previewLegends}
                    initialTitle={previewTitle}
                    quality={previewQuality}
                    swipeOptions={previewSwipeOptions}
                />
            )}
        </>
    );
};

export default MapToolsPanel;
