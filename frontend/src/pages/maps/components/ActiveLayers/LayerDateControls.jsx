import { useMemo } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import DatePill from './DatePill';
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

const LoopControls = ({ isLooping, canPlayLoop, loopIntervalMs, loopDirection, onPlay, onInterval, onDirection, slotPalette = 'none' }) => {
    const palette = LOOP_PALETTE[slotPalette] || LOOP_PALETTE.none;
    const slotLabel = slotPalette === 'A' || slotPalette === 'B' ? ` (lado ${slotPalette})` : '';
    return (
        <>
            <Tooltip content={(isLooping ? 'Pausar animación' : 'Iniciar animación') + slotLabel}>
                <button
                    onClick={onPlay}
                    disabled={!canPlayLoop}
                    className={`group/play items-center justify-center size-[22px] rounded-full border transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${palette.primary} ${isLooping ? 'flex' : 'hidden md:group-hover:flex'}`}
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
            <Tooltip content={'Cambiar velocidad' + slotLabel}>
                <button
                    onClick={onInterval}
                    className={`items-center justify-center size-[22px] rounded-full border text-[9px] font-garet font-bold tabular-nums transition-colors shrink-0 ${palette.secondary} ${isLooping ? 'flex' : 'hidden md:group-hover:flex'}`}
                >
                    {(loopIntervalMs / 1000).toString().replace(/^0(?=\.)/, '').replace(/\.?0+$/, '') || '0'}s
                </button>
            </Tooltip>
            <Tooltip content={(loopDirection === 'rtl' ? 'Dirección: derecha a izquierda' : 'Dirección: izquierda a derecha') + slotLabel}>
                <button
                    onClick={onDirection}
                    className={`items-center justify-center size-[22px] rounded-full border transition-colors shrink-0 ${palette.secondary} ${isLooping ? 'flex' : 'hidden md:group-hover:flex'}`}
                >
                    <Icon name="downArrow" className={`w-3 h-1.5 transition-transform duration-300 ${palette.icon} ${loopDirection === 'rtl' ? 'rotate-90' : '-rotate-90'}`} />
                </button>
            </Tooltip>
        </>
    );
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
                <LoopControls isLooping={isLooping} canPlayLoop={canPlayLoop} loopIntervalMs={loopIntervalMs} loopDirection={loopDirection} onPlay={onPlay} onInterval={onInterval} onDirection={onDirection} slotPalette={isSwipe ? compareMode.activeSlot : 'none'} />
            </div>
        );
    }

    const showA = (slotMembership === 'A' || slotMembership === 'AB') && slotALabel.label;
    const showB = (slotMembership === 'B' || slotMembership === 'AB') && slotBLabel.label;
    if (!showA && !showB) return null;

    const isActiveA = compareMode.activeSlot === 'A';
    return (
        <div className="flex items-center gap-1 shrink-0">
            {showA && <DatePill slot="A" label={slotALabel.label} kind={slotALabel.kind} onClick={onPillClick} isLoopingPulse={isActiveA && isLooping && isLoading} />}
            {showB && <DatePill slot="B" label={slotBLabel.label} kind={slotBLabel.kind} onClick={onPillClick} isLoopingPulse={!isActiveA && isLooping && isLoading} />}
            <LoopControls isLooping={isLooping} canPlayLoop={canPlayLoop} loopIntervalMs={loopIntervalMs} loopDirection={loopDirection} onPlay={onPlay} onInterval={onInterval} onDirection={onDirection} />
        </div>
    );
};

export default LayerDateControls;
