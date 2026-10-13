import { useEffect, useMemo, useRef, useContext } from 'react';
import { toKey } from 'zootropo';
import MapsContext from '@contexts/MapsContext';
import { useCarouselOverflow } from '@pages/maps/hooks/useCarouselOverflow';
import { useDateSelector } from '@pages/maps/hooks/useDateSelector';
import { MONTHS } from '@pages/maps/helpers/dateFilterHelpers';
import { BackButton, YearBadge, CarouselArrow } from './SimpleDateSelectorParts';
import { toneClasses, toneStateFor } from '@pages/maps/helpers/periodicityTones';

const LOOP_TICK_SURFACE = {
    A: 'bg-[#E2D1EB] border-[#E2D1EB] text-[#5C2472]',
    B: 'bg-[#FFE4C4] border-[#FFE4C4] text-[#FF8300]',
    default: 'bg-[#FFE4C4] border-[#FFE4C4] text-[#FF8300]',
};

const dateBtnClass = ({ slot, isActive, isLoopTick }) => {
    if (isLoopTick) return `border transition-colors ${LOOP_TICK_SURFACE[slot] || LOOP_TICK_SURFACE.default}`;
    return toneClasses(toneStateFor(slot, isActive).tone, { active: isActive });
};

const optionProps = (key, level, selected) => ({ role: 'option', 'aria-selected': selected, 'data-key': key, 'data-level': level });

const SimpleDateSelector = ({ layerId, periodicity, rasterPeriodicity, onFilterApply, onClearFilter, filterName = 'date', singleSelectOnly = false, onExpandedYearChange, getSpecificFilterOverride, slot, monthsFill = false }) => {
    const { getSpecificFilter: getSpecificFilterCtx, stopLoop: contextStopLoop, getLoopState } = useContext(MapsContext);
    const getSpecificFilter = getSpecificFilterOverride || getSpecificFilterCtx;
    const isRaster = !!rasterPeriodicity;

    const periodicityData = useMemo(() => {
        if (isRaster) return { fecha: rasterPeriodicity, filterColumn: null };
        if (!periodicity) return null;
        const fecha = periodicity.fecha || periodicity;
        if (!fecha || typeof fecha !== 'object') return null;
        return { fecha, filterColumn: 'fecha' };
    }, [periodicity, rasterPeriodicity, isRaster]);

    const currentFilter = getSpecificFilter?.(layerId, filterName) || null;
    const { t, player, selectedYear, selectedMonths, expandedYear } = useDateSelector({
        fecha: periodicityData?.fecha,
        filterColumn: periodicityData?.filterColumn,
        isRaster,
        singleSelectOnly,
        currentFilter,
        onApply: (cqlFilter, keys) => onFilterApply?.(isRaster
            ? { filterName, cqlFilter }
            : { filterName, cqlFilter, filterColumn: periodicityData?.filterColumn || 'fecha', selections: keys }),
        onClear: () => onClearFilter?.(),
    });

    const loopState = getLoopState?.(layerId, slot ?? null) ?? null;
    const activeYearRef = useRef(null);
    const yearsCarousel = useCarouselOverflow();

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
        if (elLeft < container.scrollLeft || elRight > container.scrollLeft + container.clientWidth) {
            container.scrollTo({ left: elLeft - (container.clientWidth - el.offsetWidth) / 2, behavior: 'smooth' });
        }
    }, [loopState?.currentKey, loopState?.isPlaying, loopState?.mode, yearsCarousel.scrollRef]);

    if (!periodicityData?.fecha || typeof periodicityData.fecha !== 'object') return null;

    const fecha = periodicityData.fecha;
    const availableYears = Object.keys(fecha).map(Number).sort((a, b) => b - a);
    if (availableYears.length === 0) return null;

    const handleStopLoop = () => {
        if (loopState?.isPlaying) contextStopLoop?.(layerId, slot ?? null);
    };

    const handleYearClick = (year) => {
        if (loopState?.isPlaying && loopState?.mode === 'year') handleStopLoop();
        const yearKey = toKey(year);
        if (singleSelectOnly && selectedYear === year) {
            player.open(yearKey);
            return;
        }
        const yearData = fecha[year];
        if (yearData && typeof yearData === 'object') {
            const monthKeys = Object.keys(yearData).map(Number).sort((a, b) => a - b);
            if (isRaster) {
                const previousMonth = [...selectedMonths][0];
                const month = monthKeys.includes(previousMonth) ? previousMonth : monthKeys[monthKeys.length - 1];
                player.setSelection([toKey(year, month)]);
            } else if (monthKeys.length === 1) {
                player.setSelection([toKey(year, monthKeys[0])]);
            } else {
                player.setSelection([yearKey]);
            }
        } else {
            player.setSelection([yearKey]);
        }
        player.open(yearKey);
    };

    const handleBackToYears = () => {
        handleStopLoop();
        const year = expandedYear;
        player.back();
        if (singleSelectOnly || year === null) return;
        const yearData = fecha[year];
        const isRasterMonthly = isRaster && yearData && typeof yearData === 'object';
        if (!isRasterMonthly) player.setSelection([toKey(year)]);
    };

    const handleMonthToggle = (monthNum) => {
        if (loopState?.mode === 'month') handleStopLoop();
        const key = toKey(expandedYear, monthNum);
        const yearKey = toKey(expandedYear);
        if (isRaster || singleSelectOnly) player.setSelection(selectedMonths.has(monthNum) ? [yearKey] : [key]);
        else {
            player.select(key, 'toggle');
            if (player.getSnapshot().selection.length === 0) player.setSelection([yearKey]);
        }
        player.open(yearKey);
    };

    if (expandedYear !== null) {
        const yearData = fecha[expandedYear];
        if (typeof yearData === 'string') {
            return (
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <BackButton onClick={handleBackToYears} />
                        <YearBadge year={expandedYear} />
                    </div>
                </div>
            );
        }

        const monthItems = t.items.filter(item => item.level === 'month');
        const isSingleMonth = monthItems.length === 1;

        return (
            <div className="space-y-3">
                <div className="flex items-center gap-4">
                    <BackButton onClick={handleBackToYears} />
                    <YearBadge year={expandedYear} slot={slot} />
                </div>
                {!isSingleMonth && (
                    <div {...t.getListProps()} className={monthsFill ? 'grid grid-cols-4 gap-1' : 'flex flex-wrap gap-1'}>
                        {monthItems.map((item) => {
                            const monthObj = MONTHS.find(m => m.num === item.month);
                            const abbr = monthObj ? monthObj.name.slice(0, 3).toUpperCase() : item.month;
                            const isActive = selectedMonths.has(item.month) && selectedYear === expandedYear;
                            const isLoopTick = loopState?.isPlaying && loopState?.mode === 'month' && loopState?.currentKey === item.month;
                            return (
                                <button
                                    key={item.key}
                                    {...optionProps(item.key, 'month', isActive)}
                                    onClick={() => handleMonthToggle(item.month)}
                                    className={`${monthsFill ? 'w-full' : 'shrink-0 px-4'} py-2 rounded-[9px] text-[12px]/[14px] font-medium font-garet ${dateBtnClass({ slot, isActive, isLoopTick })}`}
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
        return `shrink-0 px-5 py-3 rounded-[9px] text-[14px]/[16px] font-medium font-garet ${dateBtnClass({ slot, isActive, isLoopTick: isActive && isLoopTick })}`;
    };
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                {yearsCarousel.hasOverflow && yearsCarousel.canScrollLeft && <CarouselArrow direction="left" onClick={() => yearsCarousel.scroll('left')} />}
                <div {...t.getListProps()} ref={yearsCarousel.scrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide flex-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {availableYears.map((year) => {
                        return (
                            <button
                                key={year}
                                {...optionProps(toKey(year), 'year', selectedYear === year)}
                                ref={loopState?.isPlaying && loopState?.mode === 'year' && loopState?.currentKey === year ? activeYearRef : null}
                                onClick={() => handleYearClick(year)}
                                className={yearBtnClass(year)}
                            >{year}</button>
                        );
                    })}
                </div>
                {yearsCarousel.hasOverflow && yearsCarousel.canScrollRight && <CarouselArrow direction="right" onClick={() => yearsCarousel.scroll('right')} />}
            </div>
        </div>
    );
};

export default SimpleDateSelector;
