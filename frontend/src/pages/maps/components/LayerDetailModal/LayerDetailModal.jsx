import { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { trackLayerDetailOpen, trackLayerDownload, trackPeriodicityAdvanced } from '@services/analyticsService';
import { useLayerMetadata } from '../../hooks/useLayerMetadata';
import { useSider } from '@contexts/SiderContext';
import MapsContext from '@contexts/MapsContext';
import { findLayerDef, findWMSConfig } from '../../helpers/wmsConfig';
import { layers as allLayers } from '../../helpers/layers/index';
import { fetchGeometryType } from '../../../../utils/featureInfoUtils';
import { formatDateString } from '../../helpers/dateFilterHelpers';
import DateTreeSelector from './components/DateTreeSelector';
import SimpleDateSelector from './components/SimpleDateSelector';
import OpacityControl from './components/OpacityControl';
import InfoCard from './components/InfoCard';
import StatCard from './components/StatCard';
import LayerInfoSections from './components/LayerInfoSections';
import LayerThemeAvatar from './components/LayerThemeAvatar';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Logo from '@components/Logo';
import Loading from '@components/Loading';
import Message from '@components/Message';
import { downloadLayerBundle } from '@services/downloadService';

const LayerDetailModal = () => {
    const {
        selectedLayer, setSelectedLayer, applyFilter, clearFilter, getFilter, getSpecificFilter,
        getLayerOpacity, setLayerOpacity, activeLayerIds
    } = useContext(MapsContext);

    const layerDef = useMemo(() => {
        if (!selectedLayer?.id) return null;
        return findLayerDef(selectedLayer.id, allLayers);
    }, [selectedLayer?.id]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;
    const requireDateForDownload = layerDef?.requireDateForDownload || false;
    const hidePeriodicity = layerDef?.hidePeriodicity || false;
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const abortRef = useRef(null);
    const { metadata, loading } = useLayerMetadata(selectedLayer?.id);
    const { isMobile } = useSider();
    const [singleSelectOnly, setSingleSelectOnly] = useState(false);
    const [slowMetadata, setSlowMetadata] = useState(false);
    const slowTimerRef = useRef(null);

    useEffect(() => {
        if (loading) {
            slowTimerRef.current = setTimeout(() => setSlowMetadata(true), 5000);
        } else {
            setSlowMetadata(false);
        }
        return () => {
            if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
        };
    }, [loading]);

    useEffect(() => {
        if (!selectedLayer?.id || rasterPeriodicity) return;
        const wmsConfig = findWMSConfig(selectedLayer.id, allLayers);
        if (!wmsConfig) return;
        let cancelled = false;
        fetchGeometryType(wmsConfig.baseUrl, wmsConfig.layerName).then(type => {
            if (!cancelled) setSingleSelectOnly(type === 'polygon');
        });
        return () => { cancelled = true; };
    }, [selectedLayer?.id, rasterPeriodicity]);

    const COOLDOWN_MS = 5000;
    const storageKey = selectedLayer?.id ? `dl_cd_${selectedLayer.id}` : null;

    const [cooldownEnd, setCooldownEnd] = useState(() =>
        parseInt(sessionStorage.getItem(storageKey) || '0', 10)
    );
    const [cooldownRemaining, setCooldownRemaining] = useState(() =>
        Math.max(0, cooldownEnd - Date.now())
    );

    useEffect(() => {
        const stored = parseInt(sessionStorage.getItem(storageKey) || '0', 10);
        setCooldownEnd(stored);
    }, [storageKey]);

    useEffect(() => {
        const remaining = Math.max(0, cooldownEnd - Date.now());
        setCooldownRemaining(remaining);
        if (remaining <= 0) return;
        const interval = setInterval(() => {
            const r = Math.max(0, cooldownEnd - Date.now());
            setCooldownRemaining(r);
            if (r <= 0) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldownEnd]);

    const cooldown = cooldownRemaining > 0;
    const hasPeriodicity = !hidePeriodicity && (metadata?.periodicity != null || rasterPeriodicity != null);
    const hasDateFilter = !!getSpecificFilter(selectedLayer?.id, 'date');
    const downloadDisabled = cooldown || (requireDateForDownload && !hasDateFilter);

    const handleDownloadClick = useCallback(async () => {
        if (!selectedLayer?.id || downloading || downloadDisabled) return;
        const controller = new AbortController();
        abortRef.current = controller;
        setDownloading(true);
        const result = await downloadLayerBundle(selectedLayer.id, { activeLayerIds, getFilter, signal: controller.signal });
        abortRef.current = null;
        setDownloading(false);
        if (!result?.success) return;
        trackLayerDownload(selectedLayer.id);
        const end = Date.now() + COOLDOWN_MS;
        sessionStorage.setItem(storageKey, String(end));
        setCooldownEnd(end);
    }, [selectedLayer?.id, activeLayerIds, getFilter, downloading, downloadDisabled, storageKey]);

    const handleCancelDownload = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    const periodicityLongPressRef = useRef(null);

    const handlePeriodicityClick = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) {
            setIsAdvancedMode(prev => !prev);
        }
    }, []);

    const handlePeriodicityTouchStart = useCallback(() => {
        periodicityLongPressRef.current = setTimeout(() => {
            periodicityLongPressRef.current = 'fired';
            setIsAdvancedMode(prev => !prev);
        }, 1000);
    }, []);

    const handlePeriodicityTouchEnd = useCallback(() => {
        if (periodicityLongPressRef.current && periodicityLongPressRef.current !== 'fired') {
            clearTimeout(periodicityLongPressRef.current);
        }
        periodicityLongPressRef.current = null;
    }, []);

    const handleDateFilterApply = (filterData) => {
        if (selectedLayer && selectedLayer.id) {
            applyFilter(selectedLayer.id, filterData.filterName, filterData.cqlFilter);
        }
    };

    const handleClearFilter = () => {
        if (selectedLayer && selectedLayer.id) {
            clearFilter(selectedLayer.id, 'date');
        }
    };

    useEffect(() => {
        if (selectedLayer?.id) trackLayerDetailOpen(selectedLayer.id);
    }, [selectedLayer?.id]);

    useEffect(() => {
        if (isAdvancedMode && selectedLayer?.id) trackPeriodicityAdvanced(selectedLayer.id);
    }, [isAdvancedMode, selectedLayer?.id]);

    if (!selectedLayer) return null;


    return (
        <div className="fixed top-4 sm:top-4 bottom-0 right-0 sm:right-4 z-30 w-full sm:w-[643px] pointer-events-none">
            <div className={`
                h-full bg-white shadow-[0_5px_20px_#1A26641A] backdrop-blur-sm overflow-y-auto pointer-events-auto rounded-t-[20px] rounded-b-none
                scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400
            `}>
                <div className="sticky top-0 z-10 bg-white backdrop-blur-sm p-4 sm:px-6 sm:pt-6">
                    <div className="flex justify-between items-center">
                        <OpacityControl
                            value={getLayerOpacity(selectedLayer.id)}
                            onChange={(opacity) => setLayerOpacity(selectedLayer.id, opacity)}
                        />
                        <div className="flex items-center gap-2 md:gap-5">
                            {metadata?.capa_descargable !== false && (
                                downloading
                                    ? (
                                        <button onClick={handleCancelDownload} className="relative flex items-center justify-center gap-2 w-auto md:min-w-[180px] px-5 md:px-10 text-[14px]/[47px] text-white rounded-[30px] transition-colors h-12.5 font-bold font-garet bg-[#FF8300] hover:bg-[#E67500] hover:shadow-[0px_6px_6px_#FF830034] overflow-hidden" title="Cancelar descarga">
                                            <Loading visible size="size-25 md:size-50" border="border-1 md:border-3" color="border-current" className="absolute inset-1 !animate-[spin_3s_cubic-bezier(0.68,-0.55,0.27,1.55)_infinite]" />
                                            <span className="relative z-10"> {isMobile ? 'Cancelar' : 'Cancelar descarga'} </span>
                                        </button>
                                    )
                                    : (
                                        <Tooltip
                                            content={requireDateForDownload && !hasDateFilter ? 'Selecciona un año en periodicidad para descargar' : 'Descarga la tabla completa con metadatos en .ZIP'}
                                            variant={requireDateForDownload && !hasDateFilter ? 'default' : 'warning'}
                                        >
                                            <button onClick={handleDownloadClick} disabled={downloadDisabled} className="w-auto md:min-w-[180px] px-10 text-[14px]/[47px] text-white rounded-[30px] transition-colors h-12.5 font-bold font-garet disabled:opacity-60 disabled:cursor-not-allowed bg-[#703089] hover:bg-[#5C2472] hover:shadow-[0px_6px_6px_#5C247234]">
                                                {cooldown ? (isMobile ? <Icon name="download" /> : `Espera ${Math.ceil(cooldownRemaining / 1000)}s`) : (isMobile ? <Icon name="download" /> : 'Descargar capa')}
                                            </button>
                                        </Tooltip>
                                    )
                            )}
                            <Icon name="cerrarModal" aria-label="Cerrar" onClick={() => setSelectedLayer(null)} classNameBG="rounded-full hover:shadow-[0px_5px_20px_#101F3629]" className="cursor-pointer" />
                        </div>
                    </div>
                </div>

                <div className="px-4 pb-4 sm:px-6 sm:pb-6">
                    {loading ? (
                        <div className="flex flex-col items-center">
                            <Logo name="mapalab" size="size-36" className="mt-40 lg:mt-52" isLoading />
                            {slowMetadata && (
                                <Message
                                    variant="info"
                                    title="Esta acción está tomando tiempo"
                                    description="Estas capas contienen una mayor cantidad de datos por lo que podrían tardar más tiempo en cargarse."
                                    className="mt-6"
                                />
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3">
                                <LayerThemeAvatar name={metadata?.tema} size="md" />
                                <span className="text-[14px]/[47px] font-garet font-bold text-[#465055] tracking-normal">
                                    {metadata?.tema || 'General'}
                                </span>
                            </div>
                            <h3 className="text-[18px]/[47px] font-garet font-extrabold text-[#5C2472] tracking-normal">
                                {selectedLayer.name || 'Capa sin nombre'}
                            </h3>

                            {(metadata?.frecuencia_actualizacion || metadata?.fecha_ultima_actualizacion) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                    <InfoCard label="Frecuencia de actualización" value={metadata.frecuencia_actualizacion} />
                                    <InfoCard label="Última actualización" value={formatDateString(metadata.fecha_ultima_actualizacion)} />
                                </div>
                            )}

                            {metadata?.descripcion && (
                                <div className="mb-4">
                                    <p className="text-[14px]/[32px] text-left font-garet font-medium text-[#465055] tracking-normal">
                                        {metadata.descripcion}
                                    </p>
                                </div>
                            )}

                            {metadata?.numeralia?.filter(s => s.nombre || s.valor).length > 0 && (
                                <div className="mb-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {metadata.numeralia.filter(s => s.nombre || s.valor).map((stat, index) => (
                                            <StatCard key={index} label={stat.nombre} value={stat.valor} simbolo={stat.simbolo} />
                                        ))}
                                    </div>
                                    {metadata?.nombre_pie_numeralia && (
                                        <p className="text-[10px]/[11px] font-garet font-medium text-[#465055] tracking-normal mt-6">
                                            {metadata.nombre_pie_numeralia}
                                        </p>
                                    )}
                                </div>
                            )}

                            {hasPeriodicity && (
                                <div className="mb-4">
                                    <div className="flex items-center justify-between my-5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[14px]/[16px] font-garet font-bold text-[#5C2472] tracking-normal select-none cursor-pointer" onClick={handlePeriodicityClick} onTouchStart={handlePeriodicityTouchStart} onTouchEnd={handlePeriodicityTouchEnd} onTouchCancel={handlePeriodicityTouchEnd}>
                                                Periodicidad:
                                            </span>
                                            {isAdvancedMode && (
                                                <Icon
                                                    name="info_warning"
                                                    className="size-4 cursor-help"
                                                    tooltip="Click simple: navegar opciones. Doble click: seleccionar fecha. Click en seleccionado: deseleccionar."
                                                />
                                            )}
                                        </div>
                                    </div>
                                    {isAdvancedMode && !rasterPeriodicity ? (
                                        <DateTreeSelector layerId={selectedLayer.id} periodicity={metadata.periodicity} onFilterApply={handleDateFilterApply} onClearFilter={handleClearFilter} filterName="date" singleSelectOnly={singleSelectOnly} />
                                    ) : (
                                        <SimpleDateSelector layerId={selectedLayer.id} periodicity={metadata?.periodicity} rasterPeriodicity={rasterPeriodicity} onFilterApply={handleDateFilterApply} onClearFilter={handleClearFilter} filterName="date" singleSelectOnly={singleSelectOnly} />
                                    )}
                                </div>
                            )}


                            <LayerInfoSections metadata={metadata} layerName={selectedLayer.name} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LayerDetailModal;
