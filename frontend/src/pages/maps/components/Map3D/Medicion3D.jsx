import { useCallback, useEffect, useState } from 'react';
import CloseButton from '@components/CloseButton';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useMapsContext } from '@hooks/useMaps';
import { useMedicion3d } from '@hooksMaps/useMedicion3d';
import ToolSelector from '../MeasurementTools/ToolSelector';
import PanelMedicion from '../MeasurementTools/PanelMedicion';
import HistoryButton from '../MeasurementTools/HistoryButton';
import HistoryPanel from '../MeasurementTools/HistoryPanel';

const TIPO_A_MODO = { LineString: 'linea', Polygon: 'poligono' };
const MODO_A_TIPO = { linea: 'LineString', poligono: 'Polygon' };

const Medicion3D = ({ map, onMidiendo }) => {
    const {
        areMeasurementToolsVisible, hideMeasurementTools, measurements, deleteMeasurement,
        toggleMeasurementVisibility, clearDrawings, restoreAnnotations,
    } = useMapsContext();
    const { style, className } = useSiderAdaptivePosition({ anchorRef: 'tools' });
    const [listaAbierta, setListaAbierta] = useState(false);
    const guardar = useCallback((anotacion) => restoreAnnotations?.([anotacion], { showTools: false }), [restoreAnnotations]);
    const {
        modo, setModo, vertices, terminado, resultado, calculando, deshacer, borrar, terminar, setMarcador,
    } = useMedicion3d(map, { onTerminar: guardar });

    useEffect(() => {
        onMidiendo(!!modo);
        return () => onMidiendo(false);
    }, [modo, onMidiendo]);

    useEffect(() => {
        if (!areMeasurementToolsVisible) setModo(null);
    }, [areMeasurementToolsVisible, setModo]);

    const alElegir = (tipo) => {
        const siguiente = TIPO_A_MODO[tipo] || null;
        setModo(siguiente === modo ? null : siguiente);
    };

    return (
        <div className={`fixed z-10 flex flex-col gap-2 items-start min-w-11 ${className}`} style={style}>
            <HistoryButton
                count={measurements.length}
                onClick={() => setListaAbierta(!listaAbierta)}
                isOpen={listaAbierta}
                tooltip="Mis mediciones"
            />
            {areMeasurementToolsVisible && (
                <>
                    <div className="relative">
                        <ToolSelector
                            isDrawing={!!modo}
                            measureType={MODO_A_TIPO[modo] || 'Point'}
                            onSelect={alElegir}
                            onUndo={deshacer}
                            onFinish={terminar}
                            onCancel={borrar}
                            canUndo={vertices.length > 0 && !terminado}
                            showAnnotations={false}
                        />
                        {modo && (
                            <PanelMedicion
                                modo={modo}
                                resultado={resultado}
                                calculando={calculando}
                                onCerrar={() => setModo(null)}
                                onRecorrer={setMarcador}
                                className="absolute left-full top-0 ml-32"
                            />
                        )}
                    </div>
                    <CloseButton
                        onConfirm={hideMeasurementTools}
                        tooltip="Cerrar herramientas de medición"
                        confirmTitle="¿Cerrar herramientas?"
                        confirmDescription="Se borra la medición en curso; las de «Mis mediciones» se quedan."
                        confirmText="Sí, cerrar herramientas"
                    />
                </>
            )}
            <HistoryPanel
                open={listaAbierta}
                measurements={measurements}
                onDelete={deleteMeasurement}
                onToggleVisibility={toggleMeasurementVisibility}
                onClose={() => setListaAbierta(false)}
                onClearAll={clearDrawings}
            />
        </div>
    );
};

export default Medicion3D;
