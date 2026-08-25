import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import StatCard from './StatCard';

const AmbitoTitle = ({ ambito, onDetach }) => {
    const geografico = ambito?.geografico || 'Jalisco';
    const temporal = ambito?.temporal || null;

    return (
        <div className="flex items-center justify-between gap-2 my-5 flex-wrap">
            <h3 className="text-[15px]/[18px] font-garet font-bold text-purple tracking-normal">
                {geografico}
                {temporal && <span className="text-orange"> {temporal}</span>}
            </h3>
            {onDetach && (
                <Tooltip content="Ver las estadísticas en un panel sobre el mapa">
                    <button
                        type="button"
                        onClick={onDetach}
                        className="shrink-0 p-1.5 rounded-full border border-transparent text-gray-500 hover:text-purple hover:border-[#70308A] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple"
                        aria-label="Desacoplar las estadísticas a un panel sobre el mapa"
                    >
                        <Icon name="move_arrows" className="size-4" />
                    </button>
                </Tooltip>
            )}
        </div>
    );
};

const NumeraliaSection = ({ numeralia, pie, ambito, onDetach }) => {
    const slots = (numeralia || []).filter(s => s.nombre || s.valor);
    if (slots.length === 0) return null;

    return (
        <div className="mb-4" aria-live="polite">
            <AmbitoTitle ambito={ambito} onDetach={onDetach} />
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
