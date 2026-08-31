import { useEffect } from 'react';
import PillMinimizada from '@components/PillMinimizada';
import { avisarLayout } from '@hooks/useClearance';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';

const BarraEstado = ({ inferior, izquierda, derecha, transicion = '' }) => {
    const { tablas, alternarMinimizado, cerrarTodas } = useTablaAtributos();
    const cuantas = tablas.length;

    useEffect(() => {
        avisarLayout();
        return avisarLayout;
    }, [cuantas]);

    if (cuantas === 0) return null;

    const etiqueta = cuantas === 1 ? '1 tabla' : `${cuantas} tablas`;

    return (
        <div
            data-barra-tabla
            className={`fixed z-11 flex justify-center pointer-events-none ${transicion}`}
            style={{ bottom: inferior, left: izquierda, right: derecha }}
        >
            <PillMinimizada
                etiqueta={etiqueta}
                icono="tabla"
                tooltipAbrir="Ver la tabla de datos"
                tooltipCerrar="Cerrar la tabla de datos"
                ariaAbrir="Abrir el panel de la tabla de datos"
                ariaCerrar="Cerrar la tabla de datos"
                onAbrir={alternarMinimizado}
                onCerrar={cerrarTodas}
            />
        </div>
    );
};

export default BarraEstado;
