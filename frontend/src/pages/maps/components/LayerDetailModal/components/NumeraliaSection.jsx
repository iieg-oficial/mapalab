import StatCard from './StatCard';
import DetachStatsButton from './DetachStatsButton';

const AmbitoTitle = ({ ambito }) => {
    const geografico = ambito?.geografico || 'Jalisco';
    const temporal = ambito?.temporal || null;

    return (
        <h3 className="text-[15px]/[18px] font-garet font-bold text-purple tracking-normal">
            {geografico}
            {temporal && <span className="text-orange"> {temporal}</span>}
        </h3>
    );
};

const NumeraliaSection = ({ numeralia, pie, ambito, onDetach }) => {
    const slots = (numeralia || []).filter(s => s.nombre || s.valor);
    if (slots.length === 0) return null;

    return (
        <div className="mb-4" aria-live="polite">
            <div className="flex items-center justify-between gap-2 my-5">
                <AmbitoTitle ambito={ambito} />
                {onDetach && <DetachStatsButton onDetach={onDetach} />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-3">
                {slots.map((stat, index) => (
                    <StatCard key={index} label={stat.nombre} value={stat.valor} simbolo={stat.simbolo} receta={stat.receta} />
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
