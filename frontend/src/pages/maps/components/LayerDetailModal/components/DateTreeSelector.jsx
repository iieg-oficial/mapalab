import { useEffect, useContext, useMemo, useRef } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useCarouselOverflow } from '@pages/maps/hooks/useCarouselOverflow';
import { useDateSelections } from '@pages/maps/hooks/useDateSelections';
import { generateCQLFilter, parseCQLToSelections, MONTHS } from '@pages/maps/helpers/dateFilterHelpers';
import Icon from '@components/Icon';

const DateTreeSelector = ({ layerId, periodicity, onFilterApply, onClearFilter, filterName = 'date', singleSelectOnly = false }) => {
    const { getSpecificFilter } = useContext(MapsContext);

    const periodicityData = useMemo(() => {
        if (!periodicity) return null;
        const fecha = periodicity.fecha || periodicity;
        if (!fecha || typeof fecha !== 'object') return null;
        return { fecha, filterColumn: 'fecha' };
    }, [periodicity]);

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
        handleYearClick: _handleYearClick,
        handleMonthClick: _handleMonthClick,
        handleDayClick: _handleDayClick,
        clearAllSelections,
        isYearActive,
        isMonthActive,
        isDayActive
    } = useDateSelections(initialSelections);

    const handleYearClick = singleSelectOnly
        ? (year) => { clearAllSelections(); _handleYearClick(year); }
        : _handleYearClick;

    const handleMonthClick = singleSelectOnly
        ? (year, month) => { clearAllSelections(); _handleMonthClick(year, month); }
        : _handleMonthClick;

    const handleDayClick = singleSelectOnly
        ? (year, month, day) => { clearAllSelections(); _handleDayClick(year, month, day); }
        : _handleDayClick;

    const yearsCarousel = useCarouselOverflow();
    const daysCarousel = useCarouselOverflow();

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
            {hasAnySelection && (
                <div className="flex justify-end">
                    <button onClick={clearAllSelections}>
                        <Icon
                            tooltip="Limpiar todas las selecciones"
                            name="eliminar"
                            state="hover"
                            className="size-5 cursor-pointer"
                        />
                    </button>
                </div>
            )}

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
                                <button onClick={() => daysCarousel.scroll('left')}>
                                    <Icon
                                        name="downArrow"
                                        tooltip="Anterior"
                                        classNameBG="bg-[#F9FBFF] size-7.5 rounded-full flex items-center justify-center p-2"
                                        className="w-5 h-2 transition-transform duration-300 rotate-90"
                                    />
                                </button>
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
                                <button onClick={() => daysCarousel.scroll('right')}>
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
            })()}
        </div>
    );
};

export default DateTreeSelector;
