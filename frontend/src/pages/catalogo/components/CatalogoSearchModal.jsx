import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '@hooks/useDebounce';
import { useOutsideClick } from '@hooks/useOutsideClick';

const CatalogoSearchModal = ({ capas, open, onOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const debounced = useDebounce(query, 300);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    useOutsideClick([containerRef], () => {
        if (open) onClose();
    });

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const results = useMemo(() => {
        const q = debounced.trim().toLowerCase();
        if (!q) return capas;
        return capas.filter((c) => {
            const inName = c.nombre?.toLowerCase().includes(q);
            const inTags = (c.searchTags || []).some((t) => t.toLowerCase().includes(q));
            return inName || inTags;
        });
    }, [capas, debounced]);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    return (
        <div ref={containerRef} className="fixed left-1/2 -translate-x-1/2 bottom-6 z-30 w-[min(460px,90vw)]">
            {open && (
                <div className="mb-2.5 bg-white rounded-xl shadow-[0_8px_22px_#1A266429] p-2 max-h-[calc(100dvh-180px)] overflow-y-auto scrollbar-thin">
                    {results.length === 0 ? (
                        <p className="px-3 py-4 text-center text-[13px] text-graphite font-garet">
                            Sin resultados
                        </p>
                    ) : (
                        results.map((c) => (
                            <button
                                key={c.slug}
                                onClick={() => onSelect(c.slug)}
                                className="w-full text-left px-3 py-2.5 rounded-lg text-[13px] text-[#454545] font-garet hover:bg-orange/10 hover:text-purple transition-colors"
                            >
                                {c.nombre}
                            </button>
                        ))
                    )}
                </div>
            )}
            <div className="relative">
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={onOpen}
                    onKeyDown={handleKeyDown}
                    placeholder="Busca una capa para verla en el mapa"
                    className="w-full py-4 pl-4 pr-15.5 border border-[#ECEAF1] bg-white rounded-[10px] text-[13px] text-purple font-garet shadow-[0_8px_22px_#1A266429] placeholder:text-[#191919] placeholder:opacity-70 focus:outline-2 focus:outline-purple"
                />
                <button
                    onClick={onOpen}
                    className="absolute right-0 top-0 h-full w-12.75 rounded-r-[10px] flex items-center justify-center text-purple hover:bg-purple-deep hover:text-white transition-colors"
                    aria-label="Buscar"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M21 21l-4.3-4.3" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default CatalogoSearchModal;
