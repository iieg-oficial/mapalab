import { SortableList, SortableItem } from './SortableList';
import ActiveLayerItem from '@mapsComponents/ActiveLayerItem';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useLayerSorting } from '../hooks/useLayerSorting';

const ExpandedLayersView = ({
    unifiedLayers,
    isManuallyCollapsed,
    onManualCollapse,
    isInegiMode,
    onToggleBaseMode,
    activeLayerIds,
    onReorder,
}) => {
    const { handleDragEnd } = useLayerSorting(activeLayerIds, unifiedLayers, onReorder);

    return (
        <div className="w-64 px-4 py-3 rounded-xl shadow bg-white/80  max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] shrink-0">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Capas Activas</h3>
                <div className="flex items-center gap-2">
                    {unifiedLayers.length > 0 && (
                        <span className="text-xs text-gray-500">
                            {unifiedLayers.filter(item => item.visible).length}/{unifiedLayers.length}
                        </span>
                    )}

                    <Tooltip content={isInegiMode ? "Vista INEGI" : "Vista IIEG"}>
                        <button
                            onClick={onToggleBaseMode}
                            className={`transition-colors ${isInegiMode ? 'text-blue-600 hover:text-blue-800' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Icon name="map" className="w-4 h-4" />
                        </button>
                    </Tooltip>

                    <button
                        onClick={onManualCollapse}
                        className="text-gray-500 hover:text-gray-700  text-sm"
                        title="Colapsar panel"
                    >
                        ➖
                    </button>
                </div>
            </div>

            {unifiedLayers.length > 0 ? (
                <SortableList
                    items={unifiedLayers.map(l => l.id)}
                    onSortEnd={handleDragEnd}
                >
                    <div className="space-y-1">
                        {unifiedLayers.map((layer) => (
                            <SortableItem key={layer.id} id={layer.id}>
                                <ActiveLayerItem
                                    layer={layer}
                                />
                            </SortableItem>
                        ))}
                    </div>
                </SortableList>
            ) : (
                <div className="text-gray-500 text-sm italic text-center py-8">
                    No hay capas activas
                    {isManuallyCollapsed && (
                        <div className="text-xs text-gray-400 mt-2">
                            (Panel colapsado manualmente)
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ExpandedLayersView;