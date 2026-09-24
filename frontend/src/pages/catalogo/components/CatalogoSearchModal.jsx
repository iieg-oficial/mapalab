import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from '@hooks/useDebounce';
import { useOutsideClick } from '@hooks/useOutsideClick';
import CatalogoSearchInput, { SearchIcon } from './CatalogoSearchInput';
import CatalogoShare from './CatalogoShare';
import CatalogoInstitucionesList from './CatalogoInstitucionesList';
import CatalogoCapasLista from './CatalogoCapasLista';
import { buildCatalogoShareUrl, filterCapas } from '../helpers/catalogoRoutes';
import { PANEL_SHADOW, STACK_SPACING, TITLE_PILL, Z_CAPAS } from '../helpers/catalogoStyles';
import { trackCatalogoSearch, trackCatalogoShare } from '@services/analyticsService';

const CloseIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L6 18M6 6l12 12" />
    </svg>
);

const CopyIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="12" height="12" rx="2.5" />
        <path d="M6 15H4.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V6" />
    </svg>
);

const PILL = 'shrink-0 px-3 py-1 rounded-full backdrop-blur-md text-[12px] font-garet font-bold transition-colors cursor-pointer';
const PILL_TODAS = {
    on: 'bg-purple-deep text-white',
    off: 'text-purple hover:bg-purple-deep hover:text-white',
};
const PILL_INSTITUCION = {
    on: 'bg-orange text-white',
    off: 'text-orange hover:bg-orange hover:text-white',
};

const CatalogoSearchModal = ({
    capas,
    instituciones = [],
    institucionActiva = null,
    conteosPorInstitucion = {},
    totalCapas = 0,
    onSelectInstitucion,
    open,
    onOpen,
    onClose,
    onSelect,
    onEditInfobox = null,
}) => {
    const [query, setQuery] = useState('');
    const [shareOpen, setShareOpen] = useState(false);
    const [listaOpen, setListaOpen] = useState(false);
    const debounced = useDebounce(query, 300);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    useOutsideClick([containerRef], () => {
        if (open) onClose();
    });

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        setShareOpen(false);
    }, [institucionActiva]);

    useEffect(() => {
        setListaOpen(open);
    }, [open]);

    const handleSelectInstitucion = (slug) => {
        onOpen();
        onSelectInstitucion(slug);
    };

    const results = useMemo(
        () => filterCapas(capas, { query: debounced }),
        [capas, debounced],
    );

    useEffect(() => {
        const q = debounced.trim();
        if (!q) return;
        trackCatalogoSearch({ query: q, results: results.length });
    }, [debounced, results.length]);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    };

    const headerVisibility = open ? 'flex' : 'hidden md:flex';
    const paralelo = open && listaOpen;
    const altoCapas = listaOpen
        ? `max-h-[calc(30vh-70px)] ${paralelo ? 'md:max-h-[calc(60vh-70px)]' : ''}`
        : 'max-h-[calc(80vh-140px)]';
    const listaInstituciones = (maxHeight) => (
        <CatalogoInstitucionesList
            instituciones={instituciones}
            institucionActiva={institucionActiva}
            conteos={conteosPorInstitucion}
            totalCapas={totalCapas}
            maxHeight={maxHeight}
            onSelect={handleSelectInstitucion}
        />
    );

    return (
        <div
            ref={containerRef}
            className={`fixed left-1/2 -translate-x-1/2 bottom-15 z-30 w-[min(460px,90vw)] ${paralelo ? 'md:w-[min(780px,94vw)]' : ''} max-h-[80vh] flex flex-col items-stretch`}
        >
            <div className={`${headerVisibility} relative z-30 items-center justify-between gap-2 ${STACK_SPACING}`}>
                <div className="min-w-0 flex items-center gap-2">
                    {institucionActiva && (
                        <div className="relative shrink-0">
                            <button
                                type="button"
                                onClick={() => setShareOpen((v) => !v)}
                                aria-pressed={shareOpen}
                                aria-label={`Compartir el catálogo de ${institucionActiva.nombre}`}
                                title={`Compartir el catálogo de ${institucionActiva.nombre}`}
                                className={`p-1.5 rounded-full transition-colors ${shareOpen
                                    ? 'bg-purple-soft text-purple'
                                    : 'text-[#6E7477] hover:text-purple hover:bg-purple-soft'}`}
                            >
                                <CopyIcon className="w-4.5 h-4.5" />
                            </button>

                            {shareOpen && (
                                <div className={`absolute bottom-full left-0 mb-2 w-[min(260px,80vw)] px-3.5 py-3 bg-white rounded-xl ${PANEL_SHADOW}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-[12px] font-garet text-graphite">
                                            Comparte el catálogo de{' '}
                                            <span className="font-bold text-orange">{institucionActiva.nombre}</span>.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setShareOpen(false)}
                                            aria-label="Cerrar"
                                            className="shrink-0 -mt-1 -mr-1 p-1 rounded-full text-[#6E7477] hover:text-purple hover:bg-purple-soft transition-colors"
                                        >
                                            <CloseIcon className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <CatalogoShare
                                        url={buildCatalogoShareUrl({ institucionSlug: institucionActiva.slug })}
                                        filename={`mapalab-catalogo-${institucionActiva.slug}`}
                                        onShare={(type) => trackCatalogoShare({
                                            scope: 'institucion',
                                            slug: institucionActiva.slug,
                                            type,
                                        })}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                    {institucionActiva ? (
                        <div className={`min-w-0 flex items-baseline gap-1.5 ${TITLE_PILL}`}>
                            <span className="truncate text-[18px] font-bold text-orange font-garet leading-tight">
                                {institucionActiva.nombre}
                            </span>
                            <span className="shrink-0 text-[11px] font-garet font-bold text-purple leading-tight">
                                catálogo
                            </span>
                        </div>
                    ) : (
                        <span className={`inline-flex items-center text-[18px] font-bold text-purple font-garet ${TITLE_PILL}`}>
                            Catálogo
                        </span>
                    )}
                </div>

                {open && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar buscador"
                        className="shrink-0 p-1.5 rounded-full text-[#6E7477] hover:text-purple hover:bg-purple-soft transition-colors"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className={paralelo ? 'md:flex md:items-end md:gap-3' : ''}>
                {paralelo && (
                    <div className="hidden md:block md:w-[280px] md:shrink-0">
                        {listaInstituciones('max-h-[calc(60vh-70px)]')}
                    </div>
                )}
                <div className="md:flex-1 md:min-w-0">
                    <div className={`${Z_CAPAS} ${PANEL_SHADOW} grid transition-all duration-300 ease-out min-h-0 rounded-xl ${open ? `grid-rows-[1fr] opacity-100 ${STACK_SPACING}` : 'grid-rows-[0fr] opacity-0 mb-0'}`}>
                        <div className="min-h-0 overflow-hidden rounded-xl">
                            <CatalogoCapasLista
                                results={results}
                                alto={altoCapas}
                                fromSearch={!!debounced.trim()}
                                onSelect={onSelect}
                                onEditInfobox={onEditInfobox}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {instituciones.length > 0 && (
                <>
                    <div className={`${headerVisibility} shrink-0 items-center gap-1.5 ${STACK_SPACING}`}>
                        <div className="min-w-0 flex items-center gap-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                            <button
                                type="button"
                                onClick={() => handleSelectInstitucion(null)}
                                aria-pressed={!institucionActiva}
                                className={`${PILL} ${!institucionActiva ? PILL_TODAS.on : PILL_TODAS.off}`}
                            >
                                Todas
                            </button>
                            {instituciones.map((institucion) => (
                                <button
                                    key={institucion.slug}
                                    type="button"
                                    onClick={() => handleSelectInstitucion(institucion.slug)}
                                    aria-pressed={institucionActiva?.slug === institucion.slug}
                                    className={`${PILL} ${institucionActiva?.slug === institucion.slug
                                        ? PILL_INSTITUCION.on
                                        : PILL_INSTITUCION.off}`}
                                >
                                    {institucion.nombre}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setListaOpen((v) => !v)}
                            aria-pressed={listaOpen}
                            aria-label={listaOpen ? 'Cerrar la lista de instituciones' : 'Ver todas las instituciones'}
                            title={listaOpen ? 'Cerrar la lista' : 'Ver todas las instituciones'}
                            className={`ml-auto shrink-0 flex items-center justify-center size-7 rounded-full transition-colors cursor-pointer ${listaOpen
                                ? 'text-orange bg-orange/15 hover:bg-orange/25'
                                : 'text-purple hover:bg-purple-soft'}`}
                        >
                            <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-transform ${listaOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 15l6-6 6 6" />
                            </svg>
                        </button>
                    </div>

                    {listaOpen && (
                        <div className={paralelo ? 'md:hidden' : ''}>
                            {listaInstituciones(open ? 'max-h-[calc(50vh-70px)]' : 'max-h-[45vh]')}
                        </div>
                    )}
                </>
            )}

            <button
                type="button"
                onClick={onOpen}
                aria-label="Abrir buscador del catálogo"
                className={`${open ? 'hidden' : 'flex md:hidden'} self-center items-center gap-2 px-4 py-2.5 rounded-full bg-white shadow-[0_8px_22px_#1A266429] text-purple font-garet text-[13px] font-bold`}
            >
                <SearchIcon className="w-4.5 h-4.5" />
                {institucionActiva ? institucionActiva.nombre : 'Catálogo'}
            </button>

            <CatalogoSearchInput
                visibility={headerVisibility}
                inputRef={inputRef}
                query={query}
                onQuery={setQuery}
                onOpen={onOpen}
                onKeyDown={handleKeyDown}
            />
        </div>
    );
};

export default CatalogoSearchModal;
