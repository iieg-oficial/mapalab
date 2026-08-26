import StatCard from '@mapsComponents/LayerDetailModal/components/StatCard';
import { useStatsVisibility } from './hooks/useStatsVisibility';

const LayerStatsInline = ({ metadata }) => {
    const { visible } = useStatsVisibility();
    if (!visible) return null;

    const slots = (metadata?.numeralia || []).filter(s => s.nombre && s.valor);
    if (slots.length === 0) return null;

    const ambito = metadata?.ambito;
    const geografico = ambito?.geografico || 'Jalisco';

    return (
        <div className="w-full bg-white rounded-[13px] px-3 py-3" aria-live="polite">
            <p className="text-[11px]/[13px] font-garet font-bold text-purple tracking-normal mb-2">
                {geografico}
                {ambito?.temporal && <span className="text-orange"> {ambito.temporal}</span>}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
                {slots.map((stat, index) => (
                    <StatCard key={index} label={stat.nombre} value={stat.valor} simbolo={stat.simbolo} size="compact" />
                ))}
            </div>
        </div>
    );
};

export default LayerStatsInline;
