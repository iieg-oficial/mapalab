import { useState, useEffect, useMemo, useRef, useContext } from 'react';
import MapsContext from '@contexts/MapsContext';
import { generateCQLFilter, parseCQLToSelections, MONTHS } from '@pages/maps/helpers/dateFilterHelpers';
import Icon from '@components/Icon';

const SimpleDateSelector = ({ layerId, periodicity, onFilterApply, onClearFilter, filterName = 'date' }) => {
    const { getSpecificFilter } = useContext(MapsContext);

    const periodicityData = useMemo(() => {
        if (!periodicity) return null;
        const fecha = periodicity.fecha || periodicity;
        if (!fecha || typeof fecha !== 'object') return null;
        return { fecha, filterColumn: 'fecha' };
    }, [periodicity]);

    const initialState = useMemo(() => {
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
    }, [layerId, filterName, getSpecificFilter]);

    const [selectedYear, setSelectedYear] = useState(initialState.year);
    const [selectedMonths, setSelectedMonths] = useState(initialState.months);

    const onFilterApplyRef = useRef(onFilterApply);
    const onClearFilterRef = useRef(onClearFilter);

    useEffect(() => {
        onFilterApplyRef.current = onFilterApply;
        onClearFilterRef.current = onClearFilter;
    });

    useEffect(() => {
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
    }, [selectedYear, selectedMonths, periodicityData, filterName]);

    if (!periodicityData?.fecha || typeof periodicityData.fecha !== 'object') return null;

    const availableYears = Object.keys(periodicityData.fecha).map(Number).sort((a, b) => b - a);
    if (availableYears.length === 0) return null;

    const handleYearClick = (year) => {
        setSelectedYear(year);
        setSelectedMonths(new Set());
    };

    const handleBackToYears = () => {
        setSelectedYear(null);
        setSelectedMonths(new Set());
    };

    const handleMonthToggle = (monthNum) => {
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
        setSelectedMonths(new Set());
    };

    const hasSelection = selectedMonths.size > 0;

    if (selectedYear !== null) {
        const yearData = periodicityData.fecha[selectedYear];
        const availableMonthNums = yearData ? Object.keys(yearData).map(Number).sort((a, b) => a - b) : [];

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
                    {hasSelection && (
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
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                    {availableMonthNums.map((monthNum) => {
                        const monthObj = MONTHS.find(m => m.num === monthNum);
                        const abbr = monthObj ? monthObj.name.slice(0, 3).toUpperCase() : monthNum;
                        const isActive = selectedMonths.has(monthNum);

                        return (
                            <button
                                key={`${selectedYear}-${monthNum}`}
                                onClick={() => handleMonthToggle(monthNum)}
                                className={`
                                    py-2 rounded-[9px] transition-all duration-200
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
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
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
        </div>
    );
};

export default SimpleDateSelector;
