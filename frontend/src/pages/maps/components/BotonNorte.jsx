import { useEffect, useState } from 'react';
import Tooltip from '@components/Tooltip';
import { useView3d } from '@contexts/View3dContext';
import icoNorte from '@icons/ico_n.svg';

const BotonNorte = ({ getActiveMap }) => {
    const view3d = useView3d();
    const [rotacion, setRotacion] = useState(0);
    const map = getActiveMap();

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
        if (view3d.active) {
            view3d.setBearing(0);
            return;
        }
        map?.getView().animate({ rotation: 0, duration: 250 });
    };

    return (
        <Tooltip content="Orientar al norte">
            <button type="button" onClick={orientar} className="w-10 flex justify-center p-1 cursor-pointer" aria-label="Orientar al norte">
                <img src={icoNorte} alt="" className="h-12 w-auto transition-transform duration-200" style={{ transform: `rotate(${grados}deg)` }} />
            </button>
        </Tooltip>
    );
};

export default BotonNorte;
