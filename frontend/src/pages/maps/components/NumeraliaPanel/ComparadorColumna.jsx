import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { COLORES_COMPARADOR } from '@pages/maps/helpers/coloresComparador';

const ACCION = 'flex items-center justify-center rounded-full transition-colors text-gray-500 hover:text-[#5C2472]';

const ComparadorColumna = ({ columna, indice, onQuitar, sePuedeQuitar }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: columna.clave });
    const [moviendo, setMoviendo] = useState(false);

    const estilo = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 20 : undefined,
    };

    return (
        <div ref={setNodeRef} style={estilo} className="flex flex-col gap-0.5 min-w-0 pb-1">
            <Tooltip content={columna.nombre} placement="top" delay={300}>
                <span className="block text-[11px]/[14px] font-garet font-bold text-[#2E4372] truncate text-right">
                    {columna.nombre}
                </span>
            </Tooltip>

            <span className="flex items-center justify-between gap-1">
                <span
                    className="size-2 rounded-[2px] shrink-0"
                    style={{ background: COLORES_COMPARADOR[indice % COLORES_COMPARADOR.length] }}
                    aria-hidden="true"
                />

                <span className="flex items-center gap-0.5 shrink-0">
                    <button
                        type="button"
                        {...attributes}
                        {...listeners}
                        onMouseEnter={() => setMoviendo(true)}
                        onMouseLeave={() => setMoviendo(false)}
                        aria-label={`Mover ${columna.nombre}`}
                        className={`${ACCION} cursor-grab active:cursor-grabbing touch-none`}
                    >
                        <Icon name="move" state={moviendo || isDragging ? 'hover' : 'normal'} className="size-4 rotate-90" />
                    </button>
                    {sePuedeQuitar && (
                        <button
                            type="button"
                            onClick={() => onQuitar(columna.clave)}
                            aria-label={`Quitar ${columna.nombre} de la comparación`}
                            className={`${ACCION} cursor-pointer`}
                        >
                            <Icon name="close" className="size-3" />
                        </button>
                    )}
                </span>
            </span>
        </div>
    );
};

export default ComparadorColumna;
