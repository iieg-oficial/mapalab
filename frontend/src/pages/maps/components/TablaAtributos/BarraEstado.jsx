import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';

const CIERRE_VISIBLE = 'md:invisible md:opacity-0 md:group-hover:visible md:group-hover:opacity-100 md:group-focus-within:visible md:group-focus-within:opacity-100';

const BadgeTabla = ({ capa, activa, onAbrir, onCerrar }) => {
    const [encima, setEncima] = useState(false);

    return (
        <span
            className={`
                group/badge shrink-0 h-7 pl-2.5 pr-1 flex items-center gap-1 rounded-full border transition-colors
                ${activa ? 'border-purple bg-purple-soft' : 'border-[#EAEFFA] bg-[#F9FBFF] hover:border-purple'}
                ${capa.visible ? '' : 'opacity-50'}
            `}
        >
            <Tooltip content={capa.visible ? capa.nombre : `${capa.nombre} (oculta en el mapa)`} placement="top" delay={300}>
                <button
                    type="button"
                    onClick={onAbrir}
                    aria-pressed={activa}
                    aria-label={`Ver los datos de ${capa.nombre}`}
                    className={`max-w-44 text-[12px]/[15px] font-garet truncate cursor-pointer ${activa ? 'font-bold text-purple' : 'text-[#454545]'}`}
                >
                    {capa.nombre}
                </button>
            </Tooltip>

            <button
                type="button"
                onClick={onCerrar}
                onMouseEnter={() => setEncima(true)}
                onMouseLeave={() => setEncima(false)}
                aria-label={`Quitar la tabla de ${capa.nombre}`}
                className={`
                    size-5 shrink-0 flex items-center justify-center rounded-full border transition-all cursor-pointer
                    ${encima ? 'bg-[#FF577D] border-[#FF577D]' : 'bg-[#FFE6EC] border-[#FFE6EC]'}
                    md:invisible md:opacity-0 md:group-hover/badge:visible md:group-hover/badge:opacity-100
                `}
            >
                <Icon name="cerrar" state={encima ? 'hover' : 'normal'} className="size-4" />
            </button>
        </span>
    );
};

const BarraEstado = ({ inferior, izquierda, derecha, transicion = '' }) => {
    const { tablas, activaId, activar, cerrar, cerrarTodas } = useTablaAtributos();
    const [cierreEncima, setCierreEncima] = useState(false);

    if (tablas.length === 0) return null;

    return (
        <div
            data-barra-tabla
            className={`fixed z-11 flex justify-center pointer-events-none ${transicion}`}
            style={{ bottom: inferior, left: izquierda, right: derecha }}
        >
            <div className="group max-w-full h-10 pl-2 pr-1 flex items-center gap-1 rounded-full bg-white shadow-[0_5px_20px_#1A26641A] border border-[#EAEFFA] pointer-events-auto">
                <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 py-1">
                    {tablas.map(capa => (
                        <BadgeTabla
                            key={capa.id}
                            capa={capa}
                            activa={capa.id === activaId}
                            onAbrir={() => activar(capa.id)}
                            onCerrar={() => cerrar(capa.id)}
                        />
                    ))}
                </div>

                <Tooltip content="Cerrar la tabla de datos" placement="top" delay={300}>
                    <button
                        type="button"
                        onClick={cerrarTodas}
                        onMouseEnter={() => setCierreEncima(true)}
                        onMouseLeave={() => setCierreEncima(false)}
                        aria-label="Cerrar la tabla de datos"
                        className={`
                            size-8 shrink-0 flex items-center justify-center rounded-full border transition-all cursor-pointer
                            ${cierreEncima ? 'bg-[#FF577D] border-[#FF577D]' : 'bg-[#FFE6EC] border-[#FFE6EC]'}
                            ${CIERRE_VISIBLE}
                        `}
                    >
                        <Icon name="cerrar" state={cierreEncima ? 'hover' : 'normal'} className="size-6" />
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};

export default BarraEstado;
