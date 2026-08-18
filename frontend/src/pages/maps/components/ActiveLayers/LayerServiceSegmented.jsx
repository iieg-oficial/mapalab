import { useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import Segmented from '@components/Segmented';
import Tooltip from '@components/Tooltip';
import Badge from '@components/Badge';
import Icon from '@components/Icon';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { SERVICE_WMS, SERVICE_HEXBIN, VECTOR_SERVICE_ENABLED, resolveVectorTargets } from '@pages/maps/helpers/serviceMode';

const OPTIONS = [
    { value: SERVICE_WMS, label: 'Puntos', icon: 'geom_point', tooltip: 'Ver los puntos' },
    { value: SERVICE_HEXBIN, label: 'Hexágonos', icon: 'geom_hexbin', tooltip: 'Agrupar en hexágonos' }
];

const rejectionMessage = (rejection) => {
    if (!rejection) return null;
    if (rejection.reason === 'too-large') {
        return `Tiene ${formatNumber(rejection.count)} elementos y el máximo son ${formatNumber(rejection.limit)}: se queda en Puntos. Filtra por fecha y vuelve a intentar.`;
    }
    return 'No se pudieron traer los datos: se queda en Puntos.';
};

const LayerServiceSegmented = ({ layer }) => {
    const {
        getServiceMode,
        setServiceMode,
        getVectorRejection,
        toggleHexbinFondo,
        tieneFondo,
        allLayers,
        activeLayerIds
    } = useMapsContext();

    const targetIds = useMemo(() => {
        const childIds = layer?.childIds?.length ? layer.childIds : [layer?.id].filter(Boolean);
        return resolveVectorTargets(childIds, allLayers, activeLayerIds, { pointsOnly: true });
    }, [layer, allLayers, activeLayerIds]);

    if (!VECTOR_SERVICE_ENABLED || targetIds.length === 0) return null;

    const layerName = layer?.name || 'esta capa';
    const message = rejectionMessage(getVectorRejection?.(targetIds[0]));
    const enHexagonos = getServiceMode?.(targetIds[0]) === SERVICE_HEXBIN;
    const conFondo = tieneFondo?.(targetIds[0]) !== false;

    const tooltip = (
        <div className="flex flex-col gap-0.5 leading-tight">
            <span className="font-semibold">{layerName}</span>
            <span className="text-[11px] opacity-80">
                Hexágonos agrupa los puntos en celdas y las colorea por cuántos caen en cada una.
            </span>
            {message && <span className="text-[11px]">{message}</span>}
        </div>
    );

    return (
        <div className="flex items-center gap-2">
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

            {enHexagonos && (
                <Tooltip content={conFondo ? 'Quitar el relleno y dejar solo el contorno' : 'Rellenar los hexágonos'}>
                    <button
                        type="button"
                        aria-pressed={!conFondo}
                        onClick={(e) => { e.stopPropagation(); toggleHexbinFondo?.(targetIds); }}
                        className={`
                            size-6 rounded-full inline-flex items-center justify-center shrink-0
                            border transition-colors cursor-pointer
                            ${conFondo ? 'border-transparent bg-[#EAEFFA] text-[#70308A]' : 'border-[#D6DEEF] text-[#9AA7B8]'}
                        `}
                    >
                        <Icon name="geom_hexbin" className="size-3.5" />
                    </button>
                </Tooltip>
            )}
        </div>
    );
};

export default LayerServiceSegmented;
