import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';
import { useMapsContext } from '@hooks/useMaps';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';

const Pestana = ({ capa, activa, enFoco, onAbrir, onCerrar }) => {
    const titulo = [
        capa.nombre,
        enFoco ? 'seleccionada en capas activas' : null,
        capa.visible ? null : 'oculta en el mapa',
    ].filter(Boolean).join(' · ');

    return (
        <span className="group/pestana relative flex-1 min-w-24 max-w-56 flex">
            <Tooltip content={titulo} placement="top" delay={300}>
                <button
                    type="button"
                    onClick={onAbrir}
                    aria-pressed={activa}
                    aria-label={`Ver los datos de ${capa.nombre}`}
                    className={`
                        w-full h-7 px-2.5 flex items-center rounded-full border cursor-pointer transition-colors
                        text-[12px]/[15px] font-garet truncate
                        ${capa.visible ? 'bg-white' : 'bg-[#EFF3FC]'}
                        ${enFoco ? 'ring-1 ring-[#70308A] bg-[#F7F0FA]' : ''}
                        ${activa ? 'border-purple font-bold text-purple' : 'border-[#EAEFFA] text-[#454545] hover:border-purple'}
                    `}
                >
                    <span className="truncate">{capa.nombre}</span>
                </button>
            </Tooltip>

            <PillCloseButton
                onClick={onCerrar}
                tooltip={`Quitar la tabla de ${capa.nombre}`}
                ariaLabel={`Quitar la tabla de ${capa.nombre}`}
                size="sm"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10"
            />
        </span>
    );
};

const PestanasTablas = () => {
    const { tablas, activaId, activar, cerrar } = useTablaAtributos();
    const { selectedLayerForSymbology, selectedLayer } = useMapsContext();

    if (tablas.length === 0) return null;

    const enFocoId = selectedLayerForSymbology?.id || selectedLayer?.id || null;

    return (
        <div className="w-full flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 py-0.5">
            {tablas.map(capa => (
                <Pestana
                    key={capa.id}
                    capa={capa}
                    activa={capa.id === activaId}
                    enFoco={Boolean(enFocoId) && (capa.id === enFocoId || (capa.childIds || []).includes(enFocoId))}
                    onAbrir={() => activar(capa.id)}
                    onCerrar={() => cerrar(capa.id)}
                />
            ))}
        </div>
    );
};

export default PestanasTablas;
