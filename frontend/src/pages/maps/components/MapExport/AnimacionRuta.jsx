import { useState } from 'react';
import { useView3d } from '@contexts/View3dContext';
import { useDron } from '@contexts/DronContext';
import { useGrabacionDron } from '@contexts/GrabacionDronContext';
import { esperarMapa3d } from '@pages/maps/helpers/grabacion/esperar3d';

const AnimacionRuta = ({ claseBoton, onListo }) => {
    const { active, enter, map3dRef } = useView3d();
    const { activo, entrar, pedirMinimapa, ruta } = useDron();
    const puntos = activo ? ruta.puntos.length : 0;
    const { abrirTarjeta } = useGrabacionDron();
    const [abriendo, setAbriendo] = useState(false);
    const [error, setError] = useState(null);

    const abrir = async () => {
        setError(null);
        setAbriendo(true);
        try {
            if (!active) {
                enter();
                await esperarMapa3d(map3dRef);
            }
            if (!activo) entrar();
            pedirMinimapa();
            abrirTarjeta(true);
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
                {puntos
                    ? `Ya trazaste una ruta de ${puntos} ${puntos === 1 ? 'punto' : 'puntos'}. El dron la vuela mientras graba y se detiene al llegar.`
                    : 'Traza la ruta en el minimapa del dron y grábala: el video se detiene al llegar al último punto.'}
            </p>
            <button type="button" onClick={abrir} disabled={abriendo} className={claseBoton}>
                {abriendo ? 'Abriendo la vista 3D…' : (puntos ? 'Grabar esta ruta' : 'Crear la ruta y grabar')}
            </button>
            {error && <p className="font-garet text-[12px] text-[#D6336C]">{error}</p>}
        </div>
    );
};

export default AnimacionRuta;
