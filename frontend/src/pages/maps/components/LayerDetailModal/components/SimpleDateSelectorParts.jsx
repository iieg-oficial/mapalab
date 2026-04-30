import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import icoPlayNormal from '@assets/icons/ico_play_normal.svg';
import icoPlayHover from '@assets/icons/ico_play_hover.svg';
import icoPauseNormal from '@assets/icons/ico_pause_normal.svg';
import icoPauseHover from '@assets/icons/ico_pause_hover.svg';

const PLAY_PALETTE = {
    A: 'bg-[#F0EAF3] border-[#5C2472] text-[#5C2472] hover:bg-[#E2D1EB]',
    B: 'bg-[#FFF2E5] border-[#FF8300] text-[#FF8300] hover:bg-[#FFE4C4]',
    default: 'bg-[#FFF2E5] border-[#FF8300] text-[#FF8300] hover:bg-[#FFE4C4]',
};

const SECONDARY_PALETTE = {
    A: 'bg-[#F0EAF3] border-[#5C2472] text-[#5C2472] hover:bg-[#E2D1EB]',
    B: 'bg-[#FFF2E5] border-[#FF8300] text-[#FF8300] hover:bg-[#FFE4C4]',
    default: 'bg-[#F0EAF3] border-[#703089] text-[#703089] hover:bg-[#E2D1EB]',
};

const BADGE_PALETTE = {
    A: 'bg-[#F0EAF3] border-[#5C2472] text-[#5C2472]',
    B: 'bg-[#FFF2E5] border-[#FF8300] text-[#FF8300]',
    default: 'bg-[#F0EAF3] border-[#703089] text-[#703089]',
};

const DISABLED_CLASSES = 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed hover:bg-gray-100';

export const BackButton = ({ onClick }) => (
    <button onClick={onClick}>
        <Icon
            name="downArrow"
            tooltip="Regresar"
            classNameBG="bg-[#F9FBFF] size-7.5 rounded-full flex items-center justify-center p-2"
            className="w-5 h-2 transition-transform duration-300 rotate-90"
        />
    </button>
);

export const YearBadge = ({ year, slot }) => {
    const palette = BADGE_PALETTE[slot] || BADGE_PALETTE.default;
    return (
        <span className={`shrink-0 px-5 py-3 rounded-[9px] text-[14px]/[16px] font-medium font-garet border ${palette}`}>
            {year}
        </span>
    );
};

export const PlayPauseButton = ({ isPlaying, onToggle, slot, disabled = false, disabledHint }) => {
    const [isHovered, setIsHovered] = useState(false);
    const icon = isPlaying
        ? (isHovered ? icoPauseHover : icoPauseNormal)
        : (isHovered ? icoPlayHover : icoPlayNormal);
    const label = isPlaying ? 'PAUSAR' : 'VER ANIMACIÓN';
    const palette = disabled ? DISABLED_CLASSES : (PLAY_PALETTE[slot] || PLAY_PALETTE.default);

    const button = (
        <button
            onClick={disabled ? undefined : onToggle}
            disabled={disabled}
            onMouseEnter={() => !disabled && setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-[12px] border text-[8px]/[16px] font-bold font-garet transition-colors ${palette}`}
        >
            <img src={icon} alt="" className={`w-[10px] h-[10px] ${disabled ? 'opacity-50' : ''}`} />
            {label}
        </button>
    );

    return disabled && disabledHint ? <Tooltip content={disabledHint}>{button}</Tooltip> : button;
};

export const CarouselArrow = ({ direction, onClick }) => (
    <button onClick={onClick}>
        <Icon
            name="downArrow"
            tooltip={direction === 'left' ? 'Anterior' : 'Siguiente'}
            classNameBG="bg-[#F9FBFF] size-7.5 rounded-full flex items-center justify-center p-2"
            className={`w-5 h-2 transition-transform duration-300 ${direction === 'left' ? 'rotate-90' : '-rotate-90'}`}
        />
    </button>
);

const LOOP_INTERVAL_PRESETS = [250, 500, 1000, 2000, 3000];

const formatInterval = (ms) => {
    const s = ms / 1000;
    return `${s % 1 === 0 ? s : s.toFixed(2).replace(/\.?0+$/, '')}s`;
};

export const LoopIntervalButton = ({ value, onChange, slot, disabled = false }) => {
    const handleClick = () => {
        if (disabled) return;
        const idx = LOOP_INTERVAL_PRESETS.indexOf(value);
        const nextIdx = idx === -1 ? 0 : (idx + 1) % LOOP_INTERVAL_PRESETS.length;
        onChange(LOOP_INTERVAL_PRESETS[nextIdx]);
    };
    const palette = disabled ? DISABLED_CLASSES : (SECONDARY_PALETTE[slot] || SECONDARY_PALETTE.default);
    return (
        <Tooltip content="Cambiar velocidad del loop">
            <button
                onClick={handleClick}
                disabled={disabled}
                className={`flex items-center justify-center h-[30px] px-2 rounded-[12px] border text-[11px]/[16px] font-bold font-garet transition-colors tabular-nums min-w-[44px] ${palette}`}
            >
                {formatInterval(value)}
            </button>
        </Tooltip>
    );
};

export const LoopDirectionButton = ({ value, onChange, slot, disabled = false }) => {
    const isLtr = value !== 'rtl';
    const handleClick = () => !disabled && onChange(isLtr ? 'rtl' : 'ltr');
    const palette = disabled ? DISABLED_CLASSES : (SECONDARY_PALETTE[slot] || SECONDARY_PALETTE.default);
    return (
        <Tooltip content={isLtr ? 'Dirección: izquierda a derecha' : 'Dirección: derecha a izquierda'}>
            <button
                onClick={handleClick}
                disabled={disabled}
                className={`flex items-center justify-center h-[30px] w-[30px] rounded-[12px] border transition-colors ${palette}`}
            >
                <Icon
                    name="downArrow"
                    className={`w-4 h-2 transition-transform duration-300 ${isLtr ? '-rotate-90' : 'rotate-90'} ${disabled ? 'opacity-50' : ''}`}
                />
            </button>
        </Tooltip>
    );
};
