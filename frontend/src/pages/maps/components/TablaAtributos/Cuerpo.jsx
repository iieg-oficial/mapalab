import { formatearValor } from '@pages/maps/helpers/tablaFormato';

const NUMERICOS = new Set(['entero', 'decimal', 'moneda']);

const Cuerpo = ({ columnas, plantilla, filas, seleccionada, onSeleccionar }) => (
    <div>
        {filas.map((feature, indice) => {
            const propiedades = feature?.properties || {};
            const activa = seleccionada === feature?.id;
            return (
                <div
                    key={feature?.id || indice}
                    role="row"
                    tabIndex={0}
                    onClick={() => onSeleccionar(feature)}
                    onKeyDown={evento => { if (evento.key === 'Enter') onSeleccionar(feature); }}
                    style={{ gridTemplateColumns: plantilla }}
                    className={`grid border-b border-[#EAEFFA] cursor-pointer ${activa ? 'bg-[#FFF3E6]' : 'hover:bg-[#F9FBFF]'}`}
                >
                    {columnas.map(columna => (
                        <span
                            key={columna.nombre}
                            className={`min-w-0 px-2 py-1 text-[13px]/[18px] font-garet truncate ${NUMERICOS.has(columna.formato) ? 'text-right tabular-nums' : ''} ${activa ? 'font-bold text-purple' : 'text-[#454545]'}`}
                            title={String(propiedades[columna.nombre] ?? '')}
                        >
                            {formatearValor(propiedades[columna.nombre], columna.formato)}
                        </span>
                    ))}
                </div>
            );
        })}
    </div>
);

export default Cuerpo;
