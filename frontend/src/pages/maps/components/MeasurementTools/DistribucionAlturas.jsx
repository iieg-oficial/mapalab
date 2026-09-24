import Tooltip from '@components/Tooltip';
import { formatNumber } from '@pages/maps/helpers/formatNumber';

const metros = (valor) => formatNumber(Math.round(valor));

const DistribucionAlturas = ({ distribucion }) => {
    const mayor = Math.max(...distribucion.franjas.map(f => f.pct)) || 1;
    const franjas = [...distribucion.franjas].reverse();

    return (
        <div className="flex flex-col gap-1" role="list" aria-label="Distribución de alturas dentro del área">
            {franjas.map(({ desde, hasta, pct }) => {
                const rango = `${metros(desde)}–${metros(hasta)} m`;
                return (
                    <Tooltip key={desde} content={`${pct.toFixed(1)} % del área entre ${rango}`} placement="right" triggerClassName="block w-full">
                        <div role="listitem" className="group grid w-full grid-cols-[88px_1fr_36px] items-center gap-2 py-0.5 font-garet text-[11px] text-[#7B8388]">
                            <span className="tabular-nums whitespace-nowrap">{rango}</span>
                            <span className="h-2.5 rounded-r-[4px] bg-[#EEEBF2]">
                                <span
                                    className="block h-full rounded-r-[4px] bg-[#5C2472] group-hover:bg-[#70308A] transition-colors"
                                    style={{ width: `${(pct / mayor) * 100}%` }}
                                />
                            </span>
                            <span className="tabular-nums text-right text-graphite">{Math.round(pct)} %</span>
                        </div>
                    </Tooltip>
                );
            })}
        </div>
    );
};

export default DistribucionAlturas;
