import { useMapsContext } from '@hooks/useMaps';
import Loading from '@components/Loading';
import { useMemo } from 'react';
import Icon from '@components/Icon';

const SIZE_BUTTON = 'size-4';

const ActiveLayerItem = ({
    layer,
    dragHandleProps
}) => {
    const {
        loadingLayers,
        selectedLayerForSymbology,
        setSelectedLayerForSymbology,
        onToggleLayer,
        clearLayerFilters,
        getAllChildLayerIds,
        toggleLayerVisibility,
        setSelectedLayer
    } = useMapsContext();

    const isSelected = selectedLayerForSymbology?.id === layer.id;
    const canOpenModal = layer.hasChildren !== false;

    const handleClickOnLayer = (e) => {
        e.stopPropagation();
        setSelectedLayerForSymbology(layer);
    };

    const handleRemoveClick = (e) => {
        e.stopPropagation();
        const childIds = getAllChildLayerIds(layer.id);
        const allIds = [layer.id, ...childIds];
        allIds.forEach(id => clearLayerFilters(id));
        onToggleLayer(layer.id, false);
    };

    const handleToggleVisibilityClick = (e) => {
        e.stopPropagation();
        toggleLayerVisibility(layer.id);
    };

    const handleSetSelectedLayerClick = (e) => {
        e.stopPropagation();
        setSelectedLayer(layer);
    };

    const isLoading = useMemo(() => {
        if (loadingLayers.has(layer.id)) return true;
        if (layer.childIds) {
            return layer.childIds.some(id => loadingLayers.has(id));
        }
        return false;
    }, [loadingLayers, layer.id, layer.childIds]);

    return (
        <div
            className={`
                group flex items-center gap-2 p-2 rounded border transition-all relative
                ${layer.visible ? 'bg-white' : 'bg-gray-100'}
                ${isSelected ? 'ring-2 ring-blue-400' : ''}
                hover:shadow-md
            `}
        >
            {isLoading && (
                <div className="px-2 py-1 shrink-0">
                    <Loading visible={true} size={SIZE_BUTTON} border="border-2" />
                </div>
            )}

            <span
                className={`
                    text-sm font-medium flex-1 truncate cursor-pointer
                    ${isLoading ? '' : 'md:group-hover:pl-[140px]'} transition-all
                    ${!layer.visible ? 'text-gray-500' : ''}
                `}
                title={layer.name}
                onClick={handleClickOnLayer}
            >
                {layer.name}
            </span>

            <div className="flex items-center gap-0 md:absolute md:left-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {dragHandleProps && (
                    <button
                        {...dragHandleProps}
                        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1.5 rounded hover:bg-gray-100 touch-none"
                        title="Reordenar capa"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (dragHandleProps.onClick) dragHandleProps.onClick(e);
                        }}
                    >
                        <Icon name="drag_and_drop" className={SIZE_BUTTON} />
                    </button>
                )}

                <button
                    className="px-2 py-1 text-red-500 hover:text-red-700 cursor-pointer"
                    onClick={handleRemoveClick}
                    title="Eliminar capa"
                >
                    <Icon name="trash" className={SIZE_BUTTON} />
                </button>

                <button
                    className={`
                            px-2 py-1 rounded transition-colors cursor-pointer
                            ${layer.visible ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}
                        `}
                    onClick={handleToggleVisibilityClick}
                    title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
                >
                    <Icon name={layer.visible ? 'eye' : 'eye_off'} className={SIZE_BUTTON} />
                </button>

                {!isLoading && canOpenModal && (
                    <button
                        className="px-2 py-1 text-blue-500 hover:text-blue-700 cursor-pointer"
                        onClick={handleSetSelectedLayerClick}
                        title="Ver detalles de capa"
                    >
                        <Icon name="info" className={SIZE_BUTTON} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default ActiveLayerItem;