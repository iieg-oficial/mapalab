import Icon from '@components/Icon';
import Loading from '@components/Loading';
import Tooltip from '@components/Tooltip';
import SimpleDateSelector from '@mapsComponents/LayerDetailModal/components/SimpleDateSelector';
import { useSeleccionUnicaDeFecha } from '@hooksMaps/useSeleccionUnicaDeFecha';
import { RADIUS_ICON, toneButtonFor, toneTextClass } from '@pages/maps/helpers/periodicityTones';

const detener = (e) => e.stopPropagation();
const tono = toneButtonFor(null, false);
const BOTON = `flex items-center justify-center size-6 ${RADIUS_ICON} shrink-0 cursor-pointer ${tono.className}`;

export const PeriodicityRowActions = ({ hasFilter, onClear, abierto, onToggle }) => {
    const accion = (fn) => (e) => { e.stopPropagation(); fn(); };
    return (
        <>
            {hasFilter && (
                <Tooltip content="Quitar el filtro de fecha" delay={400}>
                    <button
                        type="button"
                        onClick={accion(onClear)}
                        aria-label="Quitar el filtro de fecha"
                        className={BOTON}
                    >
                        <Icon name="close" className="size-3.5 shrink-0" />
                    </button>
                </Tooltip>
            )}
            <Tooltip content={abierto ? 'Ocultar fechas' : 'Elegir fecha'} delay={400}>
                <button
                    type="button"
                    onClick={accion(onToggle)}
                    aria-label={abierto ? 'Ocultar fechas' : 'Elegir fecha'}
                    aria-expanded={abierto}
                    className={BOTON}
                >
                    <Icon name="chevron" className={`w-3 h-1.5 transition-transform duration-300 ${abierto ? 'rotate-180' : ''} ${toneTextClass(tono.tone)}`} />
                </button>
            </Tooltip>
        </>
    );
};

const LayerPeriodicityInline = ({ layerId, periodicidad, allLayers }) => {
    const lado = periodicidad.forSlot(null);
    const singleSelectOnly = useSeleccionUnicaDeFecha(layerId, allLayers, !!periodicidad.rasterPeriodicity);

    if (!periodicidad.hasPeriodicity) return null;

    return (
        <div className="w-full p-3 bg-white rounded-xl cursor-default" role="presentation" onClick={detener} onKeyDown={detener}>
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
                    monthsFill
                />
            )}
        </div>
    );
};

export default LayerPeriodicityInline;
