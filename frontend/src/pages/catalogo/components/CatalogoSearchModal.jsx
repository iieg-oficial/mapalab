import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '@hooks/useDebounce';
import { useOutsideClick } from '@hooks/useOutsideClick';

const SearchIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
    </svg>
);

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
        <div
            ref={containerRef}
            className="fixed left-1/2 -translate-x-1/2 bottom-15 z-30 w-[min(460px,90vw)] max-h-[80vh] flex flex-col items-stretch"
        >
            <div className={`${open ? 'flex' : 'hidden md:flex'} items-center justify-between gap-2 px-3 mb-2`}>
                <span className="text-[18px] font-bold text-purple font-garet">Catálogo</span>
                {open && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar buscador"
                        className="shrink-0 p-1.5 rounded-full text-[#6E7477] hover:text-purple hover:bg-purple-soft transition-colors"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            <div className={`grid transition-all duration-300 ease-out min-h-0 rounded-xl shadow-[0_6px_28px_rgba(26,38,100,0.22)] md:shadow-[0_-28px_64px_rgba(26,38,100,0.2)] ${open ? 'grid-rows-[1fr] opacity-100 mb-4' : 'grid-rows-[0fr] opacity-0 mb-0'}`}>
                <div className="min-h-0 overflow-hidden rounded-xl">
                    <div className="max-h-[calc(80vh-140px)] overflow-y-auto scrollbar-thin bg-white rounded-xl p-2">
                        {results.length === 0 ? (
                            <p className="px-3 py-4 text-center text-[16px] text-graphite font-garet">
                                Sin resultados
                            </p>
                        ) : (
                            results.map((c) => (
                                <button
                                    key={c.slug}
                                    onClick={() => onSelect(c.slug)}
                                    className="w-full text-left px-3 py-2.5 rounded-lg text-[16px] font-medium text-[#454545] font-garet hover:bg-orange/10 hover:text-purple transition-colors"
                                >
                                    {c.nombre}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={onOpen}
                aria-label="Abrir buscador del catálogo"
                className={`${open ? 'hidden' : 'flex md:hidden'} self-center items-center gap-2 px-4 py-2.5 rounded-full bg-white shadow-[0_8px_22px_#1A266429] text-purple font-garet text-[13px] font-bold`}
            >
                <SearchIcon className="w-4.5 h-4.5" />
                Catálogo
            </button>

            <div className={`${open ? 'flex' : 'hidden md:flex'} shrink-0 relative bg-white rounded-[10px] shadow-[0_6px_28px_rgba(26,38,100,0.22)] md:shadow-[0_-28px_64px_rgba(26,38,100,0.2)] overflow-hidden`}>
                <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={onOpen}
                    onKeyDown={handleKeyDown}
                    placeholder="Busca una capa para verla en el mapa"
                    className="w-full py-4 pl-4 pr-15.5 bg-transparent text-[13px] text-purple font-garet placeholder:text-[#191919] placeholder:opacity-70 focus:outline-none"
                />
                <button
                    onClick={onOpen}
                    className="absolute right-0 top-0 h-full w-12.75 flex items-center justify-center text-purple hover:bg-purple-deep hover:text-white transition-colors"
                    aria-label="Buscar"
                >
                    <SearchIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default CatalogoSearchModal;
