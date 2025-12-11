import { useContext, useState, useMemo } from 'react';
import MapsContext from '@contexts/MapsContext';
import SymbologyItem from './SymbologyItem';
import { isParentLayer } from '../helpers/symbologyHelpers';
import { MOBILE_BREAKPOINT } from '@constants/sider';

const SymbologyPanel = () => {
    const { selectedLayerForSymbology, activeLayerIds, findLayerById, getLayersForSymbology } = useContext(MapsContext);
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
            <div className="w-12 h-12 rounded-xl shadow bg-white/80  shrink-0">
                <button
                    onClick={() => (hasLayer || isManuallyCollapsed) && handleExpand()}
                    className={`
                        p-3 w-full h-full flex items-center justify-center text-gray-600 
                        rounded-xl transition-colors relative
                        ${(hasLayer || isManuallyCollapsed) ? 'hover:bg-gray-100  cursor-pointer' : 'cursor-default opacity-50'}
                    `}
                    title={isManuallyCollapsed ? 'Expandir Panel de Simbología' : (hasLayer ? 'Expandir Panel de Simbología' : 'No hay capa seleccionada')}
                    disabled={!hasLayer && !isManuallyCollapsed}
                >
                    <span className="text-xl">🎨</span>

                    {hasLayer && (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            🗺️
                        </span>
                    )}
                    {isManuallyCollapsed && !hasLayer && (
                        <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            ➖
                        </span>
                    )}
                </button>
            </div>
        );
    }

    if (!hasLayer) {
        return null;
    }

    const fullLayer = findLayerById(selectedLayerForSymbology.id) || selectedLayerForSymbology;
    const displayLayers = getLayersForSymbology(fullLayer);

    return (
        <div className="w-64 px-4 py-3 rounded-xl shadow bg-white/80 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] shrink-0 flex flex-col">
            <div className="flex justify-between items-center mb-3 shrink-0">
                <h3 className="font-bold text-gray-900">
                    Simbología
                </h3>

                <div className="flex items-center gap-1">
                    <button
                        onClick={handleManualCollapse}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                        title="Colapsar panel"
                    >
                        ➖
                    </button>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] -mx-4">
                {displayLayers.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                        {isParentLayer(fullLayer) ? 'No hay sub-capas activas' : 'Sin simbología disponible'}
                    </div>
                ) : (
                    displayLayers.map((layer, index) => (
                        <SymbologyItem
                            key={layer._isProxy ? `proxy-${layer.id}` : layer.id}
                            layer={layer}
                            isExpanded={true}
                            onToggle={() => { }}
                            showDivider={index < displayLayers.length - 1}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default SymbologyPanel;
