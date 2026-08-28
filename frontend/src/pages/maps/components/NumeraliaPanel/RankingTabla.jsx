import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { admiteProporcion } from '@hooksMaps/useNumeraliaRanking';

const Selector = ({ valor, onCambio, opciones, etiqueta }) => (
    <label className="inline-flex items-center rounded-full bg-[#EFF3FC] pl-2 pr-1 py-0.5">
        <span className="sr-only">{etiqueta}</span>
        <select
            value={valor}
            onChange={(evento) => onCambio(evento.target.value)}
            aria-label={etiqueta}
            className="bg-transparent text-[10px]/[13px] font-semibold text-[#2E4372] outline-none cursor-pointer max-w-44 truncate"
        >
            {opciones.map(opcion => (
                <option key={opcion.valor} value={opcion.valor}>{opcion.texto}</option>
            ))}
        </select>
    </label>
);

const RankingTabla = ({ ranking, filas, indice, onIndice, porcentaje, onPorcentaje, resaltadas }) => {
    const proporcionable = admiteProporcion(ranking, indice);

    return (
        <div className="min-w-[260px]">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <Selector
                    etiqueta="Indicador del ranking"
                    valor={String(indice)}
                    onCambio={(v) => onIndice(Number(v))}
                    opciones={ranking.slots.map((slot, i) => ({ valor: String(i), texto: slot.nombre }))}
                />
                {proporcionable && (
                    <Selector
                        etiqueta="Cómo ordenar el ranking"
                        valor={porcentaje ? 'pct' : 'abs'}
                        onCambio={(v) => onPorcentaje(v === 'pct')}
                        opciones={[
                            { valor: 'abs', texto: 'Total' },
                            { valor: 'pct', texto: '% del municipio' },
                        ]}
                    />
                )}
                <span className="text-[10px]/[13px] text-[#8894AE] ml-auto">
                    {filas.length} municipios
                </span>
            </div>

            <ol className="max-h-56 overflow-auto scrollbar-thin pr-1">
                {filas.map(fila => {
                    const marcada = resaltadas.has(fila.llave);
                    return (
                        <li
                            key={fila.llave}
                            className={`grid grid-cols-[18px_1fr_56px_44px] gap-2 items-center py-[3px] border-b border-[#E9EEF8] last:border-0 ${marcada ? 'bg-[#F3ECF7] rounded px-1 -mx-1' : ''}`}
                        >
                            <span className="text-[9px]/[12px] text-[#8894AE] tabular-nums text-right">{fila.posicion}</span>
                            <span className={`text-[10px]/[13px] truncate ${marcada ? 'font-bold text-purple' : 'text-[#2E4372]'}`} title={fila.llave}>
                                {fila.llave}
                            </span>
                            <span className="text-[11px]/[14px] font-bold text-[#2E4372] tabular-nums text-right">
                                {formatNumber(String(fila.bruto))}
                            </span>
                            <span className="text-[10px]/[13px] font-bold text-[#B85C00] tabular-nums text-right">
                                {fila.porcentaje === null ? '' : `${fila.porcentaje.toFixed(1)}%`}
                            </span>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
};

export default RankingTabla;
