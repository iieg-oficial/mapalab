import { useMemo, useState } from 'react';
import Checkbox from '@components/Checkbox';
import { familiaDeColumna } from '@pages/maps/helpers/tablaCqlBuilder';

const CLASE_CAMPO = 'w-full h-7 px-2 rounded border border-[#DCE3F0] text-[12px] font-garet text-graphite focus:outline-none focus:border-purple';

const ListaValores = ({ valores, seleccionados, onAlternar }) => {
    const [busqueda, setBusqueda] = useState('');
    const filtrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();
        if (!termino) return valores;
        return valores.filter(valor => String(valor).toLowerCase().includes(termino));
    }, [busqueda, valores]);

    return (
        <div className="flex flex-col gap-1.5">
            {valores.length > 8 && (
                <input
                    type="search"
                    value={busqueda}
                    onChange={event => setBusqueda(event.target.value)}
                    placeholder="Buscar valor"
                    className={CLASE_CAMPO}
                />
            )}
            <div className="max-h-44 overflow-auto scrollbar-thin flex flex-col gap-1 pr-1">
                {filtrados.map(valor => (
                    <button
                        key={valor}
                        type="button"
                        onClick={() => onAlternar(valor)}
                        className="flex items-center text-left text-[12px] font-garet text-graphite hover:text-purple cursor-pointer"
                    >
                        <Checkbox checked={seleccionados.includes(valor)} onChange={() => onAlternar(valor)} />
                        <span className="truncate">{valor}</span>
                    </button>
                ))}
                {filtrados.length === 0 && (
                    <span className="text-[11px] font-garet text-[#8A94A6]">Sin coincidencias</span>
                )}
            </div>
        </div>
    );
};

const MenuColumna = ({
    columna, campos, municipios, descriptor, orden, onAplicar, onLimpiar, onOrdenar, onCerrar,
}) => {
    const familia = municipios ? 'lista' : familiaDeColumna(columna, campos);
    const campo = (campos || []).find(item => item.nombre === columna);
    const valores = municipios || campo?.valores || [];
    const actual = descriptor?.familia === familia ? descriptor : null;

    const alternarValor = (valor) => {
        const previos = actual?.valores || [];
        const siguientes = previos.includes(valor)
            ? previos.filter(item => item !== valor)
            : [...previos, valor];
        onAplicar({ familia: 'lista', valores: siguientes });
    };

    return (
        <div className="w-60 p-3 flex flex-col gap-2.5 rounded-[10px] bg-white shadow-[0_5px_20px_#1A26641A] border border-[#EAEFFA]">
            <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] font-garet font-bold text-purple truncate">{columna}</span>
                <button
                    type="button"
                    onClick={onCerrar}
                    aria-label="Cerrar el menú de la columna"
                    className="text-[14px] leading-none text-[#8A94A6] hover:text-purple cursor-pointer"
                >
                    ✕
                </button>
            </div>

            <div className="flex gap-1.5">
                <button
                    type="button"
                    onClick={onOrdenar}
                    className="flex-1 h-7 rounded border border-[#DCE3F0] text-[11px] font-garet text-graphite hover:border-purple hover:text-purple cursor-pointer"
                >
                    {orden?.columna === columna && !orden.descendente ? 'Orden ↑' : 'Ordenar ↑'}
                </button>
                <button
                    type="button"
                    onClick={onOrdenar}
                    className="flex-1 h-7 rounded border border-[#DCE3F0] text-[11px] font-garet text-graphite hover:border-purple hover:text-purple cursor-pointer"
                >
                    {orden?.columna === columna && orden.descendente ? 'Orden ↓' : 'Ordenar ↓'}
                </button>
            </div>

            {familia === 'lista' && (
                <ListaValores
                    valores={valores}
                    seleccionados={actual?.valores || []}
                    onAlternar={alternarValor}
                />
            )}

            {familia === 'texto' && (
                <input
                    type="search"
                    value={actual?.contiene || ''}
                    onChange={event => onAplicar({ familia: 'texto', contiene: event.target.value })}
                    placeholder="Contiene…"
                    className={CLASE_CAMPO}
                />
            )}

            {familia === 'numero' && (
                <div className="flex gap-1.5">
                    <input
                        type="number"
                        value={Number.isFinite(actual?.min) ? actual.min : ''}
                        onChange={event => onAplicar({
                            familia: 'numero',
                            min: event.target.value === '' ? null : Number(event.target.value),
                            max: actual?.max ?? null,
                        })}
                        placeholder="Mínimo"
                        className={CLASE_CAMPO}
                    />
                    <input
                        type="number"
                        value={Number.isFinite(actual?.max) ? actual.max : ''}
                        onChange={event => onAplicar({
                            familia: 'numero',
                            min: actual?.min ?? null,
                            max: event.target.value === '' ? null : Number(event.target.value),
                        })}
                        placeholder="Máximo"
                        className={CLASE_CAMPO}
                    />
                </div>
            )}

            {familia === 'fecha' && (
                <div className="flex flex-col gap-1.5">
                    <input
                        type="date"
                        value={actual?.desde || ''}
                        onChange={event => onAplicar({ familia: 'fecha', desde: event.target.value, hasta: actual?.hasta || '' })}
                        className={CLASE_CAMPO}
                    />
                    <input
                        type="date"
                        value={actual?.hasta || ''}
                        onChange={event => onAplicar({ familia: 'fecha', desde: actual?.desde || '', hasta: event.target.value })}
                        className={CLASE_CAMPO}
                    />
                </div>
            )}

            {familia === 'booleano' && (
                <div className="flex gap-1.5">
                    {[['Sí', true], ['No', false]].map(([texto, valor]) => (
                        <button
                            key={texto}
                            type="button"
                            onClick={() => onAplicar({ familia: 'booleano', valor: actual?.valor === valor ? null : valor })}
                            className={`flex-1 h-7 rounded border text-[11px] font-garet cursor-pointer ${actual?.valor === valor ? 'border-purple text-purple' : 'border-[#DCE3F0] text-graphite hover:border-purple'}`}
                        >
                            {texto}
                        </button>
                    ))}
                </div>
            )}

            <button
                type="button"
                onClick={onLimpiar}
                className="h-7 rounded text-[11px] font-garet text-[#8A94A6] hover:text-purple cursor-pointer"
            >
                Quitar el filtro de esta columna
            </button>
        </div>
    );
};

export default MenuColumna;
