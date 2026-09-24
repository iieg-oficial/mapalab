import { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import { useIsNonProd } from '@hooks/useDevTools';
import { useOutsideClick } from '@hooks/useOutsideClick';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';
import { DOCK_ID } from '@pages/maps/components/DockPills';
import PeriodicitySection from '@pages/maps/components/LayerDetailModal/components/PeriodicitySection';
import { describeDateFilter, formatDateFilterPill } from '@pages/maps/helpers/dateLoopHelpers';
import { RADIUS_ICON, toneButtonFor } from '@pages/maps/helpers/periodicityTones';
import { PANEL_SHADOW } from '../helpers/catalogoStyles';
import { useCatalogoTiempoContext } from '../hooks/catalogoTiempoContext';
import CatalogoMunicipioPill, { CERRAR_DEBAJO } from './CatalogoMunicipioPill';

const SIN_FILTRO = 'Todas las fechas';

const CatalogoTimeBar = ({ tiempo, loop }) => {
    const [abierto, setAbierto] = useState(false);
    const containerRef = useRef(null);
    const isMobile = useIsMobile();
    const isNonProd = useIsNonProd();
    const { municipio } = useCatalogoTiempoContext();

    const { layerId, periodicidad, loading, isRaster, geometria, hasPeriodicidad, filtro, applyFilter, clearFilter, getSpecificFilter } = tiempo;
    const rasterPeriodicity = isRaster ? periodicidad : null;
    const {
        stopLoop, getLoopPrefs, setLoopIntervalMs, setLoopDirection,
        onToggleLoop, canPlay, isLoopPlaying, setExpandedYear,
    } = loop;

    useOutsideClick([containerRef], () => setAbierto(false));

    useEffect(() => {
        setAbierto(false);
    }, [layerId]);

    useEffect(() => {
        if (!abierto) setExpandedYear?.(null);
    }, [abierto, setExpandedYear]);

    useEffect(() => () => setExpandedYear?.(null), [setExpandedYear]);

    const conFechas = hasPeriodicidad || loading;
    const conMunicipio = isNonProd && municipio.disponible;

    const prefs = getLoopPrefs?.(layerId);
    const etiqueta = formatDateFilterPill(describeDateFilter({ filter: filtro, rasterPeriodicity })) || SIN_FILTRO;
    const play = toneButtonFor(null, isLoopPlaying);

    const botonCerrar = (
        <Tooltip content="Cerrar el panel de fechas" placement={isMobile ? 'left' : 'bottom'} delay={200}>
            <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar el panel de fechas"
                className={`size-7 shrink-0 ${RADIUS_ICON} text-[#6E7477] hover:text-purple hover:bg-purple-soft flex items-center justify-center transition-colors cursor-pointer`}
            >
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                </svg>
            </button>
        </Tooltip>
    );

    return (
        <div
            ref={containerRef}
            className="fixed top-17 left-26 md:top-4 md:left-1/2 md:-translate-x-1/2 z-20 w-auto md:w-[min(560px,calc(100vw-26rem))] flex flex-col items-start md:items-center"
        >
            <div className="flex items-center gap-2">
                <div id={DOCK_ID} data-cerrar-abajo="" className="contents" />
                {conFechas && (
                    <div className={`group relative flex items-center gap-1.5 h-10 px-1.5 bg-white rounded-full ${PANEL_SHADOW}`}>
                        {canPlay && (
                            <Tooltip content={isLoopPlaying ? 'Pausar animación' : 'Ver animación'} placement="bottom" delay={200}>
                                <button
                                    type="button"
                                    onClick={onToggleLoop}
                                    aria-label={isLoopPlaying ? 'Pausar animación' : 'Ver animación'}
                                    className={`size-7 shrink-0 ${RADIUS_ICON} flex items-center justify-center cursor-pointer ${play.className}`}
                                >
                                    <Icon name={isLoopPlaying ? 'pause' : 'play'} className="size-3 shrink-0" />
                                </button>
                            </Tooltip>
                        )}

                        <button
                            type="button"
                            onClick={() => setAbierto((v) => !v)}
                            aria-expanded={abierto}
                            className={`px-3 py-1 rounded-full text-[12px] font-garet font-bold tabular-nums transition-colors cursor-pointer ${abierto
                                ? 'bg-purple-deep text-white'
                                : 'text-purple hover:bg-purple-soft'} ${isLoopPlaying ? 'animate-pulse' : ''}`}
                        >
                            {loading ? 'Cargando fechas…' : etiqueta}
                        </button>

                        {filtro && !abierto && (
                            <PillCloseButton
                                onClick={() => { stopLoop?.(layerId); clearFilter(); }}
                                tooltip="Quitar el filtro de fecha"
                                ariaLabel="Quitar el filtro de fecha"
                                placement="bottom"
                                className={CERRAR_DEBAJO}
                            />
                        )}

                    </div>
                )}
                {conMunicipio && <CatalogoMunicipioPill municipio={municipio.municipio} />}
            </div>

            {abierto && (
                <div className={`mt-2 -ml-22 w-[calc(100vw-2rem)] md:ml-0 md:w-full bg-white rounded-xl ${PANEL_SHADOW} max-h-[60vh] overflow-y-auto`}>
                    <div className="px-4 pb-1">
                        <PeriodicitySection
                            layerId={layerId}
                            periodicity={isRaster ? null : periodicidad}
                            rasterPeriodicity={rasterPeriodicity}
                            periodicityLoading={loading}
                            isAdvancedMode={false}
                            onFilterApply={(filterData) => applyFilter(layerId, filterData.filterName, filterData.cqlFilter)}
                            onClearFilter={clearFilter}
                            onClearDateFilter={() => { stopLoop?.(layerId); clearFilter(); }}
                            onExpandedYearChange={setExpandedYear}
                            singleSelectOnly={geometria === 'polygon'}
                            hasDateFilter={!!filtro}
                            showLoopControls
                            canPlay={canPlay}
                            isLoopPlaying={isLoopPlaying}
                            layerIntervalMs={prefs?.intervalMs}
                            layerDirection={prefs?.direction}
                            onSetLoopIntervalMs={(ms) => setLoopIntervalMs(layerId, ms)}
                            onSetLoopDirection={(dir) => setLoopDirection(layerId, dir)}
                            onTogglePeriodicityLoop={onToggleLoop}
                            getSpecificFilterOverride={getSpecificFilter}
                            trailingAction={isMobile ? null : botonCerrar}
                            titleAction={isMobile ? botonCerrar : null}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CatalogoTimeBar;
