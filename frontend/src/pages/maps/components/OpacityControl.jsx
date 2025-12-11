import { useState, useRef, useEffect } from 'react';
import { useOutsideClick } from '@hooks/useOutsideClick';

const OpacityControl = ({ value = 1, onChange }) => {
    const currentPercentage = Math.round(value * 100);
    const [inputValue, setInputValue] = useState(currentPercentage.toString());
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    useOutsideClick([containerRef], () => {
        if (isExpanded) {
            const numValue = parseInt(inputValue, 10);
            if (!isNaN(numValue)) {
                const clampedValue = Math.max(0, Math.min(100, numValue));
                onChange?.(clampedValue / 100);
                setInputValue(clampedValue.toString());
            } else {
                setInputValue(currentPercentage.toString());
            }
            setIsExpanded(false);
        }
    });

    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isExpanded]);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isExpanded) {
                setInputValue(currentPercentage.toString());
                setIsExpanded(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isExpanded, currentPercentage]);

    const handleSliderChange = (e) => {
        const percentage = parseInt(e.target.value, 10);
        onChange?.(percentage / 100);
        setInputValue(percentage.toString());
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        const numValue = parseInt(inputValue, 10);
        if (!isNaN(numValue)) {
            const clampedValue = Math.max(0, Math.min(100, numValue));
            onChange?.(clampedValue / 100);
            setInputValue(clampedValue.toString());
        } else {
            setInputValue(currentPercentage.toString());
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleInputBlur();
        }
    };

    const handlePercentageClick = () => {
        setInputValue(currentPercentage.toString());
        setIsExpanded(true);
    };

    return (
        <div ref={containerRef} className="space-y-2">
            <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-700">
                    <span className="sm:hidden">Opacidad:</span>
                    <span className="hidden sm:inline">Opacidad de la capa:</span>
                </span>
                {isExpanded ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        className="w-16 text-center font-semibold text-blue-600 bg-[#EAEFFA] rounded-[9px] px-2 py-1 outline-none"
                    />
                ) : (
                    <button
                        type="button"
                        onClick={handlePercentageClick}
                        className="font-semibold text-blue-600 hover:text-blue-700 transition bg-[#EAEFFA] rounded-[9px] px-2 py-1"
                    >
                        {currentPercentage}%
                    </button>
                )}
            </div>
            {isExpanded && (
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentPercentage}
                    onChange={handleSliderChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    aria-label="Opacidad"
                />
            )}
        </div>
    );
};

export default OpacityControl;
