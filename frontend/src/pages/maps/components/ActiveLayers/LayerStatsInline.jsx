import { useMapsContext } from '@hooks/useMaps';
import { useLayerMetadata, useMetadataContext } from '@hooksMaps/useLayerMetadata';
import { useStatsVisibility } from './hooks/useStatsVisibility';

const LayerStatsInline = ({ layer }) => {
    const { visible } = useStatsVisibility();
    const { municipioMode } = useMapsContext();
    const { metadata } = useLayerMetadata(visible ? layer?.id : null, useMetadataContext(municipioMode));

    if (!visible || !layer) return null;

    const slots = (metadata?.numeralia || []).filter(s => s.nombre && s.valor);
    if (slots.length === 0) return null;

    const ambito = metadata?.ambito;
    const geografico = ambito?.geografico || 'Jalisco';

    return (
        <div className="w-full bg-white rounded-[13px] px-3 py-2" aria-live="polite">
            <p className="text-[11px]/[13px] font-garet font-bold text-purple tracking-normal mb-1.5">
                {geografico}
                {ambito?.temporal && <span> {ambito.temporal}</span>}
            </p>
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                {slots.map((stat, index) => (
                    <div key={index} className="flex flex-col items-center text-center">
                        <dt className="text-[9px]/[11px] font-garet text-graphite tracking-normal">
                            {stat.nombre}
                        </dt>
                        <dd className="text-[13px]/[15px] font-garet font-bold text-orange tracking-normal">
                            {stat.valor}{stat.simbolo ? ` ${stat.simbolo}` : ''}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};

export default LayerStatsInline;
