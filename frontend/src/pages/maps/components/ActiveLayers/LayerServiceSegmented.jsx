import { useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import Segmented from '@components/Segmented';
import Tooltip from '@components/Tooltip';
import Badge from '@components/Badge';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { SERVICE_WMS, SERVICE_HEXBIN, VECTOR_SERVICE_ENABLED, resolveVectorTargets } from '@pages/maps/helpers/serviceMode';

const OPTIONS = [
    { value: SERVICE_WMS, label: 'Puntos' },
    { value: SERVICE_HEXBIN, label: 'Hexágonos' }
];

const rejectionMessage = (rejection) => {
    if (!rejection) return null;
    if (rejection.reason === 'too-large') {
        return `Tiene ${formatNumber(rejection.count)} elementos y el máximo son ${formatNumber(rejection.limit)}: se queda en Puntos. Filtra por fecha y vuelve a intentar.`;
    }
    return 'No se pudieron traer los datos: se queda en Puntos.';
};

const LayerServiceSegmented = () => {
    const {
        selectedLayerForSymbology,
        getAllChildLayerIds,
        getServiceMode,
        setServiceMode,
        getVectorRejection,
        allLayers,
        activeLayerIds
    } = useMapsContext();

    const targetIds = useMemo(() => {
        const selectedId = selectedLayerForSymbology?.id;
        if (!selectedId) return [];
        const childIds = [selectedId, ...(getAllChildLayerIds?.(selectedId) || [])];
        return resolveVectorTargets(childIds, allLayers, activeLayerIds, { pointsOnly: true });
    }, [selectedLayerForSymbology, getAllChildLayerIds, allLayers, activeLayerIds]);

    if (!VECTOR_SERVICE_ENABLED || targetIds.length === 0) return null;

    const layerName = selectedLayerForSymbology?.name || selectedLayerForSymbology?.label || 'la capa seleccionada';
    const message = rejectionMessage(getVectorRejection?.(targetIds[0]));

    const tooltip = (
        <div className="flex flex-col gap-0.5 leading-tight">
            <span className="font-semibold">Solo aplica a «{layerName}»</span>
            <span className="text-[11px] opacity-80">
                Hexágonos agrupa los puntos en celdas y las colorea por cuántos cae en cada una.
            </span>
            {message && <span className="text-[11px]">{message}</span>}
        </div>
    );

    return (
        <Tooltip content={tooltip} variant={message ? 'warning' : undefined} placement="bottom">
            <span className="relative inline-flex">
                <Segmented
                    compact
                    ariaLabel={`Forma de ver ${layerName}`}
                    options={OPTIONS}
                    value={getServiceMode?.(targetIds[0]) ?? SERVICE_WMS}
                    onChange={(mode) => targetIds.forEach(id => setServiceMode?.(id, mode))}
                />
                <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 -right-2 text-[8px] px-1.5" />
            </span>
        </Tooltip>
    );
};

export default LayerServiceSegmented;
