import Tooltip from '@components/Tooltip';
import { useMapsContext } from '@hooks/useMaps';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';

const Pestana = ({ capa, activa, enFoco, onAbrir }) => {
    const titulo = [
        capa.nombre,
        enFoco ? 'seleccionada en capas activas' : null,
        capa.visible ? null : 'oculta en el mapa',
    ].filter(Boolean).join(' · ');

    return (
        <Tooltip content={titulo} placement="top" delay={300} triggerClassName="flex-1 basis-0 min-w-0">
            <button
                type="button"
                onClick={onAbrir}
                aria-pressed={activa}
                aria-label={`Ver los datos de ${capa.nombre}`}
                className={`
                    w-full h-7 px-2.5 flex items-center justify-center rounded-full border cursor-pointer transition-colors
                    text-[12px]/[15px] font-garet
                    ${capa.visible ? 'bg-white' : 'bg-[#EFF3FC]'}
                    ${enFoco ? 'ring-1 ring-[#70308A] bg-[#F7F0FA]' : ''}
                    ${activa ? 'border-purple font-bold text-purple' : 'border-[#EAEFFA] text-[#454545] hover:border-purple'}
                `}
            >
                <span className="truncate">{capa.nombre}</span>
            </button>
        </Tooltip>
    );
};

const PestanasTablas = () => {
    const { tablas, activaId, activar } = useTablaAtributos();
    const { selectedLayerForSymbology, selectedLayer } = useMapsContext();

    if (tablas.length === 0) return null;

    const enFocoId = selectedLayerForSymbology?.id || selectedLayer?.id || null;

    return (
        <div className="w-full flex items-center gap-2">
            {tablas.map(capa => (
                <Pestana
                    key={capa.id}
                    capa={capa}
                    activa={capa.id === activaId}
                    enFoco={Boolean(enFocoId) && (capa.id === enFocoId || (capa.childIds || []).includes(enFocoId))}
                    onAbrir={() => activar(capa.id)}
                />
            ))}
        </div>
    );
};

export default PestanasTablas;
