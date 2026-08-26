import { useEffect, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useMapsContext } from '@hooks/useMaps';
import { useNumeraliaPanel } from '@contexts/NumeraliaPanelContext';
import { useLayerMetadata, useMetadataContext } from '@hooksMaps/useLayerMetadata';
import NumeraliaSection from './LayerDetailModal/components/NumeraliaSection';

const NumeraliaPanel = () => {
    const { detachedLayerId, attach, highlight } = useNumeraliaPanel();
    const [resaltado, setResaltado] = useState(false);
    const panelRef = useRef(null);
    const { municipioMode } = useMapsContext();
    const { metadata } = useLayerMetadata(detachedLayerId, useMetadataContext(municipioMode));

    useEffect(() => {
        if (!highlight) return undefined;
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setResaltado(true);
        const id = setTimeout(() => setResaltado(false), 1200);
        return () => clearTimeout(id);
    }, [highlight]);

    if (!detachedLayerId || !metadata?.numeralia?.some(s => s.nombre || s.valor)) return null;

    return (
        <section
            ref={panelRef}
            className={`w-auto px-4.5 py-2 rounded-[10px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A] shrink-0 flex flex-col max-md:pointer-events-auto transition-shadow ${resaltado ? 'ring-2 ring-[#70308A]' : ''}`}
            aria-label={`Estadísticas de ${metadata.nombre_capa_usuario || 'la capa'}`}
        >
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <Icon name="numeralia" className="size-8 shrink-0" />
                    <h3 className="font-garet font-bold text-[18px]/[47px] truncate">
                        {metadata.nombre_capa_usuario || 'Estadísticas'}
                    </h3>
                </div>

                <Tooltip content="Cerrar estadísticas">
                    <button onClick={attach} className="cursor-pointer" aria-label="Cerrar el panel de estadísticas">
                        <Icon name="zoomout" className="size-6" />
                    </button>
                </Tooltip>
            </div>

            <NumeraliaSection
                numeralia={metadata.numeralia}
                pie={metadata.nombre_pie_numeralia}
                ambito={metadata.ambito}
            />
        </section>
    );
};

export default NumeraliaPanel;
