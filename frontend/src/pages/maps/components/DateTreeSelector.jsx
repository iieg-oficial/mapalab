import { useState, useEffect, useContext, useMemo } from 'react';
import { getLayerPeriodicity } from '@services/periodicityService';
import MapsContext from '@contexts/MapsContext';
import { useCarouselOverflow } from '@pages/maps/hooks/useCarouselOverflow';
import { useDateSelections } from '@pages/maps/hooks/useDateSelections';
import { generateCQLFilter, parseCQLToSelections, MONTHS } from '@pages/maps/helpers/dateFilterHelpers';
import NavigationButton from './NavigationButton';
import Icon from '@components/Icon';

const DateTreeSelector = ({ layerId, onFilterApply, onClearFilter, filterName = 'date' }) => {
    const { activeLayerIds = [], findLayerById, getSpecificFilter } = useContext(MapsContext);
    const [loading, setLoading] = useState(true);
    const [periodicityData, setPeriodicityData] = useState(null);
    const [error, setError] = useState(null);

    const initialSelections = useMemo(() => {
        const currentFilter = getSpecificFilter ? getSpecificFilter(layerId, filterName) : null;
        return parseCQLToSelections(currentFilter);
    }, [layerId, filterName, getSpecificFilter]);

    const {
        expandedYear,
        expandedMonth,
        selections,
        handleYearClick,
        handleMonthClick,
        handleDayClick,
        clearAllSelections,
        isYearActive,
        isMonthActive,
        isDayActive
    } = useDateSelections(initialSelections);

    const yearsCarousel = useCarouselOverflow();
    const daysCarousel = useCarouselOverflow();

    const layerGroups = useMemo(() => {
        if (!layerId || !findLayerById) return [];

        const rootLayer = findLayerById(layerId);
        if (!rootLayer) return [];

        const activeIdsSet = new Set(activeLayerIds);
        const groups = {};

        const collectLayers = (layerNode, ancestorActive = false, isRoot = false) => {
            if (!layerNode) return;

            const isActive = ancestorActive || activeIdsSet.has(layerNode.id) || isRoot;

            if (isActive && layerNode.wmsConfig) {
                const layerName = layerNode.wmsConfig.layerName;
                if (!groups[layerName]) {
                    groups[layerName] = {
                        representativeId: layerNode.id,
                        filters: [],
                        isShared: false
                    };
                }
                if (layerNode.wmsConfig.cqlFilter) {
                    groups[layerName].filters.push(layerNode.wmsConfig.cqlFilter);
                }
            }

            if (Array.isArray(layerNode.children) && layerNode.children.length > 0) {
                layerNode.children.forEach(child => collectLayers(child, false, false));
            }
        };

        collectLayers(rootLayer, false, true);
        return Object.values(groups);
    }, [layerId, activeLayerIds, findLayerById]);

    useEffect(() => {
        const fetchPeriodicity = async () => {
            if (layerGroups.length === 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const results = await Promise.all(layerGroups.map(async (group) => {
                    let cqlFilter = null;
                    if (group.filters.length > 0) {
                        const uniqueFilters = [...new Set(group.filters)];
                        if (uniqueFilters.length === 1) {
                            cqlFilter = uniqueFilters[0];
                        } else {
                            cqlFilter = uniqueFilters.map(f => `(${f})`).join(' OR ');
                        }
                    }

                    return getLayerPeriodicity(group.representativeId, { cqlFilter });
                }));

                const mergedFecha = {};
                const filterColumn = 'fecha';

                results.forEach(result => {
                    if (!result.fecha) return;

                    Object.entries(result.fecha).forEach(([year, months]) => {
                        if (!mergedFecha[year]) mergedFecha[year] = {};
                        Object.entries(months).forEach(([month, days]) => {
                            if (!mergedFecha[year][month]) mergedFecha[year][month] = [];
                            const existingDays = new Set(mergedFecha[year][month]);
                            days.forEach(d => existingDays.add(d));
                            mergedFecha[year][month] = Array.from(existingDays).sort((a, b) => a - b);
                        });
                    });
                });

                setPeriodicityData({
                    fecha: mergedFecha,
                    filterColumn
                });

            } catch (err) {
                console.error('Error al obtener periodicidad:', err);
                setError('No se pudo obtener la información de fechas disponibles');
            } finally {
                setLoading(false);
            }
        };

        fetchPeriodicity();
    }, [layerGroups]);

    useEffect(() => {
        const cqlFilter = generateCQLFilter(selections, periodicityData?.filterColumn || 'fecha');

        if (onFilterApply) {
            if (cqlFilter) {
                onFilterApply({
                    filterName,
                    cqlFilter,
                    filterColumn: periodicityData?.filterColumn || 'fecha',
                    selections: Array.from(selections)
                });
            } else if (onClearFilter) {
                onClearFilter();
            }
        }
    }, [selections, periodicityData]);

    useEffect(() => {
        yearsCarousel.checkOverflow();
        daysCarousel.checkOverflow();
    }, [periodicityData, expandedYear, expandedMonth, yearsCarousel.checkOverflow, daysCarousel.checkOverflow]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                Cargando fechas disponibles...
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-sm text-red-600">
                {error}
            </div>
        );
    }

    if (!periodicityData || !periodicityData.fecha || typeof periodicityData.fecha !== 'object') {
        return null;
    }

    const availableYears = Object.keys(periodicityData.fecha).map(Number).sort((a, b) => b - a);

    if (availableYears.length === 0) {
        return null;
    }

    const hasAnySelection = selections.size > 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Periodicidad</h4>
                {hasAnySelection && (
                    <button
                        onClick={clearAllSelections}
                        title="Limpiar todas las selecciones"
                        className="text-red-500 hover:text-red-700 transition-colors"
                    >
                        <Icon name="trash" className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="flex items-center gap-2">
                {yearsCarousel.hasOverflow && (
                    <NavigationButton direction="left" onClick={() => yearsCarousel.scroll('left')} />
                )}
                <div
                    ref={yearsCarousel.scrollRef}
                    className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {availableYears.map((year) => {
                        const isActive = isYearActive(year);
                        const isExpanded = expandedYear === year;

                        return (
                            <button
                                key={year}
                                onClick={() => handleYearClick(year, periodicityData?.fecha?.[year])}
                                className={`
                                    shrink-0 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium shadow-sm
                                    hover:shadow-md active:scale-95
                                    ${isExpanded ? 'bg-amber-500 text-white ring-2 ring-amber-300 ring-offset-2' : isActive ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2' : 'bg-blue-500 text-white hover:bg-blue-600'}
                                `}
                            >
                                {year}
                            </button>
                        );
                    })}
                </div>
                {yearsCarousel.hasOverflow && (
                    <NavigationButton direction="right" onClick={() => yearsCarousel.scroll('right')} />
                )}
            </div>

            {expandedYear !== null && (
                <div className="mt-2">
                    <div
                        className="grid grid-flow-col auto-cols-max gap-1 overflow-x-auto scrollbar-hide"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {(() => {
                            const yearData = periodicityData.fecha[expandedYear];
                            const availableMonths = Object.keys(yearData).map(Number).sort((a, b) => a - b);

                            return availableMonths.map((monthNum) => {
                                const monthObj = MONTHS.find(m => m.num === monthNum);
                                const monthName = monthObj?.name || monthNum;
                                const shortName = monthObj?.shortName || monthNum;
                                const isActive = isMonthActive(expandedYear, monthNum);
                                const isExpanded = expandedMonth === `${expandedYear}-${monthNum}`;

                                return (
                                    <button
                                        key={`${expandedYear}-${monthNum}`}
                                        onClick={() => handleMonthClick(expandedYear, monthNum, yearData)}
                                        className={`
                                            px-2 py-1 rounded transition-all duration-200 text-xs font-medium shadow-sm
                                            hover:shadow-md active:scale-95
                                            ${isExpanded ? 'bg-amber-500 text-white ring-2 ring-amber-300 ring-offset-1' : isActive ? 'bg-green-600 text-white ring-2 ring-green-400 ring-offset-1' : 'bg-green-500 text-white hover:bg-green-600'}
                                        `}
                                    >
                                        <span className="sm:hidden">{shortName}</span>
                                        <span className="hidden sm:inline">{monthName}</span>
                                    </button>
                                );
                            });
                        })()}
                    </div>
                </div>
            )}

            {expandedMonth !== null && (() => {
                const [year, month] = expandedMonth.split('-');
                const monthNum = parseInt(month);
                const yearData = periodicityData.fecha[year];
                const monthData = yearData[monthNum];

                if (!Array.isArray(monthData) || monthData.length === 0) return null;

                return (
                    <div className="mt-2">
                        <div className="flex items-center gap-2">
                            {daysCarousel.hasOverflow && (
                                <NavigationButton direction="left" onClick={() => daysCarousel.scroll('left')} />
                            )}
                            <div
                                ref={daysCarousel.scrollRef}
                                className="flex gap-1 overflow-x-auto scrollbar-hide flex-1"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {monthData.map((day) => {
                                    const isActive = isDayActive(year, monthNum, day);

                                    return (
                                        <button
                                            key={`${year}-${monthNum}-${day}`}
                                            onClick={() => handleDayClick(year, monthNum, day)}
                                            className={`
                                                shrink-0 px-2 py-1 rounded transition-all duration-200 text-xs font-medium shadow-sm
                                                hover:shadow-md active:scale-95
                                                ${isActive ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-1' : 'bg-purple-500 text-white hover:bg-purple-600'}
                                            `}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                            {daysCarousel.hasOverflow && (
                                <NavigationButton direction="right" onClick={() => daysCarousel.scroll('right')} />
                            )}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default DateTreeSelector;
