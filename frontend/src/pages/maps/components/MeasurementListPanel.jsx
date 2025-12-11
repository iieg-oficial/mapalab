import { useEffect } from 'react';
import Icon from '@components/Icon';
import Panel from '@components/Panel';
import Tooltip from '@components/Tooltip';

const TYPE_LABELS = {
    LineString: 'Línea',
    Polygon: 'Polígono y Selección múltiple',
    Freehand: 'Dibujo',
    Text: 'Anotación',
    Emoji: 'Icono',
    Point: 'Marcador'
};

const MeasurementListPanel = ({ open, anchorRef, measurements, onDelete, onToggleVisibility, onClearAll, onClose, onShowSelection }) => {
    useEffect(() => {
        if (open && measurements.length === 0) {
            onClose?.();
        }
    }, [measurements.length, open, onClose]);

    const footer = (
        <button
            type="button"
            onClick={onClearAll}
            className="w-full px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50    transition flex items-center justify-center gap-2"
        >
            <Icon name="trash" />
            Limpiar todas las mediciones
        </button>
    );

    return (
        <Panel
            open={open}
            anchorRef={anchorRef}
            onClose={onClose}
            title={`Mediciones (${measurements.length})`}
            footer={footer}
        >
            <div className="p-2 space-y-1">
                {measurements.length === 0 ? (
                    <div className="text-center text-sm text-gray-500  py-8">
                        No hay mediciones
                    </div>
                ) : (
                    measurements.map((measurement, index) => (
                        <div
                            key={index}
                            className="group p-2 rounded-lg hover:bg-black/5  transition"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <div>
                                        <div className="text-sm font-medium text-gray-800  truncate">
                                            {measurement.label}
                                        </div>
                                        <div className="text-xs text-gray-500 ">
                                            {TYPE_LABELS[measurement.type] || measurement.type}
                                        </div>
                                        {measurement.type === 'Polygon' && measurement.layerBreakdown && measurement.layerBreakdown.length > 0 && (
                                            <div className="mt-1 pt-1 border-t border-gray-100">
                                                <div className="text-xs font-medium text-gray-700">
                                                    {measurement.selectionCount} {measurement.selectionCount === 1 ? 'elemento seleccionado' : 'elementos seleccionados'}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5 space-y-0.5">
                                                    {measurement.layerBreakdown.map((layer, idx) => (
                                                        <div key={idx} className="flex items-start gap-1">
                                                            <span className="text-purple-500 mt-0.5">•</span>
                                                            <span>{layer.count} de {layer.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {measurement.type === 'Polygon' && (
                                        <Tooltip content="Ver features seleccionados" placement="top" delay={500}>
                                            <button
                                                type="button"
                                                onClick={() => onShowSelection?.(index)}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50   transition opacity-0 group-hover:opacity-100 md:opacity-100"
                                                aria-label={`Mostrar selección ${measurement.label}`}
                                            >
                                                <Icon name="info" />
                                            </button>
                                        </Tooltip>
                                    )}
                                    <Tooltip content={measurement.visible === false ? 'Mostrar' : 'Ocultar'} placement="top" delay={500}>
                                        <button
                                            type="button"
                                            onClick={() => onToggleVisibility?.(index)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50   transition opacity-0 group-hover:opacity-100 md:opacity-100"
                                            aria-label={`${measurement.visible === false ? 'Mostrar' : 'Ocultar'} ${measurement.label}`}
                                        >
                                            <Icon name={measurement.visible === false ? 'eye_off' : 'eye'} />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content="Eliminar" placement="top" delay={500}>
                                        <button
                                            type="button"
                                            onClick={() => onDelete?.(index)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50   transition opacity-0 group-hover:opacity-100 md:opacity-100"
                                            aria-label={`Eliminar ${measurement.label}`}
                                        >
                                            <Icon name="trash" />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Panel>
    );
};

export default MeasurementListPanel;
