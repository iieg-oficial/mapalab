import { useMapsContext } from '@hooks/useMaps';
import Segmented from '@components/Segmented';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { SERVICE_WMS, SERVICE_VECTOR, VECTOR_SERVICE_ENABLED, canUseVectorService } from '@pages/maps/helpers/serviceMode';

const OPTIONS = [
    { value: SERVICE_WMS, label: 'Mapa', tooltip: 'Imagen dibujada por el servidor (WMS), con la simbología oficial' },
    { value: SERVICE_VECTOR, label: 'Datos', tooltip: 'Geometrías traídas al navegador (WFS): la selección es inmediata y la simbología es genérica' }
];

const rejectionMessage = (rejection) => {
    if (!rejection) return null;
    if (rejection.reason === 'too-large') {
        return `Esta capa tiene ${formatNumber(rejection.count)} elementos y el máximo son ${formatNumber(rejection.limit)}. Se queda en modo mapa.`;
    }
    return 'No se pudieron traer los datos de esta capa. Se queda en modo mapa.';
};

const LayerServiceSegmented = ({ layerDef }) => {
    const { getServiceMode, setServiceMode, getVectorRejection } = useMapsContext();

    if (!VECTOR_SERVICE_ENABLED || !canUseVectorService(layerDef)) return null;

    const message = rejectionMessage(getVectorRejection?.(layerDef.id));

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-garet text-[#6E7477]">Servicio</span>
                <Segmented
                    ariaLabel="Tipo de servicio de la capa"
                    options={OPTIONS}
                    value={getServiceMode?.(layerDef.id) ?? SERVICE_WMS}
                    onChange={(mode) => setServiceMode?.(layerDef.id, mode)}
                />
            </div>
            {message && (
                <span className="text-[11px] font-garet text-[#9E5200] leading-tight">{message}</span>
            )}
        </div>
    );
};

export default LayerServiceSegmented;
