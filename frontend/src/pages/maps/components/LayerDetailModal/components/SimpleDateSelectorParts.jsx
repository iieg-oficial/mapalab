import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { DEFAULT_LOOP_INTERVAL_MS, DEFAULT_LOOP_DIRECTION } from '@hooksMaps/useDateLoop';
import { RADIUS_ICON, RADIUS_LABEL, toneButtonFor, toneTextClass } from '@pages/maps/helpers/periodicityTones';

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
    const { className } = toneButtonFor(slot, true);
    return (
        <span className={`shrink-0 px-5 py-3 ${RADIUS_LABEL} text-[14px]/[16px] font-medium font-garet ${className}`}>
            {year}
        </span>
    );
};

export const PlayPauseButton = ({ isPlaying, onToggle, slot, disabled = false, disabledHint }) => {
    const label = isPlaying ? 'PAUSAR' : 'VER ANIMACIÓN';
    const { className } = toneButtonFor(slot, isPlaying, { disabled });

    const button = (
        <button
            onClick={disabled ? undefined : onToggle}
            disabled={disabled}
            className={`flex items-center gap-2 px-2 py-1.5 ${RADIUS_LABEL} text-[8px]/[16px] font-bold font-garet ${className}`}
        >
            <Icon name={isPlaying ? 'pause' : 'play'} className={`size-2.5 shrink-0 ${disabled ? 'opacity-50' : ''}`} />
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
    const { className } = toneButtonFor(slot, (value ?? DEFAULT_LOOP_INTERVAL_MS) !== DEFAULT_LOOP_INTERVAL_MS, { disabled });
    return (
        <Tooltip content="Cambiar velocidad del loop">
            <button
                onClick={handleClick}
                disabled={disabled}
                className={`flex items-center justify-center h-7.5 px-2 ${RADIUS_LABEL} text-[11px]/[16px] font-bold font-garet tabular-nums min-w-11 ${className}`}
            >
                {formatInterval(value)}
            </button>
        </Tooltip>
    );
};

export const LoopDirectionButton = ({ value, onChange, slot, disabled = false }) => {
    const isLtr = value !== 'rtl';
    const handleClick = () => !disabled && onChange(isLtr ? 'rtl' : 'ltr');
    const { tone, className } = toneButtonFor(slot, (value ?? DEFAULT_LOOP_DIRECTION) !== DEFAULT_LOOP_DIRECTION, { disabled });
    return (
        <Tooltip content={isLtr ? 'Dirección: izquierda a derecha' : 'Dirección: derecha a izquierda'}>
            <button
                onClick={handleClick}
                disabled={disabled}
                className={`flex items-center justify-center size-7.5 ${RADIUS_ICON} ${className}`}
            >
                <Icon
                    name="downArrow"
                    className={`w-4 h-2 transition-transform duration-300 ${isLtr ? '-rotate-90' : 'rotate-90'} ${disabled ? 'opacity-50 text-gray-400' : toneTextClass(tone)}`}
                />
            </button>
        </Tooltip>
    );
};
