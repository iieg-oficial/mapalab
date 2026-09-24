import ScrollContainer from '@components/ScrollContainer';

const CatalogoCapasLista = ({ results, alto, fromSearch, onSelect, onEditInfobox }) => (
    <ScrollContainer
        className={`${alto} bg-white rounded-xl`}
        overlayFade
        overlayColor="#FFFFFF"
        clickableArrows
        minItemsForClick={12}
        itemCount={results.length}
    >
        {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-[16px] text-graphite font-garet">
                Sin resultados
            </p>
        ) : (
            results.map((c) => (
                <div key={c.slug} className="group/item relative flex items-center rounded-lg hover:bg-orange/10 transition-colors">
                    <button
                        onClick={() => onSelect(c.slug, { fromSearch })}
                        className="flex-1 min-w-0 text-left px-3 py-2.5 pr-9 text-[16px] font-medium text-[#454545] font-garet group-hover/item:text-purple transition-colors truncate cursor-pointer"
                    >
                        {c.nombre}
                    </button>
                    {onEditInfobox && (
                        <button
                            type="button"
                            onClick={() => onEditInfobox(c)}
                            aria-label={`Personalizar la tarjeta de ${c.nombre}`}
                            title="Personalizar la tarjeta de información"
                            className="absolute right-1.5 size-7 rounded-full flex items-center justify-center text-purple opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100 hover:bg-purple-soft transition-opacity cursor-pointer"
                        >
                            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                        </button>
                    )}
                </div>
            ))
        )}
    </ScrollContainer>
);

export default CatalogoCapasLista;
