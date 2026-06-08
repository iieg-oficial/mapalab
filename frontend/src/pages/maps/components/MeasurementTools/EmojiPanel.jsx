import { useState, useRef, useEffect, useMemo } from 'react';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useOutsideClick } from '@hooks/useOutsideClick';
import Icon from '@components/Icon';
import Badge from '@components/Badge';
import ScrollContainer from '@components/ScrollContainer';
import { useSymbolCatalog } from '@pages/maps/hooks/useSymbolCatalog';
import { svgToDataUrl } from '@pages/maps/helpers/drawingStyles';

const SymbolThumb = ({ symbol }) => {
    if (symbol.kind === 'svg' && symbol.value) {
        return <img src={svgToDataUrl(symbol.value)} alt={symbol.name || 'símbolo'} className="w-5 h-5 object-contain" />;
    }
    if (symbol.kind === 'image') {
        const url = symbol.imageUrl || symbol.image_url;
        return <img src={url} alt={symbol.name || 'símbolo'} className="w-5 h-5 object-contain" />;
    }
    return <>{symbol.value}</>;
};

const EmojiPanel = ({ open, anchorRef, onSelect, onClose, placedCount = 0 }) => {
    const [activeCategory, setActiveCategory] = useState(0);
    const panelRef = useRef(null);
    const { className: positionClass } = useSiderAdaptivePosition({ anchorRef: 'emojiPanel' });
    const { categories, loading } = useSymbolCatalog();

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

    const currentCategory = useMemo(() => {
        if (!categories.length) return null;
        return categories[Math.min(activeCategory, categories.length - 1)];
    }, [categories, activeCategory]);

    const symbols = currentCategory?.symbols || [];

    return (
        <div
            ref={panelRef}
            className={`
                fixed z-10 flex-col gap-2 ml-15 items-start w-[334px] max-md:max-w-[calc(100vw-5rem)] px-3 pb-3
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
            <div className="w-full rounded-[7px] bg-white">
                <div className="flex border-b border-gray-100 gap-0.5 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {categories.map((cat, idx) => (
                        <button
                            key={cat.id ?? cat.slug ?? cat.name}
                            type="button"
                            onClick={() => setActiveCategory(idx)}
                            className={`p-1.5 text-base rounded-t-lg shrink-0 transition-colors ${activeCategory === idx ? 'bg-[#F3EBFF]' : 'hover:bg-gray-50'}`}
                            title={cat.name}
                        >
                            {cat.icon || cat.name?.charAt(0) || '·'}
                        </button>
                    ))}
                </div>

                <ScrollContainer
                    className="w-full max-h-56"
                    overlayFade
                    overlayColor="#F9FBFF"
                    clickableArrows
                    minItemsForClick={21}
                    itemCount={symbols.length}
                >
                    {loading && !symbols.length ? (
                        <div className="text-center text-xs text-gray-400 p-4">Cargando…</div>
                    ) : (
                        <div className="grid grid-cols-7 gap-0.5">
                            {symbols.map((sym, idx) => (
                                <button
                                    key={sym.id ?? `${activeCategory}-${idx}`}
                                    type="button"
                                    onClick={() => onSelect?.(sym)}
                                    className="text-lg hover:bg-black/5 rounded-lg p-1 transition flex items-center justify-center"
                                    aria-label={`Insertar ${sym.name || sym.value || 'símbolo'}`}
                                >
                                    <SymbolThumb symbol={sym} />
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollContainer>
            </div>
        </div>
    );
};

export default EmojiPanel;
