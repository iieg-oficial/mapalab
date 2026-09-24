import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Loading from '@components/Loading';
import SimpleDateSelector from '@mapsComponents/LayerDetailModal/components/SimpleDateSelector';
import { PlayPauseButton, LoopIntervalButton, LoopDirectionButton } from '@mapsComponents/LayerDetailModal/components/SimpleDateSelectorParts';
import { useSlotPeriodicity } from '@hooksMaps/useSlotPeriodicity';
import { slotLabel } from '@pages/maps/helpers/swipeTheme';

const PanelPeriodicidad = ({ layerId, slot, onClose }) => {
    const periodicidad = useSlotPeriodicity(layerId);
    const lado = periodicidad.forSlot(slot);

    if (!layerId || !periodicidad.hasPeriodicity) return null;

    return (
        <div
            className={`absolute bottom-full mb-2 w-[min(430px,calc(100vw-2rem))] max-h-[60vh] overflow-y-auto px-4 pb-4 rounded-xl bg-white shadow-[0_5px_20px_#1A26641A] ${slot === 'B' ? 'left-1/2 ml-10' : 'right-1/2 mr-10'}`}
        >
            <div className="sticky top-0 bg-white pt-3 pb-2 flex items-center gap-2">
                <h3 className="flex-1 font-garet font-bold text-[15px]/[18px] text-purple">
                    Periodicidad del lado {slotLabel(slot)}
                </h3>
                {lado.hasFilter && (
                    <Tooltip content="Quitar el filtro de fecha de este lado" placement="left" delay={400}>
                        <button
                            type="button"
                            onClick={lado.clear}
                            aria-label="Quitar el filtro de fecha de este lado"
                            className="cursor-pointer"
                        >
                            <Icon name="eliminar" state="hover" className="size-5" />
                        </button>
                    </Tooltip>
                )}
                <Tooltip content="Cerrar el panel de fechas" placement="left" delay={400}>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar el panel de fechas"
                        className="text-gray-500 hover:text-gray-800 cursor-pointer"
                    >
                        <Icon name="close" />
                    </button>
                </Tooltip>
            </div>

            {lado.canPlay && (
                <div className="flex items-center gap-2 pb-3">
                    <LoopIntervalButton
                        value={periodicidad.intervalMs}
                        onChange={periodicidad.setLoopIntervalMs}
                        slot={slot}
                        disabled={lado.loopDisabled}
                    />
                    <LoopDirectionButton
                        value={periodicidad.direction}
                        onChange={periodicidad.setLoopDirection}
                        slot={slot}
                        disabled={lado.loopDisabled}
                    />
                    <PlayPauseButton
                        isPlaying={lado.isPlaying}
                        onToggle={lado.toggleLoop}
                        slot={slot}
                        disabled={lado.loopDisabled}
                        disabledHint={lado.loopDisabledHint}
                    />
                </div>
            )}

            {periodicidad.loading ? (
                <div className="flex items-center gap-2 py-4">
                    <Loading visible size="size-5" border="border-2" color="border-[#703089]" />
                    <span className="text-[12px] font-garet text-[#465055]">Cargando periodicidad...</span>
                </div>
            ) : (
                <SimpleDateSelector
                    layerId={layerId}
                    periodicity={periodicidad.rasterPeriodicity ? null : periodicidad.periodicity}
                    rasterPeriodicity={periodicidad.rasterPeriodicity}
                    onFilterApply={lado.apply}
                    onClearFilter={lado.clear}
                    filterName="date"
                    singleSelectOnly={false}
                    onExpandedYearChange={lado.onExpandedYearChange}
                    getSpecificFilterOverride={lado.getFilter}
                    slot={slot}
                />
            )}
        </div>
    );
};

export default PanelPeriodicidad;
