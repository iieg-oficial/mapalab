import { createPortal } from 'react-dom';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useHoverPopover } from '@hooks/useHoverPopover';

const MODES = [
    { key: 'auto', label: 'Automático', hint: 'Se acomoda solo', letter: 'A' },
    { key: 'expanded', label: 'Expandido', hint: 'Siempre abierto', rotate: '-rotate-90' },
    { key: 'collapsed', label: 'Colapsado', hint: 'Solo iconos', rotate: 'rotate-90' },
    { key: 'mobile', label: 'Mobile', hint: 'Vista de celular', rotate: 'rotate-180' },
];

const EDGE_BUTTON = 'size-5 rounded-full bg-white flex items-center justify-center shadow-[0_5px_20px_#1A26641A] cursor-pointer';
const OPTION_BASE = 'size-6 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer';
const OPTION_ON = 'bg-orange text-white';
const OPTION_OFF = 'text-purple hover:bg-[#F9FBFF]';
const LETTER_CLASS = 'font-garet text-[10px] font-bold leading-none';

const ModeGlyph = ({ mode }) => (
    mode.letter
        ? <span className={LETTER_CLASS}>{mode.letter}</span>
        : <Icon name="chevron" className={['size-3', mode.rotate].join(' ')} />
);

const buttonGlyph = (mode, isExpanded) => (
    mode.key === 'auto'
        ? { key: 'auto', rotate: isExpanded ? 'rotate-90' : '-rotate-90' }
        : mode
);

const SiderModeButton = ({ lockMode, isExpanded = false, onToggle, onSelect }) => {
    const { open, position, anchorRef, hoverProps, close } = useHoverPopover();
    const current = MODES.find(m => m.key === lockMode) || MODES[0];

    const handleClick = (e) => {
        e.stopPropagation();
        onToggle();
    };

    const handleSelect = (e, mode) => {
        e.stopPropagation();
        close();
        onSelect(mode);
    };

    const panel = (
        <div
            {...hoverProps}
            style={{ top: position.top, left: position.left }}
            className="fixed z-[9999] -translate-y-1/2 flex items-center gap-1 rounded-full bg-white p-1 shadow-[0_5px_20px_#1A26641A]"
        >
            {MODES.map(mode => (
                <Tooltip
                    key={mode.key}
                    content={`${mode.label} — ${mode.hint}`}
                    placement="bottom"
                    delay={200}
                    variant="soft"
                >
                    <button
                        type="button"
                        onClick={(e) => handleSelect(e, mode.key)}
                        aria-label={mode.label}
                        aria-pressed={lockMode === mode.key}
                        className={[OPTION_BASE, lockMode === mode.key ? OPTION_ON : OPTION_OFF].join(' ')}
                    >
                        <ModeGlyph mode={mode} />
                    </button>
                </Tooltip>
            ))}
        </div>
    );

    return (
        <div ref={anchorRef} {...hoverProps} className="flex items-center">
            <button
                type="button"
                onClick={handleClick}
                aria-label={`Modo del sider: ${current.label}`}
                className={`${EDGE_BUTTON} text-purple`}
            >
                <ModeGlyph mode={buttonGlyph(current, isExpanded)} />
            </button>
            {open && createPortal(panel, document.body)}
        </div>
    );
};

export default SiderModeButton;
