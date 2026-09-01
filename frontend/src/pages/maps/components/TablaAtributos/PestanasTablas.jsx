import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { horizontalListSortingStrategy } from '@dnd-kit/sortable';
import Tooltip from '@components/Tooltip';
import { useMapsContext } from '@hooks/useMaps';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { SortableList, SortableItem } from '@mapsComponents/ActiveLayers/SortableList';
import { reordenarActivas } from '@pages/maps/helpers/tablaCapa';

const Pestana = ({ capa, activa, enFoco, onAbrir, dragHandleProps, isDragging }) => {
    const titulo = [
        capa.nombre,
        enFoco ? 'seleccionada en capas activas' : null,
        capa.visible ? null : 'oculta en el mapa',
    ].filter(Boolean).join(' · ');

    return (
        <Tooltip content={titulo} placement="top" delay={300} triggerClassName="w-full">
            <button
                type="button"
                onClick={onAbrir}
                aria-pressed={activa}
                aria-label={`Ver los datos de ${capa.nombre}`}
                {...dragHandleProps}
                className={`
                    w-full h-7 px-2.5 flex items-center justify-center rounded-full border transition-colors
                    text-[12px]/[15px] font-garet touch-none
                    ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
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
    const {
        selectedLayerForSymbology, selectedLayer, setSelectedLayerForSymbology,
        activeLayerIds, reorderActiveLayerIds,
    } = useMapsContext();

    if (tablas.length === 0) return null;

    const enFocoId = selectedLayerForSymbology?.id || selectedLayer?.id || null;

    const abrir = (capa) => {
        activar(capa.id);
        setSelectedLayerForSymbology?.({ id: capa.id, name: capa.nombre });
    };

    const alSoltar = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const ids = tablas.map(capa => capa.id);
        const desde = ids.indexOf(active.id);
        const hasta = ids.indexOf(over.id);
        if (desde < 0 || hasta < 0) return;
        const orden = [...ids];
        orden.splice(hasta, 0, orden.splice(desde, 1)[0]);
        reorderActiveLayerIds?.(reordenarActivas(orden, tablas, activeLayerIds || []));
    };

    return (
        <SortableList
            items={tablas.map(capa => capa.id)}
            onSortEnd={alSoltar}
            strategy={horizontalListSortingStrategy}
            modifiers={[restrictToHorizontalAxis]}
        >
            <div className="w-full flex items-center gap-2">
                {tablas.map(capa => (
                    <SortableItem key={capa.id} id={capa.id} className="flex-1 basis-0 min-w-0">
                        <Pestana
                            capa={capa}
                            activa={capa.id === activaId}
                            enFoco={Boolean(enFocoId) && (capa.id === enFocoId || (capa.childIds || []).includes(enFocoId))}
                            onAbrir={() => abrir(capa)}
                        />
                    </SortableItem>
                ))}
            </div>
        </SortableList>
    );
};

export default PestanasTablas;
