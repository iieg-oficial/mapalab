import Icon from '@components/Icon';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { MAX_FILTROS, esCompleta, operadoresDe } from '@hooksMaps/useStatsBuilder';
import ConstructorFila, { Campo, Paso, Texto } from './ConstructorFila';

const Cadena = ({ receta }) => {
    if (receta?.tipo !== 'primitiva' || !receta.pasos?.length) return null;
    const valores = receta.pasos.filter(p => p.valor !== null).map(p => formatNumber(String(p.valor)));
    if (valores.length < 2) return null;
    return <span className="block text-[8px]/[10px] text-[#8894AE]">{valores.join(' → ')}</span>;
};

const Constructor = ({ catalogo, definicion, onDefinicion, previa, calculando, onGuardar, lleno }) => {
    if (!catalogo) {
        return <p className="text-[11px]/[14px] font-garet text-[#8894AE] py-2">Cargando columnas…</p>;
    }

    const operacion = catalogo.operaciones.find(o => o.clave === definicion.operation);
    const camposDe = (tipos) => catalogo.campos.filter(c => !tipos || tipos.includes(c.tipo));
    const numericos = camposDe(['numero', 'fecha']);

    const cambiar = (parche) => onDefinicion({ ...definicion, ...parche });

    const cambiarFiltro = (indice, parche) => cambiar({
        filters: definicion.filters.map((f, i) => (i === indice ? { ...f, ...parche } : f)),
    });

    const agregarFiltro = () => {
        const primero = catalogo.campos[0];
        if (!primero) return;
        cambiar({
            filters: [...definicion.filters, {
                field: primero.nombre,
                op: operadoresDe(primero.tipo)[0].clave,
                value: null,
            }],
        });
    };

    const restantes = MAX_FILTROS - definicion.filters.length;

    return (
        <div className="flex flex-col gap-2 min-w-[300px] font-garet">
            <Paso numero={1}>
                <Texto>Quiero</Texto>
                <Campo
                    etiqueta="Operación"
                    valor={definicion.operation}
                    onCambio={(v) => cambiar({ operation: v, field: null })}
                    opciones={catalogo.operaciones.map(o => ({ valor: o.clave, texto: o.nombre }))}
                />
                {operacion?.requiereCampo && (
                    <>
                        <Texto>de</Texto>
                        <Campo
                            etiqueta="Columna a operar"
                            valor={definicion.field ?? ''}
                            onCambio={(v) => cambiar({ field: v })}
                            opciones={[
                                { valor: '', texto: 'elige columna…' },
                                ...numericos.map(c => ({ valor: c.nombre, texto: c.nombre })),
                            ]}
                        />
                    </>
                )}
            </Paso>

            {definicion.filters.map((filtro, indice) => (
                <ConstructorFila
                    key={indice}
                    numero={indice + 2}
                    filtro={filtro}
                    campos={catalogo.campos}
                    onCambio={(parche) => cambiarFiltro(indice, parche)}
                    onQuitar={() => cambiar({ filters: definicion.filters.filter((_, i) => i !== indice) })}
                />
            ))}

            {restantes > 0 && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={agregarFiltro}
                        className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full border border-purple bg-white text-purple text-[11px]/[14px] font-garet font-bold transition-colors cursor-pointer hover:bg-purple-soft"
                    >
                        <Icon name="crear" className="size-3.5" />
                        Agregar condición
                    </button>
                </div>
            )}

            <Paso numero={definicion.filters.length + 2}>
                <Texto>y se llama</Texto>
                <input
                    type="text"
                    value={definicion.label}
                    maxLength={40}
                    onChange={(evento) => cambiar({ label: evento.target.value })}
                    placeholder="Ponle nombre"
                    aria-label="Nombre de la estadística"
                    className="w-48 rounded-md border border-[#DDE4F2] bg-white px-1.5 py-0.5 text-[10px]/[14px] text-[#2E4372] outline-none focus:border-purple"
                />
                <Texto>{definicion.label.length}/40</Texto>
            </Paso>

            <div className="flex items-center justify-between gap-3 rounded-lg bg-[#EFF3FC] px-2.5 py-1.5 mt-0.5">
                <span className="min-w-0">
                    <span className="block text-[9px]/[12px] text-[#465055]">
                        Vista previa
                        <span className="text-[#8894AE]"> · quedan {restantes} de {MAX_FILTROS} condiciones</span>
                    </span>
                    <Cadena receta={previa?.receta} />
                </span>
                <span className="flex items-center gap-2 shrink-0">
                    <strong className="text-[15px]/[16px] text-orange tabular-nums">
                        {calculando ? '…' : (previa?.valor ? formatNumber(String(previa.valor)) : '—')}
                    </strong>
                    <button
                        type="button"
                        onClick={onGuardar}
                        disabled={!esCompleta(definicion) || !previa || lleno}
                        className="rounded-full bg-purple text-white px-3 py-1 text-[10px]/[13px] font-semibold cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Guardar
                    </button>
                </span>
            </div>

            {lleno && (
                <p className="text-[9px]/[12px] text-[#8894AE]">
                    Ya tienes el máximo de estadísticas propias en esta capa. Quita una para agregar otra.
                </p>
            )}
        </div>
    );
};

export default Constructor;
