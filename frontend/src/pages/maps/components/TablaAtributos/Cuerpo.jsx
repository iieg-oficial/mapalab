import { formatearValor } from '@pages/maps/helpers/tablaFormato';

const Cuerpo = ({ columnas, filas, seleccionada, onSeleccionar }) => (
    <div className="min-w-max">
        {filas.map((feature, indice) => {
            const propiedades = feature?.properties || {};
            const activa = seleccionada === feature?.id;
            return (
                <button
                    key={feature?.id || indice}
                    type="button"
                    onClick={() => onSeleccionar(feature)}
                    className={`w-full flex text-left border-b border-[#EAEFFA] cursor-pointer ${activa ? 'bg-purple-soft' : 'hover:bg-[#F7F9FD]'}`}
                >
                    {columnas.map(columna => (
                        <span
                            key={columna.nombre}
                            className={`min-w-40 flex-1 px-2.5 py-1.5 text-[12px] font-garet truncate border-r border-[#F2F5FB] last:border-r-0 ${activa ? 'text-purple' : 'text-graphite'}`}
                            title={String(propiedades[columna.nombre] ?? '')}
                        >
                            {formatearValor(propiedades[columna.nombre], columna.formato)}
                        </span>
                    ))}
                </button>
            );
        })}
    </div>
);

export default Cuerpo;
