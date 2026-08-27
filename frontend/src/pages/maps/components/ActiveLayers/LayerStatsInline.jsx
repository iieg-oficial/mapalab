import DetachStatsButton from '@mapsComponents/LayerDetailModal/components/DetachStatsButton';
import StatCard from '@mapsComponents/LayerDetailModal/components/StatCard';
import { useNumeraliaPanel } from '@contexts/NumeraliaPanelContext';
import { useStatsVisibility } from './hooks/useStatsVisibility';

const LayerStatsInline = ({ metadata, layerId }) => {
    const { visible } = useStatsVisibility();
    const { detachedLayerId, detach } = useNumeraliaPanel();
    if (!visible || detachedLayerId === layerId) return null;

    const slots = (metadata?.numeralia || []).filter(s => s.nombre && s.valor);
    if (slots.length === 0) return null;

    const ambito = metadata?.ambito;
    const geografico = ambito?.geografico || 'Jalisco';

    return (
        <div className="w-full bg-white rounded-[13px] px-3 py-3" aria-live="polite">
            <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[11px]/[13px] font-garet font-bold text-purple tracking-normal">
                    {geografico}
                    {ambito?.temporal && <span className="text-orange"> {ambito.temporal}</span>}
                </p>
                <DetachStatsButton onDetach={() => detach?.(layerId)} iconClassName="size-4" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
                {slots.map((stat, index) => (
                    <StatCard key={index} label={stat.nombre} value={stat.valor} simbolo={stat.simbolo} size="compact" receta={stat.receta} />
                ))}
            </div>
        </div>
    );
};

export default LayerStatsInline;
