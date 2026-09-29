import { useEffect, useMemo, useState } from 'react';
import Tooltip from '@components/Tooltip';
import { useView3d } from '@contexts/View3dContext';
import { useMapsContext } from '@hooks/useMaps';
import { useRotacionClicDerecho } from '@hooksMaps/useRotacionClicDerecho';
import icoNorte from '@icons/ico_n.svg';
import { trackNorthReset } from '@services/analyticsService';

const BotonNorte = ({ getActiveMap }) => {
    const view3d = useView3d();
    const [rotacion, setRotacion] = useState(0);
    const { areMeasurementToolsVisible, areAnnotationToolsVisible, isDrawing, compareMode, paneMapInstances } = useMapsContext();
    const map = getActiveMap();
    const mapas = useMemo(
        () => (compareMode?.active ? [paneMapInstances?.[0], paneMapInstances?.[1]] : [map]),
        [compareMode?.active, paneMapInstances, map],
    );
    useRotacionClicDerecho(mapas, !view3d.active && !areMeasurementToolsVisible && !areAnnotationToolsVisible && !isDrawing);

    useEffect(() => {
        const view = map?.getView();
        if (!view) return undefined;
        const alCambiar = () => setRotacion(view.getRotation() || 0);
        alCambiar();
        view.on('change:rotation', alCambiar);
        return () => view.un('change:rotation', alCambiar);
    }, [map]);

    const grados = view3d.active ? -view3d.bearing : (rotacion * 180) / Math.PI;
    const orientar = () => {
        trackNorthReset(view3d.active ? '3d' : '2d');
        if (view3d.active) {
            view3d.setBearing(0);
            return;
        }
        map?.getView().animate({ rotation: 0, duration: 250 });
    };

    return (
        <Tooltip content="Orientar al norte · clic derecho y arrastrar para girar">
            <button type="button" onClick={orientar} className="w-11 flex justify-center p-1 cursor-pointer" aria-label="Orientar al norte">
                <img src={icoNorte} alt="" className="h-12 w-auto transition-transform duration-200" style={{ transform: `rotate(${grados}deg)` }} />
            </button>
        </Tooltip>
    );
};

export default BotonNorte;
