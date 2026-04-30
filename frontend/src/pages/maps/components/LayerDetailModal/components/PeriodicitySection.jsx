import { useCallback, useRef } from 'react';
import Icon from '@components/Icon';
import Loading from '@components/Loading';
import DateTreeSelector from './DateTreeSelector';
import SimpleDateSelector from './SimpleDateSelector';
import { PlayPauseButton, LoopIntervalButton, LoopDirectionButton } from './SimpleDateSelectorParts';

const PeriodicitySection = ({
    layerId,
    label = null,
    periodicity,
    rasterPeriodicity,
    periodicityLoading,
    isAdvancedMode,
    onAdvancedToggle,
    onFilterApply,
    onClearFilter,
    onClearDateFilter,
    onExpandedYearChange,
    singleSelectOnly,
    hasDateFilter,
    showLoopControls,
    canPlay,
    isLoopPlaying,
    layerIntervalMs,
    layerDirection,
    onSetLoopIntervalMs,
    onSetLoopDirection,
    onTogglePeriodicityLoop,
    getSpecificFilterOverride,
    slot,
    loopDisabled = false,
    loopDisabledHint,
}) => {
    const longPressRef = useRef(null);

    const handleClick = useCallback((e) => {
        if (e.ctrlKey || e.metaKey) onAdvancedToggle?.();
    }, [onAdvancedToggle]);

    const handleTouchStart = useCallback(() => {
        longPressRef.current = setTimeout(() => {
            longPressRef.current = 'fired';
            onAdvancedToggle?.();
        }, 1000);
    }, [onAdvancedToggle]);

    const handleTouchEnd = useCallback(() => {
        if (longPressRef.current && longPressRef.current !== 'fired') clearTimeout(longPressRef.current);
        longPressRef.current = null;
    }, []);

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between gap-2 my-5 flex-wrap">
                <div className="flex items-center gap-2">
                    <button type="button" className="text-[14px]/[16px] font-garet font-bold text-[#5C2472] tracking-normal select-none cursor-pointer" onClick={handleClick} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}>
                        Periodicidad{label ? ` ${label}` : ''}:
                    </button>
                    {isAdvancedMode && (
                        <Icon name="info_warning" className="size-4 cursor-help" tooltip="Click simple: navegar opciones. Doble click: seleccionar fecha. Click en seleccionado: deseleccionar." />
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {showLoopControls && canPlay && (
                        <>
                            <LoopIntervalButton value={layerIntervalMs} onChange={onSetLoopIntervalMs} slot={slot} disabled={loopDisabled} />
                            <LoopDirectionButton value={layerDirection} onChange={onSetLoopDirection} slot={slot} disabled={loopDisabled} />
                            <PlayPauseButton isPlaying={isLoopPlaying} onToggle={onTogglePeriodicityLoop} slot={slot} disabled={loopDisabled} disabledHint={loopDisabledHint} />
                        </>
                    )}
                    {hasDateFilter && (
                        <button onClick={onClearDateFilter} className="inline-flex items-center justify-center h-[30px] leading-none align-middle">
                            <Icon tooltip="Eliminar filtro" name="eliminar" state="hover" className="size-5 cursor-pointer block" />
                        </button>
                    )}
                </div>
            </div>
            {periodicityLoading ? (
                <div className="flex items-center gap-2 py-4">
                    <Loading visible size="size-5" border="border-2" color="border-[#703089]" />
                    <span className="text-[12px] font-garet text-[#465055]">Cargando periodicidad...</span>
                </div>
            ) : isAdvancedMode && !rasterPeriodicity ? (
                <DateTreeSelector layerId={layerId} periodicity={periodicity} onFilterApply={onFilterApply} onClearFilter={onClearFilter} filterName="date" singleSelectOnly={singleSelectOnly} getSpecificFilterOverride={getSpecificFilterOverride} />
            ) : (
                <SimpleDateSelector layerId={layerId} periodicity={periodicity} rasterPeriodicity={rasterPeriodicity} onFilterApply={onFilterApply} onClearFilter={onClearFilter} filterName="date" singleSelectOnly={singleSelectOnly} onExpandedYearChange={onExpandedYearChange} getSpecificFilterOverride={getSpecificFilterOverride} slot={slot} />
            )}
        </div>
    );
};

export default PeriodicitySection;
