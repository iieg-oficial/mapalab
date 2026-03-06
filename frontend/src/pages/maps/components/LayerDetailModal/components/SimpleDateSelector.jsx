import { useState, useEffect, useMemo, useRef, useContext } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useCarouselOverflow } from '@pages/maps/hooks/useCarouselOverflow';
import { generateCQLFilter, parseCQLToSelections, MONTHS } from '@pages/maps/helpers/dateFilterHelpers';
import Icon from '@components/Icon';

const SimpleDateSelector = ({ layerId, periodicity, rasterPeriodicity, onFilterApply, onClearFilter, filterName = 'date', singleSelectOnly = false }) => {
    const { getSpecificFilter, startLoop, stopLoop: contextStopLoop, getLoopState } = useContext(MapsContext);
    const isRaster = !!rasterPeriodicity;

    const periodicityData = useMemo(() => {
        if (isRaster) {
            return { fecha: rasterPeriodicity, filterColumn: null };
        }
        if (!periodicity) return null;
        const fecha = periodicity.fecha || periodicity;
        if (!fecha || typeof fecha !== 'object') return null;
        return { fecha, filterColumn: 'fecha' };
    }, [periodicity, rasterPeriodicity, isRaster]);

    const initialState = useMemo(() => {
        if (isRaster) {
            if (!rasterPeriodicity) return { year: null, months: new Set() };

            const currentFilter = getSpecificFilter ? getSpecificFilter(layerId, filterName) : null;
            if (currentFilter) {
                for (const [year, yearData] of Object.entries(rasterPeriodicity)) {
                    if (typeof yearData === 'string' && yearData === currentFilter) {
                        return { year: parseInt(year), months: new Set() };
                    }
                    if (typeof yearData === 'object') {
                        for (const [month, cqlValue] of Object.entries(yearData)) {
                            if (cqlValue === currentFilter) {
                                return { year: parseInt(year), months: new Set([parseInt(month)]) };
                            }
                        }
                    }
                }
            }

            const years = Object.keys(rasterPeriodicity).map(Number).sort((a, b) => b - a);
            return { year: years[0] || null, months: new Set() };
        }

        const currentFilter = getSpecificFilter ? getSpecificFilter(layerId, filterName) : null;
        const parsed = parseCQLToSelections(currentFilter);
        let year = null;
        const months = new Set();

        for (const sel of parsed) {
            const parts = sel.split('-');
            if (parts.length >= 2) {
                year = parseInt(parts[0]);
                months.add(parseInt(parts[1]));
            } else if (parts.length === 1) {
                year = parseInt(parts[0]);
            }
        }

        return { year, months };
    }, [layerId, filterName, getSpecificFilter, isRaster, rasterPeriodicity]);

    const [selectedYear, setSelectedYear] = useState(initialState.year);
    const [selectedMonths, setSelectedMonths] = useState(initialState.months);

    const loopState = getLoopState?.(layerId);
    const isPlaying = loopState?.isPlaying ?? false;

    const onFilterApplyRef = useRef(onFilterApply);
    const onClearFilterRef = useRef(onClearFilter);

    useEffect(() => {
        onFilterApplyRef.current = onFilterApply;
        onClearFilterRef.current = onClearFilter;
    });

    useEffect(() => {
        if (isRaster) {
            if (selectedYear !== null && selectedMonths.size > 0) {
                const monthNum = [...selectedMonths][0];
                const cqlValue = periodicityData?.fecha?.[selectedYear]?.[monthNum];
                if (cqlValue) {
                    onFilterApplyRef.current?.({ filterName, cqlFilter: cqlValue });
                }
            } else if (selectedYear !== null) {
                const yearData = periodicityData?.fecha?.[selectedYear];
                if (typeof yearData === 'string') {
                    onFilterApplyRef.current?.({ filterName, cqlFilter: yearData });
                }
            } else {
                onClearFilterRef.current?.();
            }
            return;
        }

        const selections = new Set();
        if (selectedYear !== null && selectedMonths.size > 0) {
            selectedMonths.forEach(m => selections.add(`${selectedYear}-${m}`));
        }

        const cqlFilter = generateCQLFilter(selections, periodicityData?.filterColumn || 'fecha');

        if (cqlFilter) {
            onFilterApplyRef.current?.({
                filterName,
                cqlFilter,
                filterColumn: periodicityData?.filterColumn || 'fecha',
                selections: Array.from(selections)
            });
        } else {
            onClearFilterRef.current?.();
        }
    }, [selectedYear, selectedMonths, periodicityData, filterName, isRaster]);

    useEffect(() => {
        if (loopState?.isPlaying && loopState?.currentMonth != null) {
            setSelectedMonths(new Set([loopState.currentMonth]));
            if (loopState.year != null && selectedYear !== loopState.year) {
                setSelectedYear(loopState.year);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loopState?.currentMonth, loopState?.isPlaying, loopState?.year]);

    const handleStopLoop = () => {
        contextStopLoop?.(layerId);
    };

    const handleStartLoop = () => {
        startLoop?.(layerId, selectedYear, periodicityData?.fecha);
    };

    const yearsCarousel = useCarouselOverflow();

    if (!periodicityData?.fecha || typeof periodicityData.fecha !== 'object') return null;

    const availableYears = Object.keys(periodicityData.fecha).map(Number).sort((a, b) => b - a);
    if (availableYears.length === 0) return null;

    const handleYearClick = (year) => {
        const yearData = periodicityData.fecha[year];

        if (isRaster && typeof yearData === 'string') {
            setSelectedYear(year);
            setSelectedMonths(new Set());
            return;
        }

        if (yearData && typeof yearData === 'object') {
            const monthKeys = Object.keys(yearData).map(Number);
            if (monthKeys.length === 1) {
                setSelectedYear(year);
                setSelectedMonths(new Set([monthKeys[0]]));
                return;
            }
        }

        setSelectedYear(year);
        setSelectedMonths(new Set());
    };

    const handleBackToYears = () => {
        handleStopLoop();
        setSelectedYear(null);
        setSelectedMonths(new Set());
    };

    const handleMonthToggle = (monthNum) => {
        if (isRaster) {
            const isAlreadySelected = selectedMonths.has(monthNum);
            if (isAlreadySelected) {
                setSelectedMonths(new Set());
            } else {
                setSelectedMonths(new Set([monthNum]));
            }
            return;
        }

        if (singleSelectOnly) {
            setSelectedMonths(prev => prev.has(monthNum) ? new Set() : new Set([monthNum]));
            return;
        }

        setSelectedMonths(prev => {
            const next = new Set(prev);
            if (next.has(monthNum)) {
                next.delete(monthNum);
            } else {
                next.add(monthNum);
            }
            return next;
        });
    };

    const handleClearMonths = () => {
        handleStopLoop();
        setSelectedMonths(new Set());
    };

    const hasSelection = selectedMonths.size > 0;

    if (selectedYear !== null) {
        const yearData = periodicityData.fecha[selectedYear];
        const isAnnual = typeof yearData === 'string';

        if (isAnnual) {
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBackToYears}>
                            <Icon
                                name="downArrow"
                                tooltip="Regresar"
                                classNameBG="bg-[#F9FBFF] size-7.5 rounded-full flex items-center justify-center p-2"
                                className="w-5 h-2 transition-transform duration-300 rotate-90"
                            />
                        </button>
                        <span className="shrink-0 px-5 py-3 rounded-[9px] text-[14px]/[16px] font-medium font-garet bg-[#F0EAF3] border border-[#703089] text-[#703089]">
                            {selectedYear}
                        </span>
                    </div>
                </div>
            );
        }

        const availableMonthNums = yearData ? Object.keys(yearData).map(Number).sort((a, b) => a - b) : [];
        const isSingleMonth = availableMonthNums.length === 1;

        return (
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBackToYears}>
                            <Icon
                                name="downArrow"
                                tooltip="Regresar"
                                classNameBG="bg-[#F9FBFF] size-7.5 rounded-full flex items-center justify-center p-2"
                                className="w-5 h-2 transition-transform duration-300 rotate-90"
                            />
                        </button>
                        <span className="shrink-0 px-5 py-3 rounded-[9px] text-[14px]/[16px] font-medium font-garet bg-[#F0EAF3] border border-[#703089] text-[#703089]">
                            {selectedYear}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {isRaster && !isSingleMonth && (
                            <button
                                onClick={() => isPlaying ? handleStopLoop() : handleStartLoop()}
                                className="size-7.5 rounded-full bg-[#F9FBFF] flex items-center justify-center hover:bg-[#F0EAF3] transition-colors"
                                title={isPlaying ? 'Pausar' : 'Reproducir'}
                            >
                                {isPlaying ? (
                                    <svg width="12" height="12" viewBox="0 0 12 12" className="text-[#703089]">
                                        <rect x="1" y="1" width="3.5" height="10" rx="1" fill="currentColor" />
                                        <rect x="7.5" y="1" width="3.5" height="10" rx="1" fill="currentColor" />
                                    </svg>
                                ) : (
                                    <svg width="12" height="12" viewBox="0 0 12 12" className="text-[#703089]">
                                        <path d="M2 1.5v9l8.5-4.5L2 1.5z" fill="currentColor" />
                                    </svg>
                                )}
                            </button>
                        )}
                        {hasSelection && !isSingleMonth && (
                            <button onClick={handleClearMonths}>
                                <Icon
                                    tooltip="Limpiar selecciones"
                                    name="eliminar"
                                    state="hover"
                                    className="size-5 cursor-pointer"
                                />
                            </button>
                        )}
                    </div>
                </div>
                {!isSingleMonth && (
                    <div className="flex flex-wrap gap-1">
                        {availableMonthNums.map((monthNum) => {
                            const monthObj = MONTHS.find(m => m.num === monthNum);
                            const abbr = monthObj ? monthObj.name.slice(0, 3).toUpperCase() : monthNum;
                            const isActive = selectedMonths.has(monthNum);

                            return (
                                <button
                                    key={`${selectedYear}-${monthNum}`}
                                    onClick={() => handleMonthToggle(monthNum)}
                                    className={`
                                        shrink-0 px-4 py-2 rounded-[9px] transition-all duration-200
                                        text-[12px]/[14px] text-[#2E4372] font-medium font-garet
                                        ${isActive
                                    ? 'bg-[#F0EAF3] border border-[#703089] text-[#703089]'
                                    : 'bg-[#F9FBFF] border border-transparent hover:bg-[#F0EAF3] hover:text-[#703089] hover:border-[#703089]'
                                }
                                    `}
                                >
                                    {abbr}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                {yearsCarousel.hasOverflow && (
                    <button onClick={() => yearsCarousel.scroll('left')}>
                        <Icon
                            name="downArrow"
                            tooltip="Anterior"
                            classNameBG="bg-[#F9FBFF] size-7.5 rounded-full flex items-center justify-center p-2"
                            className="w-5 h-2 transition-transform duration-300 rotate-90"
                        />
                    </button>
                )}
                <div
                    ref={yearsCarousel.scrollRef}
                    className="flex gap-2 overflow-x-auto scrollbar-hide flex-1"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {availableYears.map((year) => (
                        <button
                            key={year}
                            onClick={() => handleYearClick(year)}
                            className={`
                                shrink-0 px-5 py-3 rounded-[9px] transition-all duration-200 text-[14px]/[16px] text-[#2E4372]
                                font-medium font-garet bg-[#F9FBFF] border border-transparent hover:bg-[#F0EAF3]
                                hover:text-[#703089] hover:border-[#703089]
                                ${selectedYear === year ? 'bg-[#F0EAF3] border border-[#703089] text-[#703089]' : ''}
                            `}
                        >
                            {year}
                        </button>
                    ))}
                </div>
                {yearsCarousel.hasOverflow && (
                    <button onClick={() => yearsCarousel.scroll('right')}>
                        <Icon
                            name="downArrow"
                            tooltip="Siguiente"
                            classNameBG="bg-[#F9FBFF] size-7.5 rounded-full flex items-center justify-center p-2"
                            className="w-5 h-2 transition-transform duration-300 -rotate-90"
                        />
                    </button>
                )}
            </div>
        </div>
    );
};

export default SimpleDateSelector;
