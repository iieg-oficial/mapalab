import { useState, useCallback, useEffect } from 'react';
import Download from './MapExport/Download';
import MunicipioFilterButton from './MapExport/MunicipioFilterButton';
import ShareButton from './ShareButton';
import ShareActiveChip from './ShareActiveChip';
import Panel from '@components/Panel';
import FloatingIconButton from '@components/FloatingIconButton';
import ExportPreview from './MapExport/ExportPreview';
import { useShareDirtiness } from '@pages/maps/hooks/useShareDirtiness';
import { useMapsContext } from '@hooks/useMaps';
import { SIDER_EXPANDED_WIDTH, TOOLS_COMPACT_MEDIA_QUERY } from '@constants/sider';
import { useMediaQuery } from '@hooks/useMediaQuery';
import { useIsMobile } from '@hooks/useIsMobile';
import { useSider } from '@contexts/SiderContext';
import { useAreaUtil } from '@contexts/AreaUtilContext';
import {
    leerPreferenciaCompacta,
    guardarPreferenciaCompacta,
    resolveToolsCollapsed,
} from '@pages/maps/helpers/toolsPanelCollapse';

const MapToolsPanel = () => {
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isDownloadOpen, setIsDownloadOpen] = useState(false);
    const [isMunicipioOpen, setIsMunicipioOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const { municipioMode } = useMapsContext();
    const { toolsPanelRef } = useSider();
    const [previewFormat, setPreviewFormat] = useState('png');
    const [previewLegends, setPreviewLegends] = useState([]);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewQuality, setPreviewQuality] = useState(null);
    const [previewSwipeOptions, setPreviewSwipeOptions] = useState(null);
    const { isDirty, loadedShareId, reset } = useShareDirtiness();
    const [preferencia, setPreferencia] = useState(leerPreferenciaCompacta);
    const esCompacto = useMediaQuery(TOOLS_COMPACT_MEDIA_QUERY);
    const isMobile = useIsMobile();
    const { acoplado } = useAreaUtil();

    const isCollapsed = resolveToolsCollapsed({ isMobile, esCompacto, preferencia });

    useEffect(() => {
        if (!acoplado) return;
        guardarPreferenciaCompacta('1');
        setPreferencia('1');
    }, [acoplado]);

    const alternarCompacto = useCallback(() => {
        const siguiente = isCollapsed ? '0' : '1';
        guardarPreferenciaCompacta(siguiente);
        setPreferencia(siguiente);
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
    // const panelInlineStyle = isCollapsed ? undefined : { width: SIDER_EXPANDED_WIDTH };
    const collapseIconKey = isCollapsed ? 'left_arrow_fill_normal' : 'right_arrow_fill_normal';
    const collapseTooltip = isCollapsed ? 'Mostrar etiquetas' : 'Compactar barra';

    return (
        <>
            <div ref={toolsPanelRef} className={`fixed top-4 right-4 z-11 ${isAnyPanelOpen ? 'max-md:z-60' : 'max-md:z-21'} flex flex-row items-center`}>
                {loadedShareId && (
                    <ShareActiveChip loadedShareId={loadedShareId} isDirty={isDirty} onRestaurado={reset} />
                )}
                <div className="hidden md:flex shrink-0 -mr-5 mt-2.5 z-12 relative">
                    <FloatingIconButton
                        iconKey={collapseIconKey}
                        tooltip={collapseTooltip}
                        placement="left"
                        delay={300}
                        onClick={alternarCompacto}
                    />
                </div>
                <Panel
                    variant="floating"
                    position="static"
                    width={isCollapsed ? 'w-auto' : 'w-auto md:w-[373px]'}
                    flexDirection="flex-row items-center"
                    className="rounded-[10px] shadow-[0_5px_20px_#1A26641A]"
                    contentClassName="gap-2 px-4 py-3"
                    bg="bg-white"
                >
                    <Download
                        onOpenPreview={handleOpenPreview}
                        onOpenChange={setIsDownloadOpen}
                        collapsed={isCollapsed}
                        expanded={false}
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
