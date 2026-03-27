import { useState, useEffect, useMemo, useRef, useContext } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useCarouselOverflow } from '@pages/maps/hooks/useCarouselOverflow';
import { generateCQLFilter, parseCQLToSelections, MONTHS } from '@pages/maps/helpers/dateFilterHelpers';
import Icon from '@components/Icon';
import icoPlayNormal from '@assets/icons/ico_play_normal.svg';
import icoPlayHover from '@assets/icons/ico_play_hover.svg';
import icoPauseNormal from '@assets/icons/ico_pause_normal.svg';
import icoPauseHover from '@assets/icons/ico_pause_hover.svg';

const BackButton = ({ onClick }) => (
    <button onClick={onClick}>
        <Icon
            name="downArrow"
            tooltip="Regresar"
            classNameBG="bg-[#F9FBFF] size-7.5 rounded-full flex items-center justify-center p-2"
            className="w-5 h-2 transition-transform duration-300 rotate-90"
        />
    </button>
);

const YearBadge = ({ year }) => (
    <span className="shrink-0 px-5 py-3 rounded-[9px] text-[14px]/[16px] font-medium font-garet bg-[#F0EAF3] border border-[#703089] text-[#703089]">
        {year}
    </span>
);

const PlayPauseButton = ({ isPlaying, onToggle }) => {
    const [isHovered, setIsHovered] = useState(false);
    const icon = isPlaying
        ? (isHovered ? icoPauseHover : icoPauseNormal)
        : (isHovered ? icoPlayHover : icoPlayNormal);
    const label = isPlaying ? 'PAUSAR' : 'VER ANIMACIÓN';

    return (
        <button
            onClick={onToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-[12px] bg-[#FFF2E5] border border-[#FF8300] text-[#FF8300] text-[8px]/[16px] font-bold font-garet transition-colors hover:bg-[#FFE4C4]"
        >
            <img src={icon} alt="" className="w-[10px] h-[10px]" />
            {label}
        </button>
    );
};

const CarouselArrow = ({ direction, onClick }) => (
    <button onClick={onClick}>
        <Icon
            name="downArrow"
            tooltip={direction === 'left' ? 'Anterior' : 'Siguiente'}
            classNameBG="bg-[#F9FBFF] size-7.5 rounded-full flex items-center justify-center p-2"
            className={`w-5 h-2 transition-transform duration-300 ${direction === 'left' ? 'rotate-90' : '-rotate-90'}`}
        />
    </button>
);

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
                        <BackButton onClick={handleBackToYears} />
                        <YearBadge year={selectedYear} />
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
                        <BackButton onClick={handleBackToYears} />
                        <YearBadge year={selectedYear} />
                    </div>
                    <div className="flex items-center gap-2">
                        {isRaster && !isSingleMonth && (
                            <PlayPauseButton isPlaying={isPlaying} onToggle={() => isPlaying ? handleStopLoop() : handleStartLoop()} />
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
                {yearsCarousel.hasOverflow && <CarouselArrow direction="left" onClick={() => yearsCarousel.scroll('left')} />}
                <div ref={yearsCarousel.scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {availableYears.map((year) => (
                        <button
                            key={year}
                            onClick={() => handleYearClick(year)}
                            className={`shrink-0 px-5 py-3 rounded-[9px] transition-all duration-200 text-[14px]/[16px] text-[#2E4372] font-medium font-garet bg-[#F9FBFF] border border-transparent hover:bg-[#F0EAF3] hover:text-[#703089] hover:border-[#703089] ${selectedYear === year ? 'bg-[#F0EAF3] border border-[#703089] text-[#703089]' : ''}`}
                        >
                            {year}
                        </button>
                    ))}
                </div>
                {yearsCarousel.hasOverflow && <CarouselArrow direction="right" onClick={() => yearsCarousel.scroll('right')} />}
            </div>
        </div>
    );
};

export default SimpleDateSelector;
