import { useCallback, useEffect, useState } from 'react';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { getCenter } from 'ol/extent';
import { useFeatureInfo } from '@hooksMaps/useFeatureInfo';
import CloseButton from '@components/CloseButton';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useMapsContext } from '@hooks/useMaps';
import { useMedicion3d } from '@hooksMaps/useMedicion3d';
import { abrirInfoBoxDeLinea } from '@hooksMaps/useInfoBoxDeMedicion';
import ToolSelector from '../MeasurementTools/ToolSelector';
import HistoryButton from '../MeasurementTools/HistoryButton';
import HistoryPanel from '../MeasurementTools/HistoryPanel';

const TIPO_A_MODO = { LineString: 'linea', Polygon: 'poligono' };
const MODO_A_TIPO = { linea: 'LineString', poligono: 'Polygon' };

const Medicion3D = ({ map, onMidiendo }) => {
    const {
        areMeasurementToolsVisible, hideMeasurementTools, measurements, deleteMeasurement,
        toggleMeasurementVisibility, clearDrawings, restoreAnnotations, mapRef, setSelectedFeatureInfo, clickPosition,
    } = useMapsContext();
    const { queryFeaturesInPolygon } = useFeatureInfo();
    const { style, className } = useSiderAdaptivePosition({ anchorRef: 'tools' });
    const [listaAbierta, setListaAbierta] = useState(false);
    const guardar = useCallback((anotacion) => {
        restoreAnnotations?.([anotacion], { showTools: false });
        if (!mapRef?.current) return;
        if (anotacion.type === 'LineString') {
            const coords = anotacion.geometry.coordinates;
            const { x, y } = map.project(coords.at(-1));
            abrirInfoBoxDeLinea({ geometria: new LineString(coords.map(c => fromLonLat(c))), pixel: [x, y], setSelectedFeatureInfo, clickPosition });
            return;
        }
        const geometria = new Polygon(anotacion.geometry.coordinates.map(anillo => anillo.map(c => fromLonLat(c))));
        queryFeaturesInPolygon(mapRef.current, geometria, getCenter(geometria.getExtent()));
    }, [restoreAnnotations, mapRef, map, queryFeaturesInPolygon, setSelectedFeatureInfo, clickPosition]);
    const {
        modo, setModo, vertices, terminado, deshacer, borrar, terminar,
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
