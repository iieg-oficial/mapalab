import StatCard from './StatCard';

const AmbitoLine = ({ ambito }) => {
    const geografico = ambito?.geografico || 'Jalisco';
    const temporal = ambito?.temporal || null;

    return (
        <p className="text-[11px]/[13px] font-garet font-bold text-[#465055] tracking-normal mb-3">
            {temporal ? `${geografico} · ${temporal}` : geografico}
        </p>
    );
};

const NumeraliaSection = ({ numeralia, pie, ambito }) => {
    const slots = (numeralia || []).filter(s => s.nombre || s.valor);
    if (slots.length === 0) return null;

    return (
        <div className="mb-4" aria-live="polite">
            <AmbitoLine ambito={ambito} />
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
