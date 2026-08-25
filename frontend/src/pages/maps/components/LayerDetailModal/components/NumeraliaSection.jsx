import StatCard from './StatCard';

const AmbitoLine = ({ ambito, onClearMunicipio }) => {
    const geografico = ambito?.geografico || 'Jalisco';
    const temporal = ambito?.temporal || null;
    const filtradoPorMunicipio = Boolean(ambito?.claves?.length);

    return (
        <div className="flex flex-wrap items-center gap-2 mb-3">
            <p className="text-[11px]/[13px] font-garet font-bold text-[#465055] tracking-normal">
                {temporal ? `${geografico} · ${temporal}` : geografico}
            </p>
            {filtradoPorMunicipio && onClearMunicipio && (
                <button
                    type="button"
                    onClick={onClearMunicipio}
                    className="text-[10px]/[12px] font-garet px-2 py-[2px] rounded-full border border-[#7B61FF] text-[#7B61FF] hover:bg-[#F3F0FF] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B61FF]"
                    aria-label={`Quitar el filtro de municipio y ver el dato de todo Jalisco. Filtro actual: ${geografico}`}
                >
                    Quitar filtro ✕
                </button>
            )}
        </div>
    );
};

const NumeraliaSection = ({ numeralia, pie, ambito, onClearMunicipio }) => {
    const slots = (numeralia || []).filter(s => s.nombre || s.valor);
    if (slots.length === 0) return null;

    return (
        <div className="mb-4" aria-live="polite">
            <AmbitoLine ambito={ambito} onClearMunicipio={onClearMunicipio} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slots.map((stat, index) => (
                    <StatCard key={index} label={stat.nombre} value={stat.valor} simbolo={stat.simbolo} />
                ))}
            </div>
            {pie && (
                <p className="text-[10px]/[11px] font-garet font-medium text-[#465055] tracking-normal mt-6">
                    {pie}
                </p>
            )}
        </div>
    );
};

export default NumeraliaSection;
