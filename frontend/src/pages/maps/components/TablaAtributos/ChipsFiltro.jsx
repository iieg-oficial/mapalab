const ChipsFiltro = ({ chips, onQuitar, onLimpiar, compacto = false }) => {
    if (!chips || chips.length === 0) return null;

    return (
        <div className={`flex items-center gap-1.5 ${compacto ? '' : 'flex-wrap'} min-w-0`}>
            {chips.map(chip => (
                <span
                    key={chip.columna || chip.etiqueta}
                    title={chip.fijo ? `${chip.etiqueta} · viene de la selección del mapa` : chip.etiqueta}
                    className={`shrink-0 max-w-56 h-6 pl-2.5 flex items-center gap-1 rounded-full border text-[11px] font-garet ${chip.fijo ? 'pr-2.5 border-[#DCE3F0] bg-[#F9FBFF] text-[#6B7585]' : 'pr-1 border-purple-deep bg-purple-soft text-purple'}`}
                >
                    <span className="truncate">{chip.etiqueta}</span>
                    {!chip.fijo && (
                        <button
                            type="button"
                            onClick={() => onQuitar(chip.columna)}
                            aria-label={`Quitar el filtro ${chip.etiqueta}`}
                            className="size-4 flex items-center justify-center rounded-full hover:bg-white cursor-pointer"
                        >
                            ✕
                        </button>
                    )}
                </span>
            ))}
            {chips.filter(chip => !chip.fijo).length > 1 && (
                <button
                    type="button"
                    onClick={onLimpiar}
                    className="shrink-0 text-[11px] font-garet text-[#8A94A6] hover:text-purple cursor-pointer"
                >
                    Limpiar
                </button>
            )}
        </div>
    );
};

export default ChipsFiltro;
