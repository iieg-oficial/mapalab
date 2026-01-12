import { useContext, useState } from 'react';
import { isParentLayer } from '../helpers/symbologyHelpers';
import { MOBILE_BREAKPOINT } from '@constants/sider';
import { HIDDEN_SCROLLBAR } from '../../../constants/global';
import MapsContext from '@contexts/MapsContext';
import SymbologyItem from './SymbologyItem';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';

const SymbologyPanel = () => {
    const { selectedLayerForSymbology, findLayerById, getLayersForSymbology } = useContext(MapsContext);
    const [isManuallyCollapsed, setIsManuallyCollapsed] = useState(() => window.innerWidth < MOBILE_BREAKPOINT);

    const hasLayer = !!selectedLayerForSymbology;
    const isCollapsed = isManuallyCollapsed || !hasLayer;

    const handleManualCollapse = () => {
        setIsManuallyCollapsed(true);
    };

    const handleExpand = () => {
        setIsManuallyCollapsed(false);
    };

    if (isCollapsed) {
        return (
            <div className="w-auto flex items-center justify-end">
                <Tooltip content={hasLayer ? 'Expandir Panel de Simbología' : 'Selecciona una capa para ver sus simbologías'} placement="left">
                    <button
                        onClick={() => (hasLayer || isManuallyCollapsed) && handleExpand()}
                        className={`
                            size-12.5 flex items-center justify-center bg-[#EAEFFA] rounded-full transition-colors
                            ${(hasLayer || isManuallyCollapsed)
                                ? 'hover:bg-[#F2EBFF] hover:border-[#5C2472] hover:border cursor-pointer'
                                : 'cursor-default opacity-50'
                            }
                        `}
                        disabled={!hasLayer && !isManuallyCollapsed}
                    >
                        <Icon name="simbologia" className="size-10" />
                    </button>
                </Tooltip>
            </div>
        );
    }

    if (!hasLayer) {
        return null;
    }

    const fullLayer = findLayerById(selectedLayerForSymbology.id) || selectedLayerForSymbology;
    const displayLayers = getLayersForSymbology(fullLayer);

    return (
        <div className="w-auto px-4.5 pb-6 pt-5 rounded-[10px] bg-[#F9FBFF] max-h-[40vh] flex flex-col">
            <div className="flex justify-between items-center mb-2 shrink-0">
                <div className="flex items-center gap-3">
                    <Icon name="simbologia" className="size-8" />
                    <h3 className="font-garet font-bold text-[18px]/[47px]">Simbología</h3>
                </div>

                <div className="flex items-center gap-1">
                    <button onClick={handleManualCollapse} className="cursor-pointer">
                        <Icon name="zoomout" className="size-6" tooltip="Colapsar simbologías" />
                    </button>
                </div>
            </div>

            <div className={`flex-1 min-h-0 overflow-y-auto ${HIDDEN_SCROLLBAR} rounded-[7px] bg-white px-3.5 py-3`}>
                {displayLayers.length === 0 ? (
                    <div className="rounded-[7px] py-2">
                        {isParentLayer(fullLayer) ? 'No hay sub-capas activas' : 'Sin simbología disponible'}
                    </div>
                ) : (
                    displayLayers.map((layer, _index) => (
                        <SymbologyItem
                            key={layer._isProxy ? `proxy-${layer.id}` : layer.id}
                            layer={layer}
                            isExpanded={true}
                            onToggle={() => { }}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default SymbologyPanel;
