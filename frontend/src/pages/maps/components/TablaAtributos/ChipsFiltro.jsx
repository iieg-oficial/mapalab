const ChipsFiltro = ({ chips, onQuitar, onLimpiar, compacto = false }) => {
    if (!chips || chips.length === 0) return null;

    return (
        <div className={`flex items-center gap-1.5 ${compacto ? '' : 'flex-wrap'} min-w-0`}>
            {chips.map(chip => (
                <span
                    key={chip.columna || 'propia'}
                    className="shrink-0 max-w-56 h-6 pl-2.5 pr-1 flex items-center gap-1 rounded-full border border-purple-deep bg-purple-soft text-[11px] font-garet text-purple"
                >
                    <span className="truncate">{chip.etiqueta}</span>
                    <button
                        type="button"
                        onClick={() => onQuitar(chip.columna)}
                        aria-label={`Quitar el filtro ${chip.etiqueta}`}
                        className="size-4 flex items-center justify-center rounded-full hover:bg-white cursor-pointer"
                    >
                        ✕
                    </button>
                </span>
            ))}
            {chips.length > 1 && (
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
