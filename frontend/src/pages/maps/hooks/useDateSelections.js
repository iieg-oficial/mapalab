import { useState } from 'react';

export const useDateSelections = (initialSelections = new Set()) => {
    const [expandedYear, setExpandedYear] = useState(() => {
        let yearToExpand = null;
        for (const selection of initialSelections) {
            const parts = selection.split('-');
            if (parts.length >= 2) {
                yearToExpand = parseInt(parts[0]);
                break;
            }
        }
        return yearToExpand;
    });

    const [expandedMonth, setExpandedMonth] = useState(() => {
        let monthToExpand = null;
        for (const selection of initialSelections) {
            const parts = selection.split('-');
            if (parts.length === 3) {
                monthToExpand = `${parts[0]}-${parts[1]}`;
                break;
            }
        }
        return monthToExpand;
    });

    const [selections, setSelections] = useState(initialSelections);

    const toggleYear = (year, yearData) => {
        const yearKey = String(year);
        const months = yearData ? Object.keys(yearData) : [];
        const isSingleMonth = months.length === 1;

        const isSelected = selections.has(yearKey) ||
            Array.from(selections).some(sel => sel.startsWith(`${year}-`));

        if (isSelected) {
            const newSelections = new Set(selections);
            newSelections.delete(yearKey);
            Array.from(selections).forEach(sel => {
                if (sel.startsWith(`${year}-`)) {
                    newSelections.delete(sel);
                }
            });
            setSelections(newSelections);
            setExpandedYear(null);
            setExpandedMonth(null);
        } else if (expandedYear === year) {
            setExpandedYear(null);
            setExpandedMonth(null);
        } else {
            setExpandedYear(year);
            setExpandedMonth(null);
            if (isSingleMonth) {
                const monthNum = parseInt(months[0]);
                setExpandedMonth(`${year}-${monthNum}`);
            }
        }
    };

    const handleYearClick = (year) => {
        const yearKey = String(year);
        const newSelections = new Set(selections);

        if (newSelections.has(yearKey)) {
            newSelections.delete(yearKey);
        } else {
            newSelections.add(yearKey);
        }
        setSelections(newSelections);
    };

    const toggleMonth = (year, month, yearData) => {
        const monthKey = `${year}-${month}`;
        const monthData = yearData[month];
        const hasDays = Array.isArray(monthData) && monthData.length > 0;

        const isSelected = selections.has(monthKey) ||
            Array.from(selections).some(sel => sel.startsWith(`${year}-${month}-`));

        if (isSelected) {
            const newSelections = new Set(selections);
            newSelections.delete(monthKey);
            Array.from(selections).forEach(sel => {
                if (sel.startsWith(`${year}-${month}-`)) {
                    newSelections.delete(sel);
                }
            });
            setSelections(newSelections);
            setExpandedMonth(null);
        } else if (expandedMonth === monthKey) {
            setExpandedMonth(null);
        } else if (hasDays) {
            setExpandedMonth(monthKey);
        }
    };

    const handleMonthClick = (year, month) => {
        const monthKey = `${year}-${month}`;
        const yearKey = String(year);
        const newSelections = new Set(selections);

        if (newSelections.has(yearKey)) {
            newSelections.delete(yearKey);
        }

        if (newSelections.has(monthKey)) {
            newSelections.delete(monthKey);
        } else {
            newSelections.add(monthKey);
        }
        setSelections(newSelections);
    };

    const handleDayClick = (year, month, day) => {
        const dayKey = `${year}-${month}-${day}`;
        const monthKey = `${year}-${month}`;
        const yearKey = String(year);
        const newSelections = new Set(selections);

        newSelections.delete(yearKey);
        newSelections.delete(monthKey);

        if (newSelections.has(dayKey)) {
            newSelections.delete(dayKey);
        } else {
            newSelections.add(dayKey);
        }

        setSelections(newSelections);
    };

    const clearAllSelections = () => {
        setSelections(new Set());
        setExpandedYear(null);
        setExpandedMonth(null);
    };

    const isYearActive = (year) => {
        const yearKey = String(year);
        if (selections.has(yearKey)) return true;
        return Array.from(selections).some(sel => sel.startsWith(`${year}-`));
    };

    const isMonthActive = (year, month) => {
        const monthKey = `${year}-${month}`;
        if (selections.has(monthKey)) return true;
        return Array.from(selections).some(sel => sel.startsWith(`${year}-${month}-`));
    };

    const isDayActive = (year, month, day) => {
        const dayKey = `${year}-${month}-${day}`;
        return selections.has(dayKey);
    };

    return {
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
    };
};
