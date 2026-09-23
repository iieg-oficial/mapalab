import Tooltip from '@components/Tooltip';
import PeriodicitySection from '@mapsComponents/LayerDetailModal/components/PeriodicitySection';
import { useSlotPeriodicity } from '@hooksMaps/useSlotPeriodicity';
import { SLOT_COLORS } from '@pages/maps/helpers/swipeTheme';
import { RADIUS_ICON } from '@pages/maps/helpers/periodicityTones';

const PanelPeriodicidad = ({ layerId, slot, onClose }) => {
    const periodicidad = useSlotPeriodicity(layerId);
    const lado = periodicidad.forSlot(slot);

    if (!layerId || !periodicidad.hasPeriodicity) return null;

    const botonCerrar = (
        <Tooltip content="Cerrar el panel de fechas" placement="bottom" delay={200}>
            <button
                type="button"
                onClick={onClose}
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
            className={`absolute bottom-full mb-2 w-[min(430px,calc(100vw-2rem))] max-h-[60vh] overflow-y-auto bg-white rounded-xl shadow-[0_5px_20px_#1A26641A] border-t-[3px] ${slot === 'B' ? 'left-1/2 ml-10' : 'right-1/2 mr-10'}`}
            style={{ borderTopColor: SLOT_COLORS[slot].fg }}
        >
            <div className="px-4 pb-1">
                <PeriodicitySection
                    layerId={layerId}
                    slot={slot}
                    label={`del lado ${slot}`}
                    periodicity={periodicidad.rasterPeriodicity ? null : periodicidad.periodicity}
                    rasterPeriodicity={periodicidad.rasterPeriodicity}
                    periodicityLoading={periodicidad.loading}
                    isAdvancedMode={false}
                    onFilterApply={lado.apply}
                    onClearFilter={lado.clear}
                    onClearDateFilter={lado.clear}
                    onExpandedYearChange={periodicidad.setExpandedYear}
                    singleSelectOnly={false}
                    hasDateFilter={lado.hasFilter}
                    showLoopControls
                    canPlay={periodicidad.canPlay}
                    isLoopPlaying={lado.isPlaying}
                    layerIntervalMs={periodicidad.intervalMs}
                    layerDirection={periodicidad.direction}
                    onSetLoopIntervalMs={periodicidad.setLoopIntervalMs}
                    onSetLoopDirection={periodicidad.setLoopDirection}
                    onTogglePeriodicityLoop={lado.toggleLoop}
                    getSpecificFilterOverride={lado.getFilter}
                    loopDisabled={lado.loopDisabled}
                    loopDisabledHint={lado.loopDisabledHint}
                    loopAppliesToSlot={lado.isPlaying}
                    trailingAction={botonCerrar}
                />
            </div>
        </div>
    );
};

export default PanelPeriodicidad;
