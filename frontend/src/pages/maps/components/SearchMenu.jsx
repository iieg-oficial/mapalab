import { useState, useEffect, useRef } from 'react';
import { getSearchConfig } from '@services/searchConfig';
import { searchGlobal } from '@services/searchService';
import { trackLayerSearch } from '@services/analyticsService';
import { useDebounce } from '@hooks/useDebounce';
import { useSearch } from '@contexts/SearchContext';
import Icon from '@components/Icon';
import Loading from '@components/Loading';
import ScrollContainer from '@components/ScrollContainer';
import { HIDDEN_SCROLLBAR } from '@constants/global';

const SearchMenu = ({ onToggleLayer, activeLayerIds = [], closeButton }) => {
    const { initialSearchQuery, consumeInitialQuery } = useSearch();
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 500);
    const [selectedLayers, setSelectedLayers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!initializedRef.current && initialSearchQuery) {
            initializedRef.current = true;
            setSearchQuery(initialSearchQuery);
            consumeInitialQuery();
        }
    }, [initialSearchQuery, consumeInitialQuery]);

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
                setIsLoading(true);
                const results = await searchGlobal(debouncedQuery, {
                    includeLayerNames: true,
                    includeLayerData: false,
                    minScore: 10
                });

                const matches = results.layerMatches;

                if (matches.length > 0) {
                    const newLayerIds = matches.map(m => m.layerId);
                    setSelectedLayers(newLayerIds);
                    trackLayerSearch(debouncedQuery);
                } else {
                    setSelectedLayers([]);
                }
                setIsLoading(false);
            } else {
                setSelectedLayers([]);
                setIsLoading(false);
            }
        };

        performSearch();
    }, [debouncedQuery]);


    return (
        <div className={`pt-6 ${selectedLayers.length > 0 ? 'pb-2' : 'pb-6'} px-4 w-full ${HIDDEN_SCROLLBAR}`}>
            <div className="flex items-center justify-between">
                <label className="block text-[18px]/[47px] font-garet font-bold mb-2 text-[#5C2472] tracking-normal">
                    Buscador
                </label>
                {closeButton}
            </div>
            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="¿Qué quieres buscar?"
                    className="
                        w-full py-4 pl-4 border-none bg-[#EAEFFA] rounded-[8px]
                        text-[13px]/[19px] text-[#5C2472] font-garet font-normal tracking-normal
                        placeholder:text-[#191919] placeholder:font-garet placeholder:font-normal placeholder:text-[13px]/[19px]
                        focus:outline-[#5C2472] transition-colors
                    "
                />
                <button
                    className="
                        absolute right-0 top-1/2 -translate-y-1/2 h-full w-[51px]
                        bg-[#703088] rounded-r-[8px] flex items-center justify-center
                    "
                >
                    {isLoading ? <Loading visible={true} size="w-5 h-5" border="border-2" color="border-white" /> : <Icon name="searchInput" />}
                </button>
            </div>

            {selectedLayers.length > 0 && (
                <div className="relative mt-6 bg-white rounded-[7px] p-2">
                    <ScrollContainer className="max-h-100 space-y-3">
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
                                    <div className="text-[10px]/[11px] font-garet font-normal tracking-normal text-[#465055] px-1">
                                        {group.temaLabel} / {group.subtemaLabel}
                                    </div>
                                    <div className="space-y-0.5">
                                        {group.layers.map(layer => {
                                            const isActive = isLayerActive(layer.id);
                                            return (
                                                <button
                                                    key={layer.id}
                                                    onClick={() => handleLayerClick(layer.id)}
                                                    className={`
                                                        w-full flex items-center justify-start gap-3 px-2 py-1.5 rounded-[8px] transition-all group cursor-pointer
                                                        hover:bg-[#FF8300]/10
                                                    `}
                                                >
                                                    <Icon
                                                        name="check"
                                                        state={isActive ? 'normal' : 'active'}
                                                        className="w-3 h-3 shrink-0"
                                                    />
                                                    <span
                                                        className={`
                                                            text-[13px]/[19px] font-garet font-normal text-left tracking-normal
                                                            ${isActive ? 'text-[#5C2472] font-bold' : 'text-[#454545] group-hover:text-[#5C2472]'
                                                }`}
                                                    >
                                                        {layer.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ));
                        })()}
                    </ScrollContainer>
                </div>
            )}
        </div>
    );
};

export default SearchMenu;
