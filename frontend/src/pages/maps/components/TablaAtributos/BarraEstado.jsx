import { useEffect, useRef } from 'react';
import PillMinimizada from '@components/PillMinimizada';
import { avisarLayout } from '@hooks/useClearance';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { useJuntoAPill } from '@hooksMaps/useJuntoAPill';

const BarraEstado = ({ inferior, izquierda, derecha, transicion = '', enFila }) => {
    const { tablas, alternarMinimizado, cerrarTodas } = useTablaAtributos();
    const contenedorRef = useRef(null);
    const cuantas = tablas.length;
    const desplazamiento = useJuntoAPill({ propioRef: contenedorRef, activo: enFila && cuantas > 0 });

    useEffect(() => {
        avisarLayout();
        return avisarLayout;
    }, [cuantas]);

    if (cuantas === 0) return null;

    const etiqueta = cuantas === 1 ? '1 tabla' : `${cuantas} tablas`;

    return (
        <div
            data-barra-tabla
            ref={contenedorRef}
            className={`fixed z-11 flex justify-center pointer-events-none ${transicion}`}
            style={{
                bottom: inferior,
                left: izquierda,
                right: derecha,
                transform: desplazamiento ? `translateX(${desplazamiento}px)` : undefined,
            }}
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
