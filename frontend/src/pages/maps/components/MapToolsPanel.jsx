import { useState, useCallback, useEffect } from 'react';
import Download from './MapExport/Download';
import MunicipioFilterButton from './MapExport/MunicipioFilterButton';
import ShareButton from './ShareButton';
import Panel from '@components/Panel';
import FloatingIconButton from '@components/FloatingIconButton';
import ExportPreview from './MapExport/ExportPreview';
import { useShareDirtiness } from '@pages/maps/hooks/useShareDirtiness';
import { useMapsContext } from '@hooks/useMaps';
import { SIDER_EXPANDED_WIDTH } from '@constants/sider';

const COLLAPSE_KEY = 'mapalab.tools.collapsed';

const MapToolsPanel = () => {
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
    const { isDirty, loadedShareId } = useShareDirtiness();
    const inSyncWithShare = !!loadedShareId && !isDirty;
    const isModifiedFromShare = !!loadedShareId && isDirty;
    const [isCollapsed, setIsCollapsed] = useState(() => {
        try { return localStorage.getItem(COLLAPSE_KEY) === '1'; } catch { return false; }
    });

    useEffect(() => {
        try { localStorage.setItem(COLLAPSE_KEY, isCollapsed ? '1' : '0'); } catch { /* storage off */ }
    }, [isCollapsed]);

    const handleRevert = useCallback(() => {
        window.location.reload();
    }, []);

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
            <div className={`fixed top-4 right-4 z-11 ${isAnyPanelOpen ? 'max-md:z-60' : 'max-md:z-21'} flex flex-row items-center`}>
                {inSyncWithShare && (
                    <span
                        className="hidden md:inline-flex items-center text-[11px]/[16px] font-garet bg-[#DCFCE7] text-[#16A34A] border border-[#22C55E] px-3 py-2 rounded-full whitespace-nowrap shadow-[0_5px_20px_#1A26641A] pointer-events-none mr-2"
                        title={`Mapa cargado del enlace ${loadedShareId}`}
                    >
                        Usando link compartido: <span className="font-bold tabular-nums ml-1">{loadedShareId}</span>
                    </span>
                )}
                {isModifiedFromShare && (
                    <button
                        type="button"
                        onClick={handleRevert}
                        className="hidden md:inline-flex items-center text-[11px]/[16px] font-garet bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-400 px-3 py-2 rounded-full whitespace-nowrap shadow-[0_5px_20px_#1A26641A] cursor-pointer transition-colors mr-2"
                        title={`Volver al estado del enlace ${loadedShareId}`}
                    >
                        Regresar a: <span className="font-bold tabular-nums ml-1">{loadedShareId}</span>
                    </button>
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
                    width={'w-auto md:w-[373px]'}
                    flexDirection="flex-row items-center"
                    className="rounded-[10px] shadow-[0_5px_20px_#1A26641A]"
                    contentClassName="gap-2 px-4 py-3"
                    bg="bg-white"
                >
                    <Download 
                        onOpenPreview={handleOpenPreview} 
                        onOpenChange={setIsDownloadOpen} 
                        collapsed={isCollapsed} 
                    />
                    <MunicipioFilterButton 
                        municipioMode={municipioMode} 
                        onOpenChange={setIsMunicipioOpen} 
                        collapsed={isCollapsed} 
                    />
                    <ShareButton onOpenChange={setIsShareOpen} />
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
