import Loading from '@components/Loading';
import SimpleDateSelector from '@mapsComponents/LayerDetailModal/components/SimpleDateSelector';
import { useSeleccionUnicaDeFecha } from '@hooksMaps/useSeleccionUnicaDeFecha';

const detener = (e) => e.stopPropagation();

const LayerPeriodicityInline = ({ layerId, periodicidad, allLayers }) => {
    const lado = periodicidad.forSlot(null);
    const singleSelectOnly = useSeleccionUnicaDeFecha(layerId, allLayers, !!periodicidad.rasterPeriodicity);

    if (!periodicidad.hasPeriodicity) return null;

    return (
        <div className="w-full pt-1" role="presentation" onClick={detener} onKeyDown={detener}>
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
