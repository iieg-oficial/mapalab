import { useEffect } from 'react';
import PillMinimizada from '@components/PillMinimizada';
import { avisarLayout } from '@hooks/useClearance';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';

const BarraEstado = () => {
    const { tablas, alternarMinimizado, cerrarTodas } = useTablaAtributos();
    const cuantas = tablas.length;

    useEffect(() => {
        avisarLayout();
        return avisarLayout;
    }, [cuantas]);

    if (cuantas === 0) return null;

    return (
        <PillMinimizada
            etiqueta={cuantas === 1 ? '1 tabla' : `${cuantas} tablas`}
            icono="tabla"
            tooltipCerrar="Cerrar la tabla de datos"
            ariaAbrir="Abrir el panel de la tabla de datos"
            ariaCerrar="Cerrar la tabla de datos"
            onAbrir={alternarMinimizado}
            onCerrar={cerrarTodas}
        />
    );
};

export default BarraEstado;
