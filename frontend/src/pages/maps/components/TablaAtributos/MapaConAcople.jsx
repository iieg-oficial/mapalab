import { useEffect, useState } from 'react';
import MapView from '@mapsComponents/MapView';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { useAcopleMapa } from '@hooksMaps/useAcopleMapa';
import { margenesDelMapa } from '@pages/maps/helpers/tablaAcople';

const medidaVentana = () => ({
    ancho: typeof window === 'undefined' ? 0 : window.innerWidth,
    alto: typeof window === 'undefined' ? 0 : window.innerHeight,
});

const MapaConAcople = () => {
    const { activo, acople, minimizado } = useTablaAtributos();
    const [ventana, setVentana] = useState(medidaVentana);

    useEffect(() => {
        const medir = () => setVentana(medidaVentana());
        window.addEventListener('resize', medir, { passive: true });
        return () => window.removeEventListener('resize', medir);
    }, []);

    const acopleVigente = activo && !minimizado ? acople : 'flotante';
    const margenes = margenesDelMapa(acopleVigente, ventana);

    useAcopleMapa(acopleVigente);

    return (
        <div
            className="absolute inset-0 transition-[inset] duration-250"
            style={{ left: margenes.left, right: margenes.right, bottom: margenes.bottom }}
        >
            <MapView />
        </div>
    );
};

export default MapaConAcople;
