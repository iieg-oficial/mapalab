import { useEffect, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useMapsContext } from '@hooks/useMaps';
import { PANEL_GAP, VIEWPORT_EDGE } from '@pages/maps/helpers/mapFit';
import { useNumeraliaPanel } from '@contexts/NumeraliaPanelContext';
import { useLayerMetadata, useMetadataContext } from '@hooksMaps/useLayerMetadata';
import StatCard from './LayerDetailModal/components/StatCard';

const NumeraliaPanel = () => {
    const { detachedLayerId, attach, highlight } = useNumeraliaPanel();
    const { municipioMode } = useMapsContext();
    const { metadata } = useLayerMetadata(detachedLayerId, useMetadataContext(municipioMode));
    const [resaltado, setResaltado] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        if (!highlight) return undefined;
        setResaltado(true);
        const id = setTimeout(() => setResaltado(false), 1200);
        return () => clearTimeout(id);
    }, [highlight]);

    const slots = (metadata?.numeralia || []).filter(s => s.nombre && s.valor);
    if (!detachedLayerId || slots.length === 0) return null;

    const ambito = metadata?.ambito;

    return (
        <div
            className="hidden md:flex fixed bottom-16 z-11 justify-center pointer-events-none"
            style={{ left: VIEWPORT_EDGE + PANEL_GAP, right: VIEWPORT_EDGE + PANEL_GAP }}
        >
            <section
                ref={panelRef}
                className={`pointer-events-auto max-w-full overflow-x-auto scrollbar-thin px-4 py-2.5 rounded-[10px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A] transition-shadow ${resaltado ? 'ring-2 ring-[#70308A]' : ''}`}
                aria-label={`Estadísticas de ${metadata.nombre_capa_usuario || 'la capa'}`}
                aria-live="polite"
            >
                <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                        <Icon name="numeralia" className="size-8 shrink-0 text-purple" />
                        <h3 className="font-garet font-bold text-[13px]/[16px] truncate">
                            {metadata.nombre_capa_usuario || 'Estadísticas'}
                        </h3>
                        <p className="text-[11px]/[13px] font-garet font-bold text-purple tracking-normal shrink-0">
                            {ambito?.geografico || 'Jalisco'}
                            {ambito?.temporal && <span className="text-orange"> {ambito.temporal}</span>}
                        </p>
                    </div>

                    <Tooltip content="Cerrar estadísticas">
                        <button onClick={attach} className="cursor-pointer shrink-0" aria-label="Cerrar el panel de estadísticas">
                            <Icon name="cerrar" className="size-4" />
                        </button>
                    </Tooltip>
                </div>

                <div className="grid grid-rows-2 grid-flow-col auto-cols-[minmax(120px,1fr)] gap-2">
                    {slots.map((stat, index) => (
                        <StatCard key={index} label={stat.nombre} value={stat.valor} simbolo={stat.simbolo} size="compact" />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default NumeraliaPanel;
