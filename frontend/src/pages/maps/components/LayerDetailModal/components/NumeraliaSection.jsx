import StatCard from './StatCard';

const AmbitoTitle = ({ ambito }) => {
    const geografico = ambito?.geografico || 'Jalisco';
    const temporal = ambito?.temporal || null;

    return (
        <h3 className="text-[15px]/[18px] font-garet font-bold text-purple tracking-normal my-5">
            {geografico}
            {temporal && <span className="text-orange"> {temporal}</span>}
        </h3>
    );
};

const NumeraliaSection = ({ numeralia, pie, ambito }) => {
    const slots = (numeralia || []).filter(s => s.nombre || s.valor);
    if (slots.length === 0) return null;

    return (
        <div className="mb-4" aria-live="polite">
            <AmbitoTitle ambito={ambito} />
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
