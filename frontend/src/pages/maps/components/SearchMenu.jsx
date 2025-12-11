import { useState, useEffect } from 'react';
import { getSearchConfig } from '@services/searchConfig';
import { searchGlobal } from '@services/searchService';
import { useDebounce } from '@hooks/useDebounce';
import Divider from '@components/Divider';
import MenuItem from '@components/MenuItem';
import Icon from '@components/Icon';

const SearchMenu = ({ close, onToggleLayer, activeLayerIds = [] }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 500);
    const [selectedLayers, setSelectedLayers] = useState([]);

    const isLayerActive = (layerId) => {
        return activeLayerIds.includes(layerId);
    };

    const handleLayerClick = (layerId) => {
        const isActive = isLayerActive(layerId);
        onToggleLayer(layerId, !isActive);
    };

    useEffect(() => {
        const performSearch = async () => {
            if (debouncedQuery) {
                const results = await searchGlobal(debouncedQuery, {
                    includeLayerNames: true,
                    includeLayerData: false,
                    minScore: 10
                });

                const matches = results.layerMatches;

                if (matches.length > 0) {
                    const newLayerIds = matches.map(m => m.layerId);
                    setSelectedLayers(newLayerIds);
                }
            } else {
                setSelectedLayers([]);
            }
        };

        performSearch();
    }, [debouncedQuery]);


    return (
        <div className="py-2 min-w-[350px] max-w-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <div className="px-4 py-2">
                <label className="block text-xs font-medium mb-2 text-gray-600">
                    Palabra clave:
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Escribe aquí..."
                        className="w-full px-2 py-1.5 text-sm border rounded"
                    />
                </div>
            </div>



            {selectedLayers.length > 0 && (
                <div className="px-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-gray-600">
                            Resultados de búsqueda ({selectedLayers.length})
                        </p>
                    </div>
                    {selectedLayers.length > 20 && (
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-xs text-blue-800">
                                ℹ️ Se encontraron {selectedLayers.length} capas. Haz click en cualquiera para activarla.
                            </p>
                        </div>
                    )}
                    <div className="max-h-64 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] space-y-3">
                        {(() => {
                            const grouped = {};

                            selectedLayers.forEach(layerId => {
                                const config = getSearchConfig(layerId);
                                if (!config) return;

                                const temaLabel = config.temaLabel || 'Otros';
                                const subtemaLabel = config.subtemaLabel || 'General';
                                const groupKey = `${temaLabel}|||${subtemaLabel}`;

                                if (!grouped[groupKey]) {
                                    grouped[groupKey] = {
                                        temaLabel,
                                        subtemaLabel,
                                        layers: []
                                    };
                                }

                                grouped[groupKey].layers.push({
                                    id: layerId,
                                    label: config.label || layerId
                                });
                            });

                            return Object.entries(grouped).map(([groupKey, group]) => (
                                <div key={groupKey} className="space-y-1">
                                    <div className="text-xs text-gray-500 px-1">
                                        {group.temaLabel} / {group.subtemaLabel}
                                    </div>
                                    <div className="space-y-0.5">
                                        {group.layers.map(layer => {
                                            const isActive = isLayerActive(layer.id);
                                            return (
                                                <button
                                                    key={layer.id}
                                                    onClick={() => handleLayerClick(layer.id)}
                                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded transition-colors group cursor-pointer ${
                                                        isActive
                                                            ? 'bg-green-50 hover:bg-green-100'
                                                            : 'hover:bg-blue-50'
                                                    }`}
                                                >
                                                    <span className={`text-sm ${
                                                        isActive
                                                            ? 'text-green-700 font-medium'
                                                            : 'text-gray-900 group-hover:text-blue-700'
                                                    }`}>
                                                        {layer.label}
                                                    </span>
                                                    <Icon
                                                        name={isActive ? 'check' : 'plus'}
                                                        className={isActive
                                                            ? 'text-green-600'
                                                            : 'text-gray-400 group-hover:text-blue-600 transition-colors'
                                                        }
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchMenu;
