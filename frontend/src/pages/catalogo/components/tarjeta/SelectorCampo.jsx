import { INPUT, INPUT_ERROR, SELECT } from '../../helpers/controles';
import { IconoAbajo, IconoCerrar } from './iconos';

export const SelectorCampo = ({ id, valor, columnas, onCambio, placeholder = 'Elige un campo', error = false }) => {
    const opciones = columnas || [];
    return (
        <div className="relative">
            <select
                id={id}
                value={valor || ''}
                onChange={(e) => onCambio(e.target.value || null)}
                className={`${SELECT} ${error ? INPUT_ERROR : ''}`}
            >
                <option value="">{placeholder}</option>
                {opciones.map((columna) => <option key={columna} value={columna}>{columna}</option>)}
                {valor && !opciones.includes(valor) && <option value={valor}>{valor}</option>}
            </select>
            <IconoAbajo className="size-4 absolute right-3 top-3 pointer-events-none text-[#5C2472]" />
        </div>
    );
};

const partesDe = (compose) => (compose || [])
    .map((parte) => (typeof parte === 'string' ? { field: parte } : parte))
    .filter(Boolean);

export const EditorCombinado = ({ id, compose, sep, columnas, onCambio, error = false }) => {
    const partes = partesDe(compose);
    const cambiarPartes = (siguientes) => onCambio({ compose: siguientes, sep });

    return (
        <div className="flex flex-col gap-2">
            {partes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {partes.map((parte, indice) => (
                        <span
                            key={`${parte.field}-${indice}`}
                            className="inline-flex items-center gap-1 h-8 pl-3 pr-1 rounded-[20px] bg-[#FAF5FC] text-[#5C2472] font-garet font-medium text-[12px]"
                        >
                            {parte.field}
                            <button
                                type="button"
                                onClick={() => cambiarPartes(partes.filter((_, i) => i !== indice))}
                                aria-label={`Quitar ${parte.field} de la combinación`}
                                className="size-6 rounded-full flex items-center justify-center hover:bg-[#EEDDF5] cursor-pointer"
                            >
                                <IconoCerrar className="size-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
            <div className="grid grid-cols-[1fr_96px] gap-2">
                <SelectorCampo
                    id={id}
                    valor={null}
                    columnas={columnas}
                    placeholder={partes.length ? 'Agregar otro campo' : 'Elige los campos a combinar'}
                    onCambio={(campo) => campo && partes.length < 6 && cambiarPartes([...partes, { field: campo }])}
                    error={error && partes.length === 0}
                />
                <input
                    value={sep ?? ''}
                    onChange={(e) => onCambio({ compose: partes, sep: e.target.value.slice(0, 8) })}
                    placeholder="Separador"
                    aria-label="Separador entre campos"
                    className={INPUT}
                />
            </div>
        </div>
    );
};
