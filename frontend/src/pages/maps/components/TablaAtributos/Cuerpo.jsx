import Checkbox from '@components/Checkbox';
import { formatearValor } from '@pages/maps/helpers/tablaFormato';

const NUMERICOS = new Set(['entero', 'decimal', 'moneda']);

const Cuerpo = ({ columnas, plantilla, filas, seleccionadas, onSeleccionar }) => (
    <div>
        {filas.map((feature, indice) => {
            const propiedades = feature?.properties || {};
            const activa = seleccionadas.has(feature?.id);
            return (
                <div
                    key={feature?.id || indice}
                    role="row"
                    tabIndex={0}
                    onClick={evento => onSeleccionar(feature, indice, {
                        rango: evento.shiftKey,
                        alternar: evento.ctrlKey || evento.metaKey,
                    })}
                    onKeyDown={evento => { if (evento.key === 'Enter') onSeleccionar(feature, indice, {}); }}
                    style={{ gridTemplateColumns: plantilla }}
                    className={`grid border-b border-[#EAEFFA] cursor-pointer select-none ${activa ? 'bg-[#FFF3E6]' : 'hover:bg-[#F9FBFF]'}`}
                >
                    <span
                        className="flex items-center justify-center"
                        onClick={evento => evento.stopPropagation()}
                        role="presentation"
                    >
                        <Checkbox
                            checked={activa}
                            onChange={() => onSeleccionar(feature, indice, { alternar: true })}
                            className="mr-0"
                        />
                    </span>
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
