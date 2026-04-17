import { useState, useRef, useEffect } from 'react';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useOutsideClick } from '@hooks/useOutsideClick';
import Icon from '@components/Icon';
import Badge from '@components/Badge';
import ScrollContainer from '@components/ScrollContainer';
import RotationControls from './RotationControls';
import { emojiCatalog } from '@pages/maps/helpers/emojiCatalog';

const EmojiPanel = ({ open, anchorRef, onSelect, onClose, rotation, onRotationChange, placedCount = 0 }) => {
    const [activeCategory, setActiveCategory] = useState(0);
    const panelRef = useRef(null);
    const { className: positionClass } = useSiderAdaptivePosition({ anchorRef: 'emojiPanel' });

    useOutsideClick(
        anchorRef ? [panelRef, anchorRef] : [panelRef],
        () => { if (open) onClose?.(); }
    );

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose?.();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    return (
        <div
            ref={panelRef}
            className={`
                fixed z-10 flex-col gap-2 ml-14 items-start w-[334px] max-md:max-w-[calc(100vw-5rem)] px-3 pb-3
                border border-transparent bg-[#F9FBFF] rounded-[12px] shadow-none
                ${open ? 'flex' : 'hidden'} ${positionClass}
            `}
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-5 font-garet font-bold text-[14px]/[47px] text-[#465055]">
                    Emojis
                    <Badge visible={placedCount > 0} count={placedCount} />
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="cursor-pointer"
                    aria-label="Cerrar panel de emojis"
                >
                    <Icon name="cerrarModal" className="size-7" />
                </button>
            </div>

            <div className="flex border-b border-gray-100 px-1 pt-1 gap-0.5 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                {emojiCatalog.map((cat, idx) => (
                    <button
                        key={cat.name}
                        type="button"
                        onClick={() => setActiveCategory(idx)}
                        className={`p-1.5 text-base rounded-t-lg shrink-0 transition-colors ${activeCategory === idx ? 'bg-[#F3EBFF]' : 'hover:bg-gray-50'}`}
                        title={cat.name}
                    >
                        {cat.icon}
                    </button>
                ))}
            </div>

            <ScrollContainer
                className="w-full max-h-56"
                overlayFade
                overlayColor="#F9FBFF"
                clickableArrows
                minItemsForClick={21}
                itemCount={emojiCatalog[activeCategory].emojis.length}
            >
                <div className="grid grid-cols-7 gap-0.5">
                    {emojiCatalog[activeCategory].emojis.map((emoji, idx) => (
                        <button
                            key={`${activeCategory}-${idx}`}
                            type="button"
                            onClick={() => onSelect?.(emoji)}
                            className="text-lg hover:bg-black/5 rounded-lg p-1 transition"
                            aria-label={`Insertar ${emoji}`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </ScrollContainer>

            <div className="w-full pt-1">
                <RotationControls showTitle={false} rotation={rotation} onChange={onRotationChange} />
            </div>
        </div>
    );
};

export default EmojiPanel;
