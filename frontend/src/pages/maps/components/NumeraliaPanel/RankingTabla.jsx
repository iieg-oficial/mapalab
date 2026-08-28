import ScrollContainer from '@components/ScrollContainer';
import DropdownPill from '@components/DropdownPill';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { admiteProporcion } from '@hooksMaps/useNumeraliaRanking';

const RankingTabla = ({ ranking, filas, indice, onIndice, porcentaje, onPorcentaje, resaltadas, claves }) => {
    const proporcionable = admiteProporcion(ranking, indice);

    return (
        <div className="min-w-[280px] font-garet">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                <DropdownPill
                    etiqueta="Indicador del ranking"
                    valor={String(indice)}
                    onCambio={(v) => onIndice(Number(v))}
                    opciones={ranking.slots.map((slot, i) => ({ valor: String(i), texto: slot.nombre }))}
                />
                {proporcionable && (
                    <DropdownPill
                        etiqueta="Cómo ordenar el ranking"
                        valor={porcentaje ? 'pct' : 'abs'}
                        onCambio={(v) => onPorcentaje(v === 'pct')}
                        opciones={[
                            { valor: 'abs', texto: 'Total' },
                            { valor: 'pct', texto: '% del municipio' },
                        ]}
                    />
                )}
            </div>

            <ScrollContainer className="max-h-60 -mx-1 px-1" overlayFade overlayColor="#F9FBFF">
                <ol>
                    {filas.map(fila => {
                        const marcada = resaltadas.has(fila.llave);
                        return (
                            <li
                                key={fila.llave}
                                className={`grid grid-cols-[20px_1fr_auto] gap-2 items-center py-1 rounded-lg px-1 ${marcada
                                    ? 'sticky top-0 bottom-0 z-10 bg-[#FFF3E6] shadow-[0_2px_8px_#1A26641A]'
                                    : ''}`}
                            >
                                <span className="text-[10px]/[13px] text-[#8894AE] tabular-nums text-right">
                                    {fila.posicion}
                                </span>
                                <span className="min-w-0 flex items-baseline gap-1">
                                    <span
                                        className={`text-[13px]/[18px] truncate ${marcada ? 'font-bold text-purple' : 'text-[#454545]'}`}
                                        title={fila.llave}
                                    >
                                        {fila.llave}
                                    </span>
                                    {claves.get(fila.llave) && (
                                        <span className="text-[10px]/[13px] text-gray-400 tabular-nums shrink-0">
                                            {claves.get(fila.llave)}
                                        </span>
                                    )}
                                </span>
                                <span className="flex items-baseline gap-1.5 justify-end tabular-nums">
                                    <span className="text-[13px]/[18px] font-bold text-orange">
                                        {formatNumber(String(fila.bruto))}
                                    </span>
                                    {fila.porcentaje !== null && (
                                        <span className="text-[10px]/[13px] text-gray-400 w-10 text-right">
                                            {fila.porcentaje.toFixed(1)}%
                                        </span>
                                    )}
                                </span>
                            </li>
                        );
                    })}
                </ol>
            </ScrollContainer>

            <p className="-mb-2.5 text-right text-[10px]/[13px] text-[#8894AE]">
                {filas.length} municipios con dato
            </p>
        </div>
    );
};

export default RankingTabla;
