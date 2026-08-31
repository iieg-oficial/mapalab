import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';

const BadgeTabla = ({ capa, activa, onAbrir, onCerrar }) => (
    <span className="group/badge relative shrink-0 flex">
        <span
            className={`
                h-7 px-2.5 flex items-center rounded-full border transition-colors
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
        </span>

        <PillCloseButton
            onClick={onCerrar}
            tooltip={`Quitar la tabla de ${capa.nombre}`}
            ariaLabel={`Quitar la tabla de ${capa.nombre}`}
            size="sm"
            className="absolute left-full pl-1 top-1/2 -translate-y-1/2 z-10"
        />
    </span>
);

const BarraEstado = ({ inferior, izquierda, derecha, transicion = '' }) => {
    const { tablas, activaId, activar, cerrar, cerrarTodas } = useTablaAtributos();

    if (tablas.length === 0) return null;

    return (
        <div
            data-barra-tabla
            className={`fixed z-11 flex justify-center pointer-events-none ${transicion}`}
            style={{ bottom: inferior, left: izquierda, right: derecha }}
        >
            <div className="group relative flex min-w-0 pointer-events-auto">
                <div className="max-w-full h-10 px-2 flex items-center gap-2 rounded-full bg-white shadow-[0_5px_20px_#1A26641A] border border-[#EAEFFA] overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400">
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

                <PillCloseButton
                    onClick={cerrarTodas}
                    tooltip="Cerrar la tabla de datos"
                    ariaLabel="Cerrar la tabla de datos"
                    className="absolute left-full pl-2 top-1/2 -translate-y-1/2"
                />
            </div>
        </div>
    );
};

export default BarraEstado;
