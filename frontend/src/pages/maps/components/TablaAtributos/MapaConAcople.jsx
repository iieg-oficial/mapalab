import { useEffect, useState } from 'react';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { useAreaUtil } from '@contexts/AreaUtilContext';
import { useAcopleMapa } from '@hooksMaps/useAcopleMapa';
import { margenesDelMapa } from '@pages/maps/helpers/tablaAcople';

const medidaVentana = () => ({
    ancho: typeof window === 'undefined' ? 0 : window.innerWidth,
    alto: typeof window === 'undefined' ? 0 : window.innerHeight,
});

const MapaConAcople = ({ children }) => {
    const { activo, acople, minimizado, altoAcople } = useTablaAtributos();
    const { fijarMargenes } = useAreaUtil();
    const [ventana, setVentana] = useState(medidaVentana);

    useEffect(() => {
        const medir = () => setVentana(medidaVentana());
        window.addEventListener('resize', medir, { passive: true });
        return () => window.removeEventListener('resize', medir);
    }, []);

    const acopleVigente = activo && !minimizado ? acople : 'flotante';
    const margenes = margenesDelMapa(acopleVigente, ventana, altoAcople);

    const { left, right, top, bottom } = margenes;
    useEffect(() => { fijarMargenes({ left, right, top, bottom }); }, [fijarMargenes, left, right, top, bottom]);

    useAcopleMapa(acopleVigente);

    return (
        <div
            className="absolute inset-0 transition-[inset] duration-250"
            style={{ left: margenes.left, right: margenes.right, top: margenes.top, bottom: margenes.bottom }}
        >
            {children}
        </div>
    );
};

export default MapaConAcople;
