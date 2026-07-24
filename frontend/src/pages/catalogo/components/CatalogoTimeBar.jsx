import { useEffect, useRef, useState } from 'react';
import { useOutsideClick } from '@hooks/useOutsideClick';
import Tooltip from '@components/Tooltip';
import PeriodicitySection from '@pages/maps/components/LayerDetailModal/components/PeriodicitySection';
import { describeDateFilter, formatLoopLabelLong } from '@pages/maps/helpers/dateLoopHelpers';
import icoPlayNormal from '@assets/icons/ico_play_normal.svg';
import icoPauseNormal from '@assets/icons/ico_pause_normal.svg';
import { PANEL_SHADOW } from '../helpers/catalogoStyles';

const SIN_FILTRO = 'Todas las fechas';

const CatalogoTimeBar = ({ tiempo, loop }) => {
    const [abierto, setAbierto] = useState(false);
    const containerRef = useRef(null);

    const { layerId, periodicidad, loading, isRaster, hasPeriodicidad, filtro, applyFilter, clearFilter, getSpecificFilter } = tiempo;
    const rasterPeriodicity = isRaster ? periodicidad : null;
    const {
        stopLoop, getLoopPrefs, setLoopIntervalMs, setLoopDirection,
        onToggleLoop, canPlay, isLoopPlaying, setExpandedYear,
    } = loop;

    useOutsideClick([containerRef], () => setAbierto(false));

    useEffect(() => {
        setAbierto(false);
    }, [layerId]);

    if (!hasPeriodicidad && !loading) return null;

    const prefs = getLoopPrefs?.(layerId);
    const etiqueta = formatLoopLabelLong(describeDateFilter({ filter: filtro, rasterPeriodicity })) || SIN_FILTRO;

    return (
        <div
            ref={containerRef}
            className="fixed top-24 md:top-4 left-1/2 -translate-x-1/2 z-20 w-[min(560px,calc(100vw-2rem))] md:w-[min(560px,calc(100vw-26rem))] flex flex-col items-center"
        >
            <div className={`flex items-center gap-1.5 p-1.5 bg-white rounded-full ${PANEL_SHADOW}`}>
                {canPlay && (
                    <Tooltip content={isLoopPlaying ? 'Pausar animación' : 'Ver animación'} placement="bottom" delay={200}>
                        <button
                            type="button"
                            onClick={onToggleLoop}
                            aria-label={isLoopPlaying ? 'Pausar animación' : 'Ver animación'}
                            className="size-7 shrink-0 rounded-full bg-[#FFF2E5] hover:bg-[#FFE4C4] flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <img src={isLoopPlaying ? icoPauseNormal : icoPlayNormal} alt="" className="size-3" />
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
                    <Tooltip content="Ver todas las fechas" placement="bottom" delay={200}>
                        <button
                            type="button"
                            onClick={() => { stopLoop?.(layerId); clearFilter(); }}
                            aria-label="Quitar el filtro de fecha"
                            className="size-7 shrink-0 rounded-full text-[#6E7477] hover:text-purple hover:bg-purple-soft flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </Tooltip>
                )}
            </div>

            {abierto && (
                <div className={`mt-2 w-full px-4 pb-1 bg-white rounded-xl ${PANEL_SHADOW} max-h-[60vh] overflow-y-auto`}>
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
                        singleSelectOnly={false}
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
                    />
                </div>
            )}
        </div>
    );
};

export default CatalogoTimeBar;
