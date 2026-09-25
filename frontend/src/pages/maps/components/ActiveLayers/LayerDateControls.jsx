import { useMemo } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import DatePill from './DatePill';
import { computeLabel } from './datePillHelpers';
import { DEFAULT_LOOP_INTERVAL_MS, DEFAULT_LOOP_DIRECTION } from '@hooksMaps/useDateLoop';
import { RADIUS_ICON, toneButtonFor, toneTextClass } from '@pages/maps/helpers/periodicityTones';
import { slotLabel as etiquetaSlot } from '@pages/maps/helpers/swipeTheme';

const LOOP_BUTTON_BASE = `flex items-center justify-center size-6 ${RADIUS_ICON} shrink-0 disabled:cursor-not-allowed`;

const LoopControls = ({
    isLooping,
    canPlayLoop,
    loopIntervalMs,
    loopDirection,
    onPlay,
    onInterval,
    onDirection,
    slotPalette = 'none',
    mirror = false,
    disabled = false,
    disabledHint = ''
}) => {
    const slot = slotPalette === 'A' || slotPalette === 'B' ? slotPalette : null;
    const slotLabel = slot ? ` (lado ${etiquetaSlot(slot)})` : '';
    const play = toneButtonFor(slot, isLooping, { disabled });
    const interval = toneButtonFor(slot, (loopIntervalMs ?? DEFAULT_LOOP_INTERVAL_MS) !== DEFAULT_LOOP_INTERVAL_MS, { disabled });
    const direction = toneButtonFor(slot, (loopDirection ?? DEFAULT_LOOP_DIRECTION) !== DEFAULT_LOOP_DIRECTION, { disabled });
    const iconColor = disabled ? 'text-gray-400' : toneTextClass(direction.tone);
    const playTooltip = disabled ? disabledHint : (isLooping ? 'Pausar animación' : 'Iniciar animación') + slotLabel;
    const intervalTooltip = disabled ? disabledHint : 'Cambiar velocidad' + slotLabel;
    const directionTooltip = disabled ? disabledHint : (loopDirection === 'rtl' ? 'Dirección: derecha a izquierda' : 'Dirección: izquierda a derecha') + slotLabel;

    const playButton = (
        <Tooltip content={playTooltip} key="play">
            <button
                onClick={(e) => onPlay?.(e, slot || undefined)}
                disabled={disabled || !canPlayLoop}
                className={`${LOOP_BUTTON_BASE} disabled:opacity-50 ${play.className}`}
            >
                <Icon name={isLooping ? 'pause' : 'play'} className="size-2.5 shrink-0" />
            </button>
        </Tooltip>
    );

    const intervalButton = (
        <Tooltip content={intervalTooltip} key="interval">
            <button
                onClick={onInterval}
                disabled={disabled}
                className={`${LOOP_BUTTON_BASE} text-[9px] font-garet font-bold tabular-nums ${interval.className}`}
            >
                {(loopIntervalMs / 1000).toString().replace(/^0(?=\.)/, '').replace(/\.?0+$/, '') || '0'}s
            </button>
        </Tooltip>
    );

    const directionButton = (
        <Tooltip content={directionTooltip} key="direction">
            <button
                onClick={onDirection}
                disabled={disabled}
                className={`${LOOP_BUTTON_BASE} ${direction.className}`}
            >
                <Icon name="chevron" className={`w-3 h-1.5 transition-transform duration-300 ${iconColor} ${loopDirection === 'rtl' ? 'rotate-90' : '-rotate-90'}`} />
            </button>
        </Tooltip>
    );

    if (!canPlayLoop && !isLooping) return null;
    const ordered = mirror ? [directionButton, intervalButton, playButton] : [playButton, intervalButton, directionButton];
    return <>{ordered}</>;
};

const LayerDateControls = ({
    layerId,
    rasterPeriodicity,
    compareMode,
    slotMembership,
    liveDateFilter,
    isLooping,
    loopSlot = null,
    isLoading,
    canPlayLoop,
    loopIntervalMs,
    loopDirection,
    onPillClick,
    emptyLabel = null,
    pillTooltip,
    pillExpanded,
    onPlay,
    onInterval,
    onDirection
}) => {
    const isSwipe = !!compareMode?.active;

    const liveLabel = useMemo(() => computeLabel(liveDateFilter, rasterPeriodicity), [liveDateFilter, rasterPeriodicity]);
    const slotALabel = useMemo(() => computeLabel(compareMode?.paneA?.filters?.[layerId]?.date, rasterPeriodicity), [compareMode?.paneA?.filters, layerId, rasterPeriodicity]);
    const slotBLabel = useMemo(() => computeLabel(compareMode?.paneB?.filters?.[layerId]?.date, rasterPeriodicity), [compareMode?.paneB?.filters, layerId, rasterPeriodicity]);

    if (!isSwipe) {
        const label = liveLabel.label || emptyLabel;
        if (!label) return null;
        return (
            <div className="flex items-center gap-1 w-full">
                <DatePill slot="none" label={label} kind={liveLabel.kind} onClick={onPillClick} isLoopingPulse={isLooping && isLoading} size="lg" tooltip={pillTooltip} expanded={pillExpanded} />
                <LoopControls
                    isLooping={isLooping}
                    canPlayLoop={canPlayLoop}
                    loopIntervalMs={loopIntervalMs}
                    loopDirection={loopDirection}
                    onPlay={onPlay}
                    onInterval={onInterval}
                    onDirection={onDirection}
                    slotPalette="none"
                />
            </div>
        );
    }

    if (!(slotALabel.label || slotBLabel.label) || !slotMembership) return null;

    const controlSlot = isLooping && loopSlot ? loopSlot : compareMode.activeSlot;
    const isActiveA = controlSlot === 'A';
    const inactiveHint = `Cambia al lado ${isActiveA ? 'B' : 'A'} para controlar este loop`;
    const showA = (slotMembership === 'A' || slotMembership === 'AB') && slotALabel.label;
    const showB = (slotMembership === 'B' || slotMembership === 'AB') && slotBLabel.label;

    if (slotMembership === 'AB') {
        const hasLoopControls = canPlayLoop || isLooping;

        if (!hasLoopControls) {
            return (
                <div className="flex items-center gap-1 w-full">
                    {showA && <DatePill slot="A" label={slotALabel.label} kind={slotALabel.kind} onClick={onPillClick} size="lg" />}
                    <div className="flex-1" />
                    {showB && <DatePill slot="B" label={slotBLabel.label} kind={slotBLabel.kind} onClick={onPillClick} size="lg" />}
                </div>
            );
        }

        if (isActiveA) {
            return (
                <div className="flex items-center gap-1 w-full">
                    {showA && <DatePill slot="A" label={slotALabel.label} kind={slotALabel.kind} onClick={onPillClick} isLoopingPulse={isLooping && isLoading} size="lg" />}
                    <LoopControls
                        isLooping={isLooping}
                        canPlayLoop={canPlayLoop}
                        loopIntervalMs={loopIntervalMs}
                        loopDirection={loopDirection}
                        onPlay={onPlay}
                        onInterval={onInterval}
                        onDirection={onDirection}
                        slotPalette="A"
                    />
                    <div className="flex-1" />
                    {showB && <DatePill slot="B" label={slotBLabel.label} kind={slotBLabel.kind} onClick={onPillClick} size="lg" />}
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1 w-full">
                {showA && <DatePill slot="A" label={slotALabel.label} kind={slotALabel.kind} onClick={onPillClick} size="lg" />}
                <div className="flex-1" />
                <LoopControls
                    isLooping={isLooping}
                    canPlayLoop={canPlayLoop}
                    loopIntervalMs={loopIntervalMs}
                    loopDirection={loopDirection}
                    onPlay={onPlay}
                    onInterval={onInterval}
                    onDirection={onDirection}
                    slotPalette="B"
                    mirror
                />
                {showB && <DatePill slot="B" label={slotBLabel.label} kind={slotBLabel.kind} onClick={onPillClick} isLoopingPulse={isLooping && isLoading} size="lg" />}
            </div>
        );
    }

    if (slotMembership === 'A') {
        return (
            <div className="flex items-center gap-1 w-full">
                {showA && <DatePill slot="A" label={slotALabel.label} kind={slotALabel.kind} onClick={onPillClick} isLoopingPulse={isActiveA && isLooping && isLoading} size="lg" />}
                <LoopControls
                    isLooping={isActiveA && isLooping}
                    canPlayLoop={canPlayLoop}
                    loopIntervalMs={loopIntervalMs}
                    loopDirection={loopDirection}
                    onPlay={onPlay}
                    onInterval={onInterval}
                    onDirection={onDirection}
                    slotPalette="A"
                    disabled={!isActiveA}
                    disabledHint={inactiveHint}
                />
                <div className="flex-1" />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 w-full">
            <div className="flex-1" />
            <LoopControls
                isLooping={!isActiveA && isLooping}
                canPlayLoop={canPlayLoop}
                loopIntervalMs={loopIntervalMs}
                loopDirection={loopDirection}
                onPlay={onPlay}
                onInterval={onInterval}
                onDirection={onDirection}
                slotPalette="B"
                mirror
                disabled={isActiveA}
                disabledHint={inactiveHint}
            />
            {showB && <DatePill slot="B" label={slotBLabel.label} kind={slotBLabel.kind} onClick={onPillClick} isLoopingPulse={!isActiveA && isLooping && isLoading} size="lg" />}
        </div>
    );
};

export default LayerDateControls;
