import { useMemo } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import DatePill from './DatePill';
import SlotBadge from './SlotBadge';
import { computeLabel } from './datePillHelpers';
import icoPauseNormal from '@assets/icons/ico_pause_normal.svg';
import icoPauseHover from '@assets/icons/ico_pause_hover.svg';
import icoPlayNormal from '@assets/icons/ico_play_normal.svg';
import icoPlayHover from '@assets/icons/ico_play_hover.svg';

const LOOP_PALETTE = {
    A: { primary: 'bg-[#F2EBFA] border-[#5C2472] hover:bg-[#E2D1EB]', secondary: 'bg-[#F2EBFA] border-[#5C2472] text-[#5C2472] hover:bg-[#E2D1EB]', icon: 'text-[#5C2472]' },
    B: { primary: 'bg-[#FFF2E5] border-[#FF8300] hover:bg-[#FFE4C4]', secondary: 'bg-[#FFF2E5] border-[#FF8300] text-[#FF8300] hover:bg-[#FFE4C4]', icon: 'text-[#FF8300]' },
    none: { primary: 'bg-[#FFF2E5] border-[#FF8300] hover:bg-[#FFE4C4]', secondary: 'bg-[#F0EAF3] border-[#703089] text-[#703089] hover:bg-[#E2D1EB]', icon: 'text-[#703089]' },
};

const DISABLED_PRIMARY = 'bg-gray-100 border-gray-300';
const DISABLED_SECONDARY = 'bg-gray-100 border-gray-300 text-gray-400';
const DISABLED_ICON = 'text-gray-400';

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
    const palette = LOOP_PALETTE[slotPalette] || LOOP_PALETTE.none;
    const slotLabel = slotPalette === 'A' || slotPalette === 'B' ? ` (lado ${slotPalette})` : '';
    const primaryClasses = disabled ? DISABLED_PRIMARY : palette.primary;
    const secondaryClasses = disabled ? DISABLED_SECONDARY : palette.secondary;
    const iconColor = disabled ? DISABLED_ICON : palette.icon;
    const playTooltip = disabled ? disabledHint : (isLooping ? 'Pausar animación' : 'Iniciar animación') + slotLabel;
    const intervalTooltip = disabled ? disabledHint : 'Cambiar velocidad' + slotLabel;
    const directionTooltip = disabled ? disabledHint : (loopDirection === 'rtl' ? 'Dirección: derecha a izquierda' : 'Dirección: izquierda a derecha') + slotLabel;

    const playButton = (
        <Tooltip content={playTooltip} key="play">
            <button
                onClick={onPlay}
                disabled={disabled || !canPlayLoop}
                className={`group/play flex items-center justify-center size-5 rounded-full border transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${primaryClasses}`}
            >
                {isLooping ? (
                    <>
                        <img src={icoPauseNormal} alt="" className="size-[10px] block group-hover/play:hidden" />
                        <img src={icoPauseHover} alt="" className="size-[10px] hidden group-hover/play:block" />
                    </>
                ) : (
                    <>
                        <img src={icoPlayNormal} alt="" className="size-[10px] block group-hover/play:hidden" />
                        <img src={icoPlayHover} alt="" className="size-[10px] hidden group-hover/play:block" />
                    </>
                )}
            </button>
        </Tooltip>
    );

    const intervalButton = (
        <Tooltip content={intervalTooltip} key="interval">
            <button
                onClick={onInterval}
                disabled={disabled}
                className={`flex items-center justify-center size-5 rounded-full border text-[9px] font-garet font-bold tabular-nums transition-colors shrink-0 disabled:cursor-not-allowed ${secondaryClasses}`}
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
                className={`flex items-center justify-center size-5 rounded-full border transition-colors shrink-0 disabled:cursor-not-allowed ${secondaryClasses}`}
            >
                <Icon name="downArrow" className={`w-3 h-1.5 transition-transform duration-300 ${iconColor} ${loopDirection === 'rtl' ? 'rotate-90' : '-rotate-90'}`} />
            </button>
        </Tooltip>
    );

    const extras = isLooping ? (mirror ? [directionButton, intervalButton] : [intervalButton, directionButton]) : [];
    const ordered = mirror ? [...extras, playButton] : [playButton, ...extras];
    return <>{ordered}</>;
};

const LayerDateControls = ({
    layerId,
    layer,
    rasterPeriodicity,
    compareMode,
    slotMembership,
    liveDateFilter,
    isLooping,
    isLoading,
    canPlayLoop,
    loopIntervalMs,
    loopDirection,
    onPillClick,
    onPlay,
    onInterval,
    onDirection,
    onCycleSlot
}) => {
    const isSwipe = !!compareMode?.active;

    const liveLabel = useMemo(() => computeLabel(liveDateFilter, rasterPeriodicity), [liveDateFilter, rasterPeriodicity]);
    const slotALabel = useMemo(() => computeLabel(compareMode?.paneA?.filters?.[layerId]?.date, rasterPeriodicity), [compareMode?.paneA?.filters, layerId, rasterPeriodicity]);
    const slotBLabel = useMemo(() => computeLabel(compareMode?.paneB?.filters?.[layerId]?.date, rasterPeriodicity), [compareMode?.paneB?.filters, layerId, rasterPeriodicity]);

    if (!layer.visible) return null;

    if (!isSwipe) {
        if (!liveLabel.label) return null;
        return (
            <div className="flex items-center gap-1 shrink-0">
                <DatePill slot="none" label={liveLabel.label} kind={liveLabel.kind} onClick={onPillClick} isLoopingPulse={isLooping && isLoading} />
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

    if (!slotMembership) return null;

    const isActiveA = compareMode.activeSlot === 'A';
    const inactiveHint = `Cambia al lado ${isActiveA ? 'B' : 'A'} para controlar este loop`;
    const showA = (slotMembership === 'A' || slotMembership === 'AB') && slotALabel.label;
    const showB = (slotMembership === 'B' || slotMembership === 'AB') && slotBLabel.label;

    if (slotMembership === 'AB') {
        return (
            <div className="flex items-center gap-1 w-full">
                <div className="flex items-center justify-end gap-1 flex-1 min-w-0">
                    {showA && <DatePill slot="A" label={slotALabel.label} kind={slotALabel.kind} onClick={onPillClick} isLoopingPulse={isActiveA && isLooping && isLoading} />}
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
                </div>
                <SlotBadge membership="AB" onCycle={onCycleSlot} />
                <div className="flex items-center justify-start gap-1 flex-1 min-w-0">
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
                    {showB && <DatePill slot="B" label={slotBLabel.label} kind={slotBLabel.kind} onClick={onPillClick} isLoopingPulse={!isActiveA && isLooping && isLoading} />}
                </div>
            </div>
        );
    }

    if (slotMembership === 'A') {
        return (
            <div className="flex items-center gap-1 shrink-0">
                {showA && <DatePill slot="A" label={slotALabel.label} kind={slotALabel.kind} onClick={onPillClick} isLoopingPulse={isActiveA && isLooping && isLoading} />}
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
                <SlotBadge membership="A" onCycle={onCycleSlot} />
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 shrink-0 ml-auto">
            <SlotBadge membership="B" onCycle={onCycleSlot} />
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
            {showB && <DatePill slot="B" label={slotBLabel.label} kind={slotBLabel.kind} onClick={onPillClick} isLoopingPulse={!isActiveA && isLooping && isLoading} />}
        </div>
    );
};

export default LayerDateControls;
