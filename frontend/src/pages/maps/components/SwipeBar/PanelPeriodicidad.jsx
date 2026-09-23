import Icon from '@components/Icon';
import ActionIconButton from '@components/ActionIconButton';
import PeriodicitySection from '@mapsComponents/LayerDetailModal/components/PeriodicitySection';
import { useSlotPeriodicity } from '@hooksMaps/useSlotPeriodicity';
import { slotLabel } from '@pages/maps/helpers/swipeTheme';

const PanelPeriodicidad = ({ layerId, slot, onClose }) => {
    const periodicidad = useSlotPeriodicity(layerId);
    const lado = periodicidad.forSlot(slot);

    if (!layerId || !periodicidad.hasPeriodicity) return null;

    return (
        <div
            className={`absolute bottom-full mb-2 w-[min(430px,calc(100vw-2rem))] max-h-[60vh] overflow-y-auto bg-white rounded-xl shadow-[0_5px_20px_#1A26641A] ${slot === 'B' ? 'left-1/2 ml-10' : 'right-1/2 mr-10'}`}
        >
            <div className="absolute top-2 right-2 z-[1] flex items-center gap-1">
                {lado.hasFilter && (
                    <ActionIconButton
                        onClick={lado.clear}
                        titulo="Quitar el filtro de fecha de este lado"
                        etiqueta="Quitar el filtro de fecha de este lado"
                        tamano="sm"
                    >
                        <Icon name="eliminar" state="hover" className="size-4" />
                    </ActionIconButton>
                )}
                <ActionIconButton
                    onClick={onClose}
                    titulo="Cerrar el panel de fechas"
                    etiqueta="Cerrar el panel de fechas"
                    tamano="sm"
                >
                    <Icon name="close" className="size-3.5" />
                </ActionIconButton>
            </div>

            <div className="px-4 pb-1">
                <PeriodicitySection
                    layerId={layerId}
                    slot={slot}
                    label={`del lado ${slotLabel(slot)}`}
                    periodicity={periodicidad.rasterPeriodicity ? null : periodicidad.periodicity}
                    rasterPeriodicity={periodicidad.rasterPeriodicity}
                    periodicityLoading={periodicidad.loading}
                    isAdvancedMode={false}
                    onFilterApply={lado.apply}
                    onClearFilter={lado.clear}
                    onClearDateFilter={lado.clear}
                    onExpandedYearChange={lado.onExpandedYearChange}
                    singleSelectOnly={false}
                    hasDateFilter={false}
                    showLoopControls
                    canPlay={lado.canPlay}
                    isLoopPlaying={lado.isPlaying}
                    layerIntervalMs={periodicidad.intervalMs}
                    layerDirection={periodicidad.direction}
                    onSetLoopIntervalMs={periodicidad.setLoopIntervalMs}
                    onSetLoopDirection={periodicidad.setLoopDirection}
                    onTogglePeriodicityLoop={lado.toggleLoop}
                    getSpecificFilterOverride={lado.getFilter}
                    loopDisabled={lado.loopDisabled}
                    loopDisabledHint={lado.loopDisabledHint}
                />
            </div>
        </div>
    );
};

export default PanelPeriodicidad;
