import { useState, useEffect, useMemo, useRef, useContext } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useCarouselOverflow } from '@pages/maps/hooks/useCarouselOverflow';
import { generateCQLFilter, MONTHS } from '@pages/maps/helpers/dateFilterHelpers';
import { computeSelectorInitialState } from '@pages/maps/helpers/dateLoopHelpers';
import { BackButton, YearBadge, CarouselArrow } from './SimpleDateSelectorParts';

const SLOT_COLORS = {
    A: {
        activeBg: 'bg-[#F0EAF3]', activeBorder: 'border-[#5C2472]', activeText: 'text-[#5C2472]',
        loopTickBg: 'bg-[#E2D1EB]', loopTickBorder: 'border-transparent', loopTickText: 'text-[#5C2472]',
        hoverBg: 'hover:bg-[#F0EAF3]', hoverText: 'hover:text-[#5C2472]', hoverBorder: 'hover:border-[#5C2472]',
    },
    B: {
        activeBg: 'bg-[#FFF2E5]', activeBorder: 'border-[#FF8300]', activeText: 'text-[#FF8300]',
        loopTickBg: 'bg-[#FFE4C4]', loopTickBorder: 'border-transparent', loopTickText: 'text-[#FF8300]',
        hoverBg: 'hover:bg-[#FFF2E5]', hoverText: 'hover:text-[#FF8300]', hoverBorder: 'hover:border-[#FF8300]',
    },
    default: {
        activeBg: 'bg-[#F0EAF3]', activeBorder: 'border-[#703089]', activeText: 'text-[#703089]',
        loopTickBg: 'bg-[#FFF2E5]', loopTickBorder: 'border-transparent', loopTickText: 'text-[#FF8300]',
        hoverBg: 'hover:bg-[#F0EAF3]', hoverText: 'hover:text-[#703089]', hoverBorder: 'hover:border-[#703089]',
    },
};

const SimpleDateSelector = ({ layerId, periodicity, rasterPeriodicity, onFilterApply, onClearFilter, filterName = 'date', singleSelectOnly = false, onExpandedYearChange, getSpecificFilterOverride, slot }) => {
    const { getSpecificFilter: getSpecificFilterCtx, stopLoop: contextStopLoop, getLoopState } = useContext(MapsContext);
    const getSpecificFilter = getSpecificFilterOverride || getSpecificFilterCtx;
    const palette = SLOT_COLORS[slot] || SLOT_COLORS.default;
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
        const currentFilter = getSpecificFilter ? getSpecificFilter(layerId, filterName) : null;
        return computeSelectorInitialState({ isRaster, rasterPeriodicity, currentFilter });
    }, [layerId, filterName, getSpecificFilter, isRaster, rasterPeriodicity]);

    const [selectedYear, setSelectedYear] = useState(initialState.year);
    const [selectedMonths, setSelectedMonths] = useState(initialState.months);
    const [expandedYear, setExpandedYear] = useState(initialState.year);
    const activeYearRef = useRef(null);

    const loopState = getSpecificFilterOverride ? null : getLoopState?.(layerId);

    const onFilterApplyRef = useRef(onFilterApply);
    const onClearFilterRef = useRef(onClearFilter);
    const externalFilter = getSpecificFilter?.(layerId, filterName);
    const prevExternalFilterRef = useRef(externalFilter);

    useEffect(() => {
        onFilterApplyRef.current = onFilterApply;
        onClearFilterRef.current = onClearFilter;
    });

    useEffect(() => {
        if (prevExternalFilterRef.current && !externalFilter) {
            setSelectedYear(null);
            setSelectedMonths(new Set());
            setExpandedYear(null);
        }
        prevExternalFilterRef.current = externalFilter;
    }, [externalFilter]);

    useEffect(() => {
        onExpandedYearChange?.(expandedYear);
    }, [expandedYear, onExpandedYearChange]);

    useEffect(() => {
        if (!loopState?.isPlaying || loopState?.mode !== 'year') return;
        const el = activeYearRef.current;
        const container = yearsCarousel.scrollRef?.current;
        if (!el || !container) return;
        const elLeft = el.offsetLeft;
        const elRight = elLeft + el.offsetWidth;
        const scrollLeft = container.scrollLeft;
        const scrollRight = scrollLeft + container.clientWidth;
        if (elLeft < scrollLeft || elRight > scrollRight) {
            container.scrollTo({
                left: elLeft - (container.clientWidth - el.offsetWidth) / 2,
                behavior: 'smooth'
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loopState?.currentKey, loopState?.isPlaying, loopState?.mode]);

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
        } else if (selectedYear !== null) {
            selections.add(`${selectedYear}`);
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
        if (!loopState?.isPlaying || loopState?.currentKey == null) return;
        if (loopState.mode === 'month') {
            setSelectedMonths(new Set([loopState.currentKey]));
            if (loopState.year != null && selectedYear !== loopState.year) {
                setSelectedYear(loopState.year);
                setExpandedYear(loopState.year);
            }
        } else if (loopState.mode === 'year') {
            if (selectedYear !== loopState.currentKey) {
                setSelectedYear(loopState.currentKey);
            }
            setSelectedMonths(new Set());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loopState?.currentKey, loopState?.isPlaying, loopState?.mode, loopState?.year]);

    const handleStopLoop = () => {
        contextStopLoop?.(layerId);
    };

    const yearsCarousel = useCarouselOverflow();

    if (!periodicityData?.fecha || typeof periodicityData.fecha !== 'object') return null;

    const availableYears = Object.keys(periodicityData.fecha).map(Number).sort((a, b) => b - a);
    if (availableYears.length === 0) return null;

    const handleYearClick = (year) => {
        if (loopState?.isPlaying && loopState?.mode === 'year') {
            handleStopLoop();
        }

        if (singleSelectOnly && selectedYear === year) {
            setExpandedYear(year);
            return;
        }

        const yearData = periodicityData.fecha[year];

        if (isRaster && typeof yearData === 'string') {
            setSelectedYear(year);
            setSelectedMonths(new Set());
            setExpandedYear(year);
            return;
        }

        if (yearData && typeof yearData === 'object') {
            const monthKeys = Object.keys(yearData).map(Number);
            if (monthKeys.length === 1) {
                setSelectedYear(year);
                setSelectedMonths(new Set([monthKeys[0]]));
                setExpandedYear(year);
                return;
            }
        }

        setSelectedYear(year);
        setSelectedMonths(new Set());
        setExpandedYear(year);
    };

    const handleBackToYears = () => {
        handleStopLoop();
        setExpandedYear(null);
        if (!singleSelectOnly) {
            setSelectedYear(null);
            setSelectedMonths(new Set());
        }
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

    if (expandedYear !== null) {
        const yearData = periodicityData.fecha[expandedYear];
        const isAnnual = typeof yearData === 'string';

        if (isAnnual) {
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <BackButton onClick={handleBackToYears} />
                        <YearBadge year={expandedYear} />
                    </div>
                </div>
            );
        }

        const availableMonthNums = yearData ? Object.keys(yearData).map(Number).sort((a, b) => a - b) : [];
        const isSingleMonth = availableMonthNums.length === 1;

        return (
            <div className="space-y-3">
                <div className="flex items-center gap-4">
                    <BackButton onClick={handleBackToYears} />
                    <YearBadge year={expandedYear} />
                </div>
                {!isSingleMonth && (
                    <div className="flex flex-wrap gap-1">
                        {availableMonthNums.map((monthNum) => {
                            const monthObj = MONTHS.find(m => m.num === monthNum);
                            const abbr = monthObj ? monthObj.name.slice(0, 3).toUpperCase() : monthNum;
                            const isActive = selectedMonths.has(monthNum);
                            const isLoopTick = loopState?.isPlaying && loopState?.mode === 'month' && loopState?.currentKey === monthNum;
                            const activeStyle = isLoopTick
                                ? `${palette.loopTickBg} border ${palette.loopTickBorder} ${palette.loopTickText}`
                                : `${palette.activeBg} border ${palette.activeBorder} ${palette.activeText}`;
                            const idleStyle = `bg-[#F9FBFF] border border-transparent ${palette.hoverBg} ${palette.hoverText} ${palette.hoverBorder}`;

                            return (
                                <button
                                    key={`${expandedYear}-${monthNum}`}
                                    onClick={() => handleMonthToggle(monthNum)}
                                    className={`
                                        shrink-0 px-4 py-2 rounded-[9px] transition-all duration-200
                                        text-[12px]/[14px] text-[#2E4372] font-medium font-garet
                                        ${isActive ? activeStyle : idleStyle}
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

    const yearBtnClass = (year) => {
        const isActive = selectedYear === year;
        const isLoopTick = loopState?.isPlaying && loopState?.mode === 'year' && loopState?.currentKey === year;
        const activeClasses = (isLoopTick || singleSelectOnly)
            ? `${palette.loopTickBg} border ${palette.activeBorder} ${palette.loopTickText}`
            : `${palette.activeBg} border ${palette.activeBorder} ${palette.activeText}`;
        return `shrink-0 px-5 py-3 rounded-[9px] transition-all duration-200 text-[14px]/[16px] text-[#2E4372] font-medium font-garet bg-[#F9FBFF] border border-transparent ${palette.hoverBg} ${palette.hoverText} ${palette.hoverBorder} ${isActive ? activeClasses : ''}`;
    };
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                {yearsCarousel.hasOverflow && yearsCarousel.canScrollLeft && <CarouselArrow direction="left" onClick={() => yearsCarousel.scroll('left')} />}
                <div ref={yearsCarousel.scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {availableYears.map((year) => (
                        <button
                            key={year}
                            ref={loopState?.isPlaying && loopState?.mode === 'year' && loopState?.currentKey === year ? activeYearRef : null}
                            onClick={() => handleYearClick(year)}
                            className={yearBtnClass(year)}
                        >{year}</button>
                    ))}
                </div>
                {yearsCarousel.hasOverflow && yearsCarousel.canScrollRight && <CarouselArrow direction="right" onClick={() => yearsCarousel.scroll('right')} />}
            </div>
        </div>
    );
};

export default SimpleDateSelector;
