import { useState } from 'react';
import { useView3d } from '@contexts/View3dContext';
import { useDron } from '@contexts/DronContext';
import { esperarMapa3d } from '@pages/maps/helpers/grabacion/esperar3d';

const AnimacionRuta = ({ claseBoton, onListo }) => {
    const { active, enter, map3dRef } = useView3d();
    const { entrar, pedirMinimapa } = useDron();
    const [abriendo, setAbriendo] = useState(false);
    const [error, setError] = useState(null);

    const abrir = async () => {
        setError(null);
        setAbriendo(true);
        try {
            if (!active) enter();
            await esperarMapa3d(map3dRef);
            entrar();
            pedirMinimapa();
            onListo?.();
        } catch (fallo) {
            setError(fallo.message);
        } finally {
            setAbriendo(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <p className="font-garet text-[12.5px] text-[#465055]">
                Traza la ruta en el minimapa del dron y grábala con REC: el minimapa del video muestra la ruta.
            </p>
            <button type="button" onClick={abrir} disabled={abriendo} className={claseBoton}>
                {abriendo ? 'Abriendo la vista 3D…' : 'Abrir el modo dron'}
            </button>
            {error && <p className="font-garet text-[12px] text-[#D6336C]">{error}</p>}
        </div>
    );
};

export default AnimacionRuta;
