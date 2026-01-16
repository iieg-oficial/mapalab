import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { getLayerPeriodicity } from '@services/periodicityService';
import MapsContext from '@contexts/MapsContext';
import { useCarouselOverflow } from '@pages/maps/hooks/useCarouselOverflow';
import { useDateSelections } from '@pages/maps/hooks/useDateSelections';
import { generateCQLFilter, parseCQLToSelections, MONTHS } from '@pages/maps/helpers/dateFilterHelpers';
import NavigationButton from '../../NavigationButton';
import Icon from '@components/Icon';
import Loading from '@components/Loading';
import Tooltip from '@components/Tooltip';

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
        toggleYear,
        toggleMonth,
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

    const onFilterApplyRef = useRef(onFilterApply);
    const onClearFilterRef = useRef(onClearFilter);

    useEffect(() => {
        onFilterApplyRef.current = onFilterApply;
        onClearFilterRef.current = onClearFilter;
    });

    useEffect(() => {
        const cqlFilter = generateCQLFilter(selections, periodicityData?.filterColumn || 'fecha');

        if (cqlFilter) {
            if (onFilterApplyRef.current) {
                onFilterApplyRef.current({
                    filterName,
                    cqlFilter,
                    filterColumn: periodicityData?.filterColumn || 'fecha',
                    selections: Array.from(selections)
                });
            }
        } else {
            if (onClearFilterRef.current) {
                onClearFilterRef.current();
            }
        }
    }, [selections, periodicityData, filterName]);

    useEffect(() => {
        yearsCarousel.checkOverflow();
        daysCarousel.checkOverflow();
    }, [periodicityData, expandedYear, expandedMonth, yearsCarousel.checkOverflow, daysCarousel.checkOverflow]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-[12px]/[18px] text-[#454545] font-normal font-garet tracking-normal">
                <Loading visible size="size-5" />
                Cargando fechas disponibles ...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-[11px]/[16px] text-[#EA4335] font-normal font-garet tracking-normal">
                <Icon name="alert" className="h-4 w-4" />
                {error || 'Ocurrió un error al cargar las fechas disponibles'}
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
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-[14px]/[16px] font-garet font-bold text-[#5C2472] tracking-normal">Periodicidad</span>
                    <Icon
                        name="info_warning"
                        className="size-4 cursor-help"
                        tooltip="Click simple: navegar opciones. Doble click: seleccionar fecha. Click en seleccionado: deseleccionar."
                    />
                </div>
                {hasAnySelection && (
                    <button onClick={clearAllSelections}>
                        <Icon
                            tooltip="Limpiar todas las selecciones"
                            name="eliminar"
                            state="hover"
                            className="size-5 cursor-pointer"
                        />
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
                                onClick={() => toggleYear(year, periodicityData?.fecha?.[year])}
                                onDoubleClick={() => handleYearClick(year)}
                                className={`
                                    shrink-0 px-5 py-3 rounded-[9px] transition-all duration-200
                                    text-[14px]/[16px] text-[#2E4372] font-medium font-garet 
                                    ${isExpanded
                                        ? 'bg-[#FF8300]/30 border border-[#FF8300] text-[#FF8300]'
                                        : isActive
                                            ? 'bg-[#F0EAF3] border border-[#703089] text-[#703089]'
                                            : 'bg-[#F9FBFF] border border-transparent hover:bg-[#F0EAF3] hover:text-[#703089] hover:border-[#703089]'
                                    }
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
                    <div className="flex flex-wrap gap-1">
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
                                        onClick={() => toggleMonth(expandedYear, monthNum, yearData)}
                                        onDoubleClick={() => handleMonthClick(expandedYear, monthNum)}
                                        className={`
                                            shrink-0 px-4 py-2 rounded-[9px] transition-all duration-200
                                            text-[12px]/[14px] text-[#2E4372] font-medium font-garet
                                            ${isExpanded
                                                ? 'bg-[#FF8300]/30 border border-[#FF8300] text-[#FF8300]'
                                                : isActive
                                                    ? 'bg-[#F0EAF3] border border-[#703089] text-[#703089]'
                                                    : 'bg-[#F9FBFF] border border-transparent hover:bg-[#F0EAF3] hover:text-[#703089] hover:border-[#703089]'
                                            }
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
                                            onClick={() => isActive && handleDayClick(year, monthNum, day)}
                                            onDoubleClick={() => handleDayClick(year, monthNum, day)}
                                            className={`
                                                shrink-0 px-4 py-2 rounded-[9px] transition-all duration-200
                                                text-[12px]/[14px] text-[#2E4372] font-medium font-garet
                                                ${isActive
                                                    ? 'bg-[#F0EAF3] border border-[#703089] text-[#703089]'
                                                    : 'bg-[#F9FBFF] border border-transparent hover:bg-[#F0EAF3] hover:text-[#703089] hover:border-[#703089]'
                                                }
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
