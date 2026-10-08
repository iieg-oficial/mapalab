import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Badge from '@components/Badge';
import Loading from '@components/Loading';
import { useMapsContext } from '@hooks/useMaps';
import { useView3d } from '@contexts/View3dContext';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { useSider } from '@contexts/SiderContext';
import { canExtrudeLayer, grupoEnHexagonos } from '@pages/maps/helpers/view3d';

const STATUS_TEXT = {
    loading: 'Levantando la capa…',
    too_large: 'La capa tiene demasiados elementos para levantarla en 3D',
    error: 'No se pudo levantar la capa',
    no_value: 'La capa no tiene un campo numérico para levantar',
};

const tooltipFor = ({ active, on, status }) => {
    if (!active) return 'Ver en 3D y levantar la capa';
    if (on && STATUS_TEXT[status]) return STATUS_TEXT[status];
    return on ? 'Aplanar la capa' : 'Levantar la capa en 3D';
};

const ExtrudeButton = ({ layerId, baseClass }) => {
    const view3d = useView3d();
    const { allLayers, getServiceMode, getAllChildLayerIds, compareMode } = useMapsContext();
    const { isMobile } = useSider();
    if (!view3d.available || !layerId || (compareMode?.active && isMobile)) return null;
    const extruible = canExtrudeLayer(findLayerDef(layerId, allLayers || []), getServiceMode?.(layerId))
        || grupoEnHexagonos(getAllChildLayerIds?.(layerId), getServiceMode);
    if (!extruible) return null;

    const on = view3d.active && view3d.isExtruded(layerId);
    const status = view3d.extrusionStatus[layerId];
    const label = tooltipFor({ active: view3d.active, on, status });

    const handleClick = (event) => {
        event.stopPropagation();
        if (!view3d.active) {
            if (view3d.enter() && !view3d.isExtruded(layerId)) view3d.toggleExtrusion(layerId);
            return;
        }
        view3d.toggleExtrusion(layerId);
    };

    return (
        <Tooltip content={label}>
            <button
                type="button"
                className={`relative ${on ? 'p-1.5 rounded-full bg-[#5C2472] text-white border border-[#5C2472] cursor-pointer' : `${baseClass} text-[#465055] hover:border-[#70308A]`}`}
                onClick={handleClick}
                aria-pressed={on}
                aria-label={label}
            >
                {on && status === 'loading'
                    ? <Loading visible size="size-5" border="border-2" color="border-white" />
                    : <Icon name="cubo" className="size-5" />}
                <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 -right-3 text-[8px] px-1.5 pointer-events-none" />
            </button>
        </Tooltip>
    );
};

export default ExtrudeButton;
