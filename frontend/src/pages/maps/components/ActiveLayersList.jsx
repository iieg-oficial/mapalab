import { useContext, useCallback } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useActiveLayersLogic } from '../hooks/useActiveLayersLogic';
import { useLayerCollapse } from '../hooks/useLayerCollapse';
import { useLayerSorting } from '../hooks/useLayerSorting';
import { SortableList, SortableItem } from './SortableList';
import ActiveLayerItem from '@mapsComponents/ActiveLayerItem';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Badge from '@components/Badge';
import { HIDDEN_SCROLLBAR } from '@constants/global';

const ActiveLayersList = () => {
    const {
        activeLayerIds,
        onToggleLayer,
        reorderActiveLayerIds,
        hiddenLayerIds
    } = useContext(MapsContext);

    const { unifiedLayers } = useActiveLayersLogic(activeLayerIds, hiddenLayerIds);
    const collapse = useLayerCollapse(unifiedLayers);
    const { handleDragEnd } = useLayerSorting(activeLayerIds, unifiedLayers, reorderActiveLayerIds);
    const isInegiMode = activeLayerIds.some(id => ['limite_inegi', 'limite_municipal_inegi'].includes(id));

    const handleToggleBaseMode = useCallback(() => {
        if (isInegiMode) {
            ['limite_inegi', 'limite_municipal_inegi'].forEach(id => onToggleLayer(id, false));
            ['regiones', 'limite_municipal', 'limite_iieg'].forEach(id => onToggleLayer(id, true));
        } else {
            ['limite_iieg', 'limite_municipal', 'regiones'].forEach(id => onToggleLayer(id, false));
            ['limite_municipal_inegi', 'limite_inegi'].forEach(id => onToggleLayer(id, true));
        }
    }, [isInegiMode, onToggleLayer]);

    if (collapse.isCollapsed) {
        return (
            <div className={`w-auto h-15 flex items-center justify-end`}>
                <Tooltip content={unifiedLayers.length > 0 ? 'Expandir capas activas' : 'No hay capas activas'}>
                    <button
                        onClick={() => (unifiedLayers.length > 0 || collapse.isManuallyCollapsed) && collapse.handleExpand()}
                        className={`
                            size-12.5 flex items-center justify-center bg-[#EAEFFA] rounded-full transition-colors relative
                            ${(unifiedLayers.length > 0 || collapse.isManuallyCollapsed) 
                                ? 'hover:bg-[#F2EBFF] hover:border-[#5C2472] hover:border cursor-pointer' 
                                : 'cursor-default opacity-50'
                            }
                        `}
                        disabled={unifiedLayers.length === 0 && !collapse.isManuallyCollapsed}
                    >
                        <Icon name="capa_activa" className="size-10" />
                        <Badge visible={unifiedLayers.length > 0} count={unifiedLayers.length} className="absolute -top-1 -left-1" />
                    </button>
                </Tooltip>
            </div>
        );
    }

    return (
        <div className={`w-auto px-6.5 pb-6 pt-2 rounded-[10px] bg-[#F9FBFF] max-h-[585px] ${HIDDEN_SCROLLBAR}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Icon name="capa_activa" className="size-8" />
                    <h3 className="font-garet font-bold text-[18px]/[47px]">Capas Activas</h3>
                </div>

                <div className="flex items-center gap-2">
                    <Tooltip content={isInegiMode ? "Vista INEGI" : "Vista IIEG"}>
                        <button onClick={handleToggleBaseMode} className="cursor-pointer">
                            <Icon name="basemaps" state={isInegiMode ? 'normal' : 'hover'} className="size-6" />
                        </button>
                    </Tooltip>

                    <Tooltip content="Colapsar capas activas">
                        <button onClick={collapse.handleManualCollapse} className="cursor-pointer">
                            <Icon name="zoomout" className="size-6" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            <SortableList
                items={unifiedLayers.map(l => l.id)}
                onSortEnd={handleDragEnd}
            >
                <div className="space-y-1">
                    {unifiedLayers.map((layer) => (
                        <SortableItem key={layer.id} id={layer.id}>
                            <ActiveLayerItem layer={layer} />
                        </SortableItem>
                    ))}
                </div>
            </SortableList>
        </div>
    );
};

export default ActiveLayersList;
