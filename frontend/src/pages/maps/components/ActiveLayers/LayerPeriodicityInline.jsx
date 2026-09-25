import Icon from '@components/Icon';
import Loading from '@components/Loading';
import Tooltip from '@components/Tooltip';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import SimpleDateSelector from '@mapsComponents/LayerDetailModal/components/SimpleDateSelector';
import { useSeleccionUnicaDeFecha } from '@hooksMaps/useSeleccionUnicaDeFecha';

const detener = (e) => e.stopPropagation();

const LayerPeriodicityInline = ({ layerId, periodicidad, allLayers, onClose }) => {
    const lado = periodicidad.forSlot(null);
    const singleSelectOnly = useSeleccionUnicaDeFecha(layerId, allLayers, !!periodicidad.rasterPeriodicity);

    if (!periodicidad.hasPeriodicity) return null;

    return (
        <div
            className="w-full px-3 pb-3 bg-white rounded-xl shadow-[0_5px_20px_#1A26641A] cursor-default"
            role="presentation"
            onClick={detener}
            onKeyDown={detener}
        >
            <div className="pt-2.5 pb-2 flex items-center gap-2">
                <h3 className="flex-1 font-garet font-bold text-[13px]/[16px] text-purple">Periodicidad</h3>
                {lado.hasFilter && (
                    <Tooltip content="Quitar el filtro de fecha" placement="left" delay={400}>
                        <button type="button" onClick={lado.clear} aria-label="Quitar el filtro de fecha" className="cursor-pointer">
                            <Icon name="eliminar" state="hover" className="size-5" />
                        </button>
                    </Tooltip>
                )}
                <MobileSheetCloseButton onClick={onClose} />
            </div>
            {periodicidad.loading ? (
                <div className="flex items-center gap-2 py-2">
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
                    singleSelectOnly={singleSelectOnly}
                    onExpandedYearChange={lado.onExpandedYearChange}
                />
            )}
        </div>
    );
};

export default LayerPeriodicityInline;
