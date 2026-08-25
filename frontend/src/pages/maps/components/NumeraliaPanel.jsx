import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useMapsContext } from '@hooks/useMaps';
import { useNumeraliaPanel } from '@contexts/NumeraliaPanelContext';
import { useLayerMetadata, useMetadataContext } from '@hooksMaps/useLayerMetadata';
import NumeraliaSection from './LayerDetailModal/components/NumeraliaSection';

const NumeraliaPanel = () => {
    const { detachedLayerId, attach } = useNumeraliaPanel();
    const { municipioMode } = useMapsContext();
    const { metadata } = useLayerMetadata(detachedLayerId, useMetadataContext(municipioMode));

    if (!detachedLayerId || !metadata?.numeralia?.some(s => s.nombre || s.valor)) return null;

    return (
        <aside
            className="hidden md:block fixed top-20 right-4 z-11 w-80 max-h-[70vh] overflow-y-auto scrollbar-thin bg-white rounded-2xl shadow-lg border border-[#E7E3EB] p-4"
            aria-label={`Estadísticas de ${metadata.nombre_capa_usuario || 'la capa'}`}
        >
            <div className="flex items-start justify-between gap-2">
                <p className="text-[13px]/[16px] font-garet font-bold text-numeralia tracking-normal">
                    {metadata.nombre_capa_usuario || 'Estadísticas'}
                </p>
                <Tooltip content="Regresar las estadísticas al detalle de la capa">
                    <button
                        type="button"
                        onClick={attach}
                        className="shrink-0 p-1 rounded-full text-gray-500 hover:text-purple cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple"
                        aria-label="Cerrar el panel de estadísticas"
                    >
                        <Icon name="close" className="size-4" />
                    </button>
                </Tooltip>
            </div>
            <NumeraliaSection
                numeralia={metadata.numeralia}
                pie={metadata.nombre_pie_numeralia}
                ambito={metadata.ambito}
            />
        </aside>
    );
};

export default NumeraliaPanel;
