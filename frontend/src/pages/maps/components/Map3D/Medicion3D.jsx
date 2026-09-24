import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { getCenter } from 'ol/extent';
import { useFeatureInfo } from '@hooksMaps/useFeatureInfo';
import CloseButton from '@components/CloseButton';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useMapsContext } from '@hooks/useMaps';
import { useMedicion3d } from '@hooksMaps/useMedicion3d';
import { useEmoji3d } from '@hooksMaps/useEmoji3d';
import { abrirInfoBoxDeLinea, abrirInfoBoxDeMedicion } from '@hooksMaps/useInfoBoxDeMedicion';
import ToolSelector from '../MeasurementTools/ToolSelector';
import HistoryButton from '../MeasurementTools/HistoryButton';
import HistoryPanel from '../MeasurementTools/HistoryPanel';
import EmojiPanel from '../MeasurementTools/EmojiPanel';

const SIN_MAPAS = [];
const TIPO_A_MODO = { LineString: 'linea', Polygon: 'poligono', Pin: 'punto' };
const MODO_A_TIPO = { linea: 'LineString', poligono: 'Polygon', punto: 'Pin' };
const SOLO_EN_2D = ['Text', 'Freehand'];

const Medicion3D = ({ map, mapasExtra = SIN_MAPAS, mapa2dRef = null, onMidiendo }) => {
    const {
        areMeasurementToolsVisible, hideMeasurementTools, areAnnotationToolsVisible, hideAnnotationTools, measurements, deleteMeasurement,
        toggleMeasurementVisibility, clearDrawings, restoreAnnotations, mapRef, setSelectedFeatureInfo, clickPosition,
    } = useMapsContext();
    const { queryFeaturesInPolygon } = useFeatureInfo();
    const { style, className } = useSiderAdaptivePosition({ anchorRef: 'tools' });
    const [listaAbierta, setListaAbierta] = useState(false);
    const [emojiAbierto, setEmojiAbierto] = useState(false);
    const [simbolo, setSimbolo] = useState(null);
    const emojiRef = useRef(null);
    const mapas = useMemo(() => [map, ...mapasExtra].filter(Boolean), [map, mapasExtra]);
    const guardar = useCallback((anotacion) => {
        restoreAnnotations?.([anotacion], { showTools: false });
        const mapa2d = mapa2dRef?.current || mapRef?.current;
        if (!mapa2d || anotacion.type === 'Pin') return;
        if (anotacion.type === 'LineString') {
            const coords = anotacion.geometry.coordinates;
            const { x, y } = map.project(coords.at(-1));
            abrirInfoBoxDeLinea({ geometria: new LineString(coords.map(c => fromLonLat(c))), pixel: [x, y], setSelectedFeatureInfo, clickPosition });
            return;
        }
        const geometria = new Polygon(anotacion.geometry.coordinates.map(anillo => anillo.map(c => fromLonLat(c))));
        queryFeaturesInPolygon(mapa2d, geometria, getCenter(geometria.getExtent()));
    }, [restoreAnnotations, mapa2dRef, mapRef, map, queryFeaturesInPolygon, setSelectedFeatureInfo, clickPosition]);
    const {
        modo, setModo, vertices, terminado, deshacer, borrar, terminar,
    } = useMedicion3d(mapas, { onTerminar: guardar });

    const colocarEmoji = useCallback((anotacion) => {
        restoreAnnotations?.([anotacion], { showTools: false });
        setSimbolo(null);
    }, [restoreAnnotations]);
    useEmoji3d(mapas, simbolo, colocarEmoji);

    useEffect(() => {
        onMidiendo(!!modo || !!simbolo);
        return () => onMidiendo(false);
    }, [modo, simbolo, onMidiendo]);

    useEffect(() => {
        if (areAnnotationToolsVisible) return;
        setSimbolo(null);
        setEmojiAbierto(false);
    }, [areAnnotationToolsVisible]);

    useEffect(() => {
        if (!areMeasurementToolsVisible) setModo(null);
    }, [areMeasurementToolsVisible, setModo]);

    const alElegir = (tipo) => {
        const siguiente = TIPO_A_MODO[tipo] || null;
        setSimbolo(null);
        setModo(siguiente === modo ? null : siguiente);
    };
    const alElegirEmoji = (elegido) => {
        setModo(null);
        setEmojiAbierto(false);
        setSimbolo(elegido);
    };
    const cerrarHerramientas = () => {
        hideMeasurementTools?.();
        hideAnnotationTools?.();
    };

    return (
        <div className={`fixed z-10 flex flex-col gap-2 items-start min-w-11 ${className}`} style={style}>
            <HistoryButton
                count={measurements.length}
                onClick={() => setListaAbierta(!listaAbierta)}
                isOpen={listaAbierta}
                tooltip="Mis mediciones"
            />
            {(areMeasurementToolsVisible || areAnnotationToolsVisible) && (
                <>
                    <div className="relative">
                        <ToolSelector
                            isDrawing={!!modo || !!simbolo}
                            measureType={simbolo ? 'Emoji' : (MODO_A_TIPO[modo] || 'Point')}
                            isEmojiPickerOpen={emojiAbierto}
                            onSelect={alElegir}
                            onEmojiToggle={() => setEmojiAbierto(abierto => !abierto)}
                            emojiButtonRef={emojiRef}
                            onUndo={deshacer}
                            onFinish={terminar}
                            onCancel={borrar}
                            canUndo={vertices.length > 0 && !terminado}
                            showMeasurements={areMeasurementToolsVisible}
                            showAnnotations={areAnnotationToolsVisible}
                            bloqueadas={SOLO_EN_2D}
                        />
                    </div>
                    <EmojiPanel
                        open={emojiAbierto}
                        anchorRef={emojiRef}
                        onSelect={alElegirEmoji}
                        onClose={() => setEmojiAbierto(false)}
                        placedCount={measurements.filter(m => m.type === 'Emoji').length}
                    />
                    <CloseButton
                        onConfirm={cerrarHerramientas}
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
                onShowMeasurement={(id) => abrirInfoBoxDeMedicion({
                    medicion: measurements.find(m => m.id === id),
                    setSelectedFeatureInfo,
                    clickPosition,
                })}
                onClearAll={clearDrawings}
            />
        </div>
    );
};

export default Medicion3D;
